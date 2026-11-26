// D:\Deepfake-System\frontend\app\manager\users\UserModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { User } from "@/services/managerApi";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: User | null;
    onSubmit: (formData: any) => Promise<void>;
}

export default function UserModal({ isOpen, onClose, editingUser, onSubmit }: UserModalProps) {
    const [formData, setFormData] = useState({
        username: "",
        fullname: "",
        email: "",
        age: 18,
        gender: "male" as "male" | "female" | "other",
        role: "user" as "user" | "manager",
        password: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [validationError, setValidationError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setValidationError("");
            if (editingUser) {
                setFormData({
                    username: editingUser.username || "",
                    fullname: editingUser.fullname || "",
                    email: editingUser.email || "",
                    age: editingUser.age || 18,
                    gender: (editingUser.gender as "male" | "female" | "other") || "male",
                    role: editingUser.role || "user",
                    password: "" // Không tự điền mật khẩu cũ vì lý do bảo mật
                });
            } else {
                setFormData({
                    username: "",
                    fullname: "",
                    email: "",
                    age: 18,
                    gender: "male",
                    role: "user",
                    password: ""
                });
            }
        }
    }, [isOpen, editingUser]);

    if (!isOpen) return null;

    // Validate nhanh tại Client-side trước khi đẩy lên Backend
    const validateForm = (): boolean => {
        // Kiểm tra username
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(formData.username)) {
            setValidationError("Tên tài khoản phải từ 3-20 ký tự, không bao gồm ký tự đặc biệt.");
            return false;
        }

        // Kiểm tra fullname (chỉ chữ và khoảng trắng)
        const fullnameRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/;
        if (!fullnameRegex.test(formData.fullname)) {
            setValidationError("Họ và tên phải từ 2-50 ký tự và chỉ chứa chữ cái.");
            return false;
        }

        // Kiểm tra tuổi
        if (formData.age < 13 || formData.age > 120) {
            setValidationError("Tuổi phải nằm trong khoảng từ 13 đến 120.");
            return false;
        }

        // Kiểm tra mật khẩu (đối với tạo mới hoặc khi cập nhật mật khẩu mới)
        if (!editingUser && !formData.password) {
            setValidationError("Vui lòng nhập mật khẩu khởi tạo.");
            return false;
        }

        if (formData.password && formData.password.length < 8) {
            setValidationError("Mật khẩu mới phải có độ dài tối thiểu là 8 ký tự.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError("");
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const payload: any = { ...formData };
            if (editingUser && !payload.password) {
                delete payload.password;
            }
            
            console.log("Đang gửi dữ liệu tới API:", payload); // Kiểm tra dữ liệu
            await onSubmit(payload);
            console.log("API gọi thành công"); // Kiểm tra xem có chạy tới đây không
            onClose();
        } catch (err: any) {
            console.error("Lỗi khi gọi API:", err); // Kiểm tra lỗi cụ thể
            setValidationError(err.message || "Thao tác thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#2C2621]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white border border-[#EAE3D2] rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 text-[#2C2621] overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="p-6 border-b border-[#EAE3D2] flex justify-between items-center bg-[#FAF6F0]">
                    <div>
                        <h3 className="text-lg font-extrabold text-[#2C2621]">
                            {editingUser ? `Chỉnh sửa: ${editingUser.username}` : "Thêm Tài Khoản Mới"}
                        </h3>
                        <p className="text-xs text-[#8C7A6B] mt-1 font-medium">
                            {editingUser ? "Cập nhật dữ liệu hoặc đặt lại mật khẩu của người dùng" : "Cung cấp đầy đủ các thông tin cá nhân cơ bản"}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={submitting}
                        className="p-2 rounded-xl text-[#8C7A6B] hover:text-[#2C2621] hover:bg-white transition disabled:opacity-50 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    
                    {validationError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                            ⚠️ {validationError}
                        </div>
                    )}

                    {/* Dòng 1: Username & Fullname */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-[#8C7A6B] mb-1.5 tracking-wider">Tên tài khoản (Username)</label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                placeholder="Ví dụ: nguyenvana"
                                className="w-full bg-[#FAF6F0] border border-[#EAE3D2] rounded-xl px-3.5 py-2 text-sm text-[#2C2621] focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-[#8C7A6B] mb-1.5 tracking-wider">Họ và tên (Fullname)</label>
                            <input
                                type="text"
                                required
                                value={formData.fullname}
                                onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                className="w-full bg-[#FAF6F0] border border-[#EAE3D2] rounded-xl px-3.5 py-2 text-sm text-[#2C2621] focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition font-medium"
                            />
                        </div>
                    </div>

                    {/* Dòng 2: Email */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-[#8C7A6B] mb-1.5 tracking-wider">Địa chỉ Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="example@domain.com"
                            className="w-full bg-[#FAF6F0] border border-[#EAE3D2] rounded-xl px-3.5 py-2 text-sm text-[#2C2621] focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition font-medium"
                        />
                    </div>

                    {/* Dòng 3: Tuổi (Age) & Giới tính (Gender) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-[#8C7A6B] mb-1.5 tracking-wider">Tuổi (Age)</label>
                            <input
                                type="number"
                                required
                                min={13}
                                max={120}
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 18})}
                                className="w-full bg-[#FAF6F0] border border-[#EAE3D2] rounded-xl px-3.5 py-2 text-sm text-[#2C2621] focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold uppercase text-[#8C7A6B] mb-1.5 tracking-wider">Giới tính (Gender)</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                                className="w-full bg-[#FAF6F0] border border-[#EAE3D2] rounded-xl px-3.5 py-2 text-sm text-[#2C2621] focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition font-medium"
                            >
                                <option value="male">Nam (Male)</option>
                                <option value="female">Nữ (Female)</option>
                                <option value="other">Khác (Other)</option>
                            </select>
                        </div>
                    </div>

                    {/* Dòng 4: Vai trò (Role) */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-[#8C7A6B] mb-1.5 tracking-wider">Vai trò hệ thống</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value as "user" | "manager"})}
                            className="w-full bg-[#FAF6F0] border border-[#EAE3D2] rounded-xl px-3.5 py-2 text-sm text-[#2C2621] focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition font-medium"
                        >
                            <option value="user">USER (Người dùng cơ bản)</option>
                            <option value="manager">MANAGER (Quản trị viên)</option>
                        </select>
                    </div>

                    {/* Dòng 5: Mật khẩu (Password) */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-[#8C7A6B] mb-1.5 tracking-wider">
                            {editingUser ? "Mật khẩu mới (Để trống nếu không thay đổi)" : "Mật khẩu khởi tạo"}
                        </label>
                        <input
                            type="password"
                            required={!editingUser}
                            placeholder={editingUser ? "Nhập nếu muốn đặt lại mật khẩu mới" : "Yêu cầu từ 8 ký tự trở lên"}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-[#FAF6F0] border border-[#EAE3D2] rounded-xl px-3.5 py-2 text-sm text-[#2C2621] focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition font-medium"
                        />
                    </div>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE3D2]">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-white border border-[#EAE3D2] text-[#5C5246] hover:text-[#2C2621] hover:bg-[#FAF6F0] text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl bg-[#2C2621] hover:bg-[#423932] text-[#FAF6F0] text-xs font-semibold shadow-md shadow-stone-900/10 transition disabled:opacity-50 cursor-pointer"
                        >
                            {submitting ? "Đang xử lý..." : editingUser ? "Cập nhật" : "Tạo tài khoản"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}