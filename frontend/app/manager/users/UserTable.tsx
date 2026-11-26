// D:\Deepfake-System\frontend\app\manager\users\UserTable.tsx
import { 
    Shield, ShieldCheck, Unlock, Lock, Eye, Edit2, Trash2, 
    ChevronLeft, ChevronRight, Loader2 
} from "lucide-react";
import { User } from "@/services/managerApi";

interface UserTableProps {
    users: User[];
    actionLoading: number | null;
    onToggleStatus: (user: User) => void;
    onViewHistory: (user: User) => void;
    onEdit: (user: User) => void;
    onDelete: (userId: number) => void;

    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
}

export default function UserTable({ 
    users = [], 
    actionLoading, 
    onToggleStatus, 
    onViewHistory, 
    onEdit, 
    onDelete,
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange
}: UserTableProps) {
    const safeCurrentPage = Number.isNaN(currentPage) ? 1 : currentPage;
    const safeTotalPages = Number.isNaN(totalPages) || totalPages < 1 ? 1 : totalPages;
    const safeTotalItems = Number.isNaN(totalItems) ? 0 : totalItems;

    const startItem = safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(safeCurrentPage * itemsPerPage, safeTotalItems);

    const handlePageChange = (newPage: number) => {
        if (onPageChange && typeof onPageChange === "function") {
            onPageChange(newPage);
        }
    };

    return (
        <div className="w-full">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                        <tr className="bg-[#FAF6F0] border-b border-[#EAE3D2] text-[#8C7A6B] font-bold uppercase text-[10px] tracking-wider">
                            <th className="p-4 w-12 text-center">STT</th>
                            <th className="p-4">Tài khoản & Email</th>
                            <th className="p-4">Thông tin cá nhân</th>
                            <th className="p-4">Vai trò</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D2]/60">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-[#8C7A6B] text-sm font-medium">
                                    Không tìm thấy dữ liệu người dùng nào phù hợp.
                                </td>
                            </tr>
                        ) : (
                            users.map((u, index) => {
                                const stt = (safeCurrentPage - 1) * itemsPerPage + index + 1;
                                const isLoadingThis = actionLoading === u.user_id;

                                return (
                                    <tr key={u.user_id} className="hover:bg-white/60 transition-colors group">
                                        <td className="p-4 text-center text-[#8C7A6B] font-mono text-xs">{stt}</td>
                                        
                                        <td className="p-4">
                                            <div className="font-semibold text-[#2C2621] group-hover:text-amber-900 transition-colors">{u.username}</div>
                                            <div className="text-xs text-[#8C7A6B] mt-0.5">{u.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-[#2C2621] font-medium">{u.fullname || "Chưa cập nhật"}</div>
                                            <div className="text-xs text-[#8C7A6B] mt-0.5">
                                                {u.age} tuổi • {u.gender === 'male' ? 'Nam' : u.gender === 'female' ? 'Nữ' : 'Khác'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-semibold border ${
                                                u.role === "manager" 
                                                    ? "bg-amber-900/10 text-amber-900 border-amber-900/20" 
                                                    : "bg-stone-200/60 text-[#5C5246] border-[#EAE3D2]"
                                            }`}>
                                                {u.role === "manager" ? <ShieldCheck className="w-3 h-3 text-amber-800" /> : <Shield className="w-3 h-3 text-[#8C7A6B]" />}
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => onToggleStatus(u)} 
                                                disabled={actionLoading !== null} 
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer border transition active:scale-95 disabled:opacity-50 ${
                                                    u.is_active !== false 
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                                }`}
                                            >
                                                {isLoadingThis ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : u.is_active !== false ? (
                                                    <><Unlock className="w-3 h-3" /> Hoạt động</>
                                                ) : (
                                                    <><Lock className="w-3 h-3" /> Khóa</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => onViewHistory(u)} 
                                                    title="Xem lịch sử quét"
                                                    className="p-2 rounded-xl bg-white border border-[#EAE3D2] hover:border-[#8C7A6B] text-[#5C5246] hover:text-[#2C2621] transition active:scale-95 cursor-pointer shadow-xs"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => onEdit(u)} 
                                                    title="Chỉnh sửa thông tin"
                                                    className="p-2 rounded-xl bg-white border border-[#EAE3D2] hover:border-amber-700 text-amber-800 hover:text-amber-900 transition active:scale-95 cursor-pointer shadow-xs"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(u.user_id)} 
                                                    title="Xóa tài khoản"
                                                    className="p-2 rounded-xl bg-white border border-[#EAE3D2] hover:border-rose-300 text-rose-700 hover:text-rose-800 hover:bg-rose-50 transition active:scale-95 cursor-pointer shadow-xs"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-[#EAE3D2] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FAF6F0]/60">
                <div className="text-xs text-[#8C7A6B] font-medium">
                    Hiển thị <span className="font-bold text-[#2C2621]">{startItem}</span> - <span className="font-bold text-[#2C2621]">{endItem}</span> trên tổng số <span className="font-bold text-[#2C2621]">{safeTotalItems}</span> tài khoản
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(safeCurrentPage - 1)}
                        disabled={safeCurrentPage <= 1}
                        className="p-2 rounded-xl bg-white border border-[#EAE3D2] hover:bg-[#FAF6F0] text-[#5C5246] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-xs"
                        title="Trang trước"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-[#EAE3D2] rounded-xl text-[#2C2621] font-mono shadow-xs">
                        Trang <span className="text-amber-800 font-bold">{safeCurrentPage}</span> / {safeTotalPages}
                    </div>

                    <button
                        onClick={() => handlePageChange(safeCurrentPage + 1)}
                        disabled={safeCurrentPage >= safeTotalPages}
                        className="p-2 rounded-xl bg-white border border-[#EAE3D2] hover:bg-[#FAF6F0] text-[#5C5246] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shadow-xs"
                        title="Trang kế tiếp"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}