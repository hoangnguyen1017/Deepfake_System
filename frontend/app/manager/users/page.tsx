// D:\Deepfake-System\frontend\app\manager\users\page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/utils/auth";
import { managerApi, User, PredictionHistory, ManagerStats } from "@/services/managerApi";
import { getProfile } from "@/services/profileApi";
import { clearTokens } from "@/utils/storage";
import { 
    Search, ShieldAlert, Shield, Loader2, Home, 
    FileSpreadsheet, Upload, UserPlus, Users, ShieldCheck, 
    Activity, BarChart3, X, MessageSquare, BarChart2,
    LogOut, CheckCircle2
} from "lucide-react";
import UserModal from "./UserModal";
import UserTable from "./UserTable";
import HistoryModal from "./HistoryModal";
import ManagerFeedbackModal from "./ManagerFeedbackModal";
import AnalyticsModal from "./AnalyticsModal";

export default function UserManagementPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [role, setRole] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<ManagerStats>({
        total_users: 0,
        active_users: 0,
        total_scans: 0,
        fake_detected_ratio: 0
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [importing, setImporting] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    // --- STATE ĐẾM FEEDBACK CHỜ XỬ LÝ ---
    const [pendingFeedbackCount, setPendingFeedbackCount] = useState<number>(0);

    // --- STATE PHÂN TRANG (PAGINATION) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [importResult, setImportResult] = useState<{
        success: boolean;
        imported_count: number;
        errors: string[];
    } | null>(null);

    // --- STATE ANALYTICS MODAL ---
    const [analyticsOpen, setAnalyticsOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userHistory, setUserHistory] = useState<PredictionHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [userModalOpen, setUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // --- STATE MODAL FEEDBACK ---
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

    // Hàm tải số lượng Feedback chưa xử lý an toàn
    const fetchPendingFeedbacks = async () => {
        try {
            const pendingList = await managerApi.getAllFeedbacks("pending");
            if (Array.isArray(pendingList)) {
                setPendingFeedbackCount(pendingList.length);
            }
        } catch (err: any) {
            console.warn("Chưa thể lấy đếm feedback:", err.message || err);
            setPendingFeedbackCount(0);
        }
    };

    useEffect(() => {
        const userRole = getUserRole();
        if (!userRole || userRole !== "manager") {
            router.push("/unauthorized");
        } else {
            setRole(userRole);
            loadPageData();
            fetchPendingFeedbacks();
            getProfile()
                .then(profile => setUsername(profile.username))
                .catch(() => setUsername("Manager"));
        }
    }, [router]);

    // Tải lại số đếm pending khi đóng modal feedback
    useEffect(() => {
        if (!feedbackModalOpen) {
            fetchPendingFeedbacks();
        }
    }, [feedbackModalOpen]);

    // Reset về trang 1 khi người dùng tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const loadPageData = async () => {
        setLoading(true);
        setError("");
        try {
            const [usersData, statsData] = await Promise.all([
                managerApi.getUsers(),
                managerApi.getStats().catch(() => ({
                    total_users: 0, active_users: 0, total_scans: 0, fake_detected_ratio: 0
                }))
            ]);
            setUsers(usersData);
            setStats(statsData);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu hệ thống.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearTokens();
        router.push("/");
    };

    const handleToggleStatus = async (user: User) => {
        setActionLoading(user.user_id);
        const nextStatus = !user.is_active;
        try {
            await managerApi.toggleUserStatus(user.user_id, nextStatus);
            setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, is_active: nextStatus } : u));
            setStats(prev => ({
                ...prev,
                active_users: nextStatus ? prev.active_users + 1 : prev.active_users - 1
            }));
        } catch (err: any) {
            alert(err.message || "Không thể cập nhật trạng thái hoạt động.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenAddModal = () => { setEditingUser(null); setUserModalOpen(true); };
    const handleOpenEditModal = (user: User) => { setEditingUser(user); setUserModalOpen(true); };

    const handleFormSubmit = async (formData: any) => {
        setError("");
        try {
            if (editingUser) {
                const updated = await managerApi.updateUser(editingUser.user_id, formData);
                setUsers(prev => prev.map(u => u.user_id === editingUser.user_id ? updated : u));
            } else {
                const created = await managerApi.createUser(formData);
                setUsers(prev => [created, ...prev]);
            }
            setUserModalOpen(false);
        } catch (err: any) {
            setError(err.message || "Không thể cập nhật.");
            throw err;
        }
    };

    const handleExport = async (format: "csv" | "xlsx") => {
        try {
            const blob = await managerApi.exportUsers(format);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `danh_sach_user_${new Date().toISOString().slice(0, 10)}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err: any) {
            alert("Xuất file thất bại: " + err.message);
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setImporting(true);
        setImportResult(null);
        let totalImported = 0;
        let allErrors: string[] = [];
        try {
            for (let i = 0; i < files.length; i++) {
                const result = await managerApi.importUsers(files[i]);
                totalImported += result.imported_count;
                if (result.errors) allErrors = [...allErrors, ...result.errors.map(err => `[File: ${files[i].name}] ${err}`)];
            }
            setImportResult({ success: true, imported_count: totalImported, errors: allErrors });
            loadPageData();
        } catch (err: any) { setError(err.message || "Import thất bại."); } 
        finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm("Bạn có chắc muốn xóa vĩnh viễn tài khoản này?")) return;
        setActionLoading(userId);
        try {
            await managerApi.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.user_id !== userId));
            loadPageData();
        } catch (err: any) { alert(err.message); } finally { setActionLoading(null); }
    };

    const handleViewHistory = async (user: User) => {
        setSelectedUser(user);
        setLoadingHistory(true);
        try {
            const history = await managerApi.getUserHistory(user.user_id);
            setUserHistory(history);
        } catch (err: any) {
            alert(err.message || "Không thể lấy lịch sử.");
            setSelectedUser(null);
        } finally { setLoadingHistory(false); }
    };

    // Lọc người dùng theo từ khóa tìm kiếm
    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    // --- TÍNH TOÁN DỮ LIỆU PHÂN TRANG ---
    const totalItems = filteredUsers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    // Cắt danh sách chỉ lấy 10 item ứng với trang hiện tại
    const currentUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading && users.length === 0) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center bg-[#FAF6F0] text-[#2C2621] min-h-screen">
                <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute w-16 h-16 rounded-full bg-[#8C7A6B]/20 animate-ping" />
                    <Loader2 className="w-10 h-10 animate-spin text-[#8C7A6B] relative z-10" />
                </div>
                <p className="text-[#8C7A6B] text-xs font-semibold tracking-wide">Đang đồng bộ hóa cơ sở dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF6F0] text-[#2C2621] flex flex-col selection:bg-amber-800/10 selection:text-amber-900 antialiased">
            {/* Ambient Glow Effects Tông Be Warm */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-200/20 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute top-[350px] right-0 w-[450px] h-[250px] bg-stone-300/30 blur-[120px] pointer-events-none rounded-full" />

            {/* Top Navigation Bar */}
            <nav className="border-b border-[#EAE3D2] bg-[#FAF6F0]/80 backdrop-blur-xl sticky top-0 z-40 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center shadow-md shadow-stone-800/10">
                            <Shield className="w-5 h-5 text-[#F5EFE6]" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="font-bold text-base sm:text-lg tracking-tight text-[#2C2621] flex items-center gap-2">
                                Manager Portal
                            </h1>
                            <p className="text-[10px] text-[#8C7A6B] font-semibold tracking-wider uppercase hidden sm:block -mt-1">
                                Deepfake Defense System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 border border-[#EAE3D2] hover:border-[#D8CEBE] hover:bg-white text-[#5C5246] hover:text-[#2C2621] text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                            <Home className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="hidden sm:inline">Trang chủ</span>
                        </button>

                        <div className="h-4 w-px bg-[#EAE3D2] hidden sm:block" />

                        <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-[#EAE3D2] rounded-xl px-3 py-1.5 shadow-xs">
                            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            <span className="text-xs text-[#8C7A6B]">
                                Xin chào, <span className="font-semibold text-[#2C2621]">{username}</span>
                            </span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 hover:bg-rose-100 text-xs font-semibold transition active:scale-95 cursor-pointer"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 relative z-10">
                {/* Page Title Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#EAE3D2]">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2C2621]">
                            Bảng Quản Lý Hệ Thống
                        </h1>
                        <p className="text-[#6E6356] text-xs sm:text-sm mt-1">
                            Quản lý người dùng, phân quyền và theo dõi toàn bộ hoạt động quét Deepfake
                        </p>
                    </div>

                    {role?.toLowerCase() === "manager" && (
                        <div className="flex flex-wrap items-center gap-2.5">
                            <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".csv, .xlsx, .xls" multiple className="hidden" />

                            {/* Nút Analytics */}
                            <button 
                                onClick={() => setAnalyticsOpen(true)} 
                                className="flex items-center gap-2 bg-white/80 border border-[#EAE3D2] hover:border-[#8C7A6B] hover:bg-white text-[#5C5246] hover:text-[#2C2621] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                            >
                                <BarChart2 className="w-4 h-4 text-[#8C7A6B]" /> 
                                <span>Thống Kê Chi Tiết</span>
                            </button>

                            {/* Nút Feedback */}
                            <button 
                                onClick={() => setFeedbackModalOpen(true)} 
                                className="relative flex items-center gap-2 bg-white/80 border border-[#EAE3D2] hover:border-[#8C7A6B] hover:bg-white text-[#5C5246] hover:text-[#2C2621] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                            >
                                <MessageSquare className="w-4 h-4 text-[#8C7A6B]" /> 
                                <span>Feedback</span>

                                {pendingFeedbackCount > 0 && (
                                    <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-[#FAF6F0] animate-pulse">
                                        {pendingFeedbackCount > 99 ? "99+" : pendingFeedbackCount}
                                    </span>
                                )}
                            </button>

                            {/* Nút Thêm User */}
                            <button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-[#2C2621] hover:bg-[#423932] text-[#FAF6F0] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-stone-900/10 transition active:scale-95 cursor-pointer">
                                <UserPlus className="w-4 h-4 text-amber-200" /> 
                                <span>Thêm User</span>
                            </button>

                            {/* Nút Import File */}
                            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-2 bg-white/80 border border-[#EAE3D2] hover:border-[#8C7A6B] hover:bg-white text-[#5C5246] hover:text-[#2C2621] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer">
                                {importing ? <Loader2 className="w-4 h-4 animate-spin text-[#8C7A6B]" /> : <Upload className="w-4 h-4 text-[#8C7A6B]" />} 
                                <span>Import</span>
                            </button>

                            {/* Nút Export Excel */}
                            <button onClick={() => handleExport("xlsx")} className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> 
                                <span className="hidden lg:inline">Xuất Excel</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Grid Thống Kê Tổng Quan (Beige Warm Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/70 border border-[#EAE3D2] rounded-3xl p-4 sm:p-5 flex items-center gap-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-[#D8CEBE]">
                        <div className="p-3 rounded-2xl bg-[#FAF6F0] text-[#8C7A6B] border border-[#EAE3D2]">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] text-[#8C7A6B] uppercase tracking-wider font-bold">Tổng tài khoản</p>
                            <h3 className="text-2xl font-bold text-[#2C2621] mt-0.5">{stats.total_users}</h3>
                        </div>
                    </div>

                    <div className="bg-white/70 border border-[#EAE3D2] rounded-3xl p-4 sm:p-5 flex items-center gap-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-[#D8CEBE]">
                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] text-[#8C7A6B] uppercase tracking-wider font-bold">Đang hoạt động</p>
                            <h3 className="text-2xl font-bold text-[#2C2621] mt-0.5">{stats.active_users}</h3>
                        </div>
                    </div>

                    <div className="bg-white/70 border border-[#EAE3D2] rounded-3xl p-4 sm:p-5 flex items-center gap-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-[#D8CEBE]">
                        <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] text-[#8C7A6B] uppercase tracking-wider font-bold">Tổng lượt quét</p>
                            <h3 className="text-2xl font-bold text-[#2C2621] mt-0.5">{stats.total_scans}</h3>
                        </div>
                    </div>

                    <div className="bg-white/70 border border-[#EAE3D2] rounded-3xl p-4 sm:p-5 flex items-center gap-4 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-[#D8CEBE]">
                        <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] text-[#8C7A6B] uppercase tracking-wider font-bold">Tỷ lệ Deepfake</p>
                            <h3 className="text-2xl font-bold text-[#2C2621] mt-0.5">{stats.fake_detected_ratio.toFixed(1)}%</h3>
                        </div>
                    </div>
                </div>

                {/* Thông báo kết quả Import */}
                {importResult && (
                    <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start gap-3 backdrop-blur-sm transition-all animate-in fade-in duration-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm text-emerald-900">Import thành công!</h3>
                            <p className="text-xs text-emerald-700 mt-0.5">Đã thêm thành công {importResult.imported_count} tài khoản vào hệ thống.</p>
                            {importResult.errors && importResult.errors.length > 0 && (
                                <ul className="mt-2 text-xs text-rose-700 list-disc list-inside space-y-0.5">
                                    {importResult.errors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button onClick={() => setImportResult(null)} className="text-[#8C7A6B] hover:text-[#2C2621] p-1 rounded-lg hover:bg-white/60 transition cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Thanh tìm kiếm người dùng */}
                <div className="bg-white/70 border border-[#EAE3D2] rounded-2xl p-3.5 flex items-center justify-between gap-4 shadow-xs backdrop-blur-xl">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo username, email..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                            className="w-full bg-[#FAF6F0] border border-[#EAE3D2] focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 rounded-xl pl-10 pr-8 py-2 text-xs sm:text-sm text-[#2C2621] placeholder-[#8C7A6B]/60 focus:outline-none transition-all font-medium" 
                        />
                        {search && (
                            <button 
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#2C2621] cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Cảnh báo Lỗi */}
                {error && (
                    <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-center gap-3 backdrop-blur-sm animate-in fade-in duration-200">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Bảng danh sách người dùng */}
                <div className="bg-white/70 border border-[#EAE3D2] rounded-3xl overflow-hidden shadow-xl shadow-stone-900/5 backdrop-blur-xl">
                    <UserTable 
                        users={currentUsers} 
                        actionLoading={actionLoading}
                        onToggleStatus={handleToggleStatus}
                        onViewHistory={handleViewHistory}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteUser}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>

                {/* --- CÁC MODAL ĐIỀU HƯỚNG --- */}
                <UserModal 
                    isOpen={userModalOpen}
                    onClose={() => setUserModalOpen(false)}
                    editingUser={editingUser}
                    onSubmit={handleFormSubmit}
                />

                <HistoryModal 
                    isOpen={!!selectedUser}
                    user={selectedUser}
                    history={userHistory}
                    loading={loadingHistory}
                    onClose={() => setSelectedUser(null)}
                />

                <ManagerFeedbackModal
                    isOpen={feedbackModalOpen}
                    onClose={() => setFeedbackModalOpen(false)}
                />

                {/* Modal Thống Kê Analytics Nâng Cao */}
                <AnalyticsModal 
                    isOpen={analyticsOpen} 
                    onClose={() => setAnalyticsOpen(false)} 
                />
            </main>
        </div>
    );
}