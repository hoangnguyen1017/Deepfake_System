"use client";

import { useState, useRef, DragEvent } from "react";
import { UploadCloud, Trash2, Loader2, Video as VideoIcon, AlertCircle } from "lucide-react";

type Props = {
    previewUrl: string;
    onChange: (file: File | null) => void;
    onDetect: () => void;
    loading: boolean;
    error: string;
    isLoggedIn: boolean;
    onRequireLogin: () => void;
};

export default function VideoUploader({
    previewUrl,
    onChange,
    onDetect,
    loading,
    error,
    isLoggedIn,
    onRequireLogin,
}: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (isLoggedIn) setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isLoggedIn) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith("video/")) {
                onChange(file);
            }
        }
    };

    return (
        <div className="glass rounded-3xl p-6 shadow-xl transition-all border border-[#EAE3D2] bg-white/70 text-[#2C2621] flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-[#2C2621] flex items-center gap-2">
                        <VideoIcon className="w-6 h-6 text-amber-800" />
                        Tải Video Phân Tích
                    </h1>
                    {previewUrl && !loading && (
                        <button
                            onClick={() => onChange(null)}
                            className="text-xs text-rose-700 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200 transition cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa video
                        </button>
                    )}
                </div>

                {!isLoggedIn && (
                    <div className="mb-5 p-4 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-800" />
                        <span>Vui lòng đăng nhập để sử dụng tính năng nhận diện AI Deepfake.</span>
                    </div>
                )}

                {/* Khung Upload Drag & Drop */}
                {!previewUrl ? (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => isLoggedIn && fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 mb-6 transition-all duration-200 ${
                            isDragging
                                ? "border-amber-800 bg-amber-50/60 scale-[1.01]"
                                : isLoggedIn
                                ? "border-[#D8CEBE] hover:border-[#8C7A6B] bg-[#FAF6F0]/80 cursor-pointer"
                                : "border-[#EAE3D2] opacity-60 cursor-not-allowed bg-[#F5EFE6]"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/mov,video/avi"
                            className="hidden"
                            disabled={!isLoggedIn}
                            onChange={(e) => onChange(e.target.files?.[0] || null)}
                        />

                        <div className="p-4 rounded-full bg-white border border-[#EAE3D2] mb-3 text-amber-800 shadow-sm">
                            <UploadCloud className="w-8 h-8" />
                        </div>

                        <span className="text-[#2C2621] font-semibold text-sm text-center">
                            {isLoggedIn ? "Thả video vào đây hoặc Click để chọn file" : "Cần đăng nhập để upload"}
                        </span>

                        <span className="text-xs text-[#8C7A6B] mt-1">Hỗ trợ MP4, MOV, AVI (Tối đa 50MB)</span>
                    </div>
                ) : (
                    /* Trình Xem Trước Video */
                    <div className="relative rounded-2xl overflow-hidden border border-[#EAE3D2] bg-black mb-6 group">
                        <video src={previewUrl} controls className="w-full max-h-[300px] object-contain rounded-2xl" />
                    </div>
                )}
            </div>

            <div>
                {error && (
                    <div className="mb-4 text-rose-700 text-xs bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <button
                    onClick={() => {
                        if (!isLoggedIn) {
                            onRequireLogin();
                            return;
                        }
                        onDetect();
                    }}
                    disabled={loading || !previewUrl}
                    className={`w-full py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                        loading
                            ? "bg-[#F5EFE6] text-[#8C7A6B] cursor-not-allowed border border-[#EAE3D2]"
                            : isLoggedIn && previewUrl
                            ? "bg-[#2C2621] text-[#FAF6F0] hover:bg-[#423932] active:scale-[0.99]"
                            : "bg-[#F5EFE6] text-[#A09383] border border-[#EAE3D2] cursor-not-allowed"
                    }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin text-amber-800" />
                            <span>Đang trích xuất & Phân tích...</span>
                        </>
                    ) : isLoggedIn ? (
                        "Nhận Diện Deepfake Ngay"
                    ) : (
                        "Yêu Cầu Đăng Nhập"
                    )}
                </button>
            </div>
        </div>
    );
}