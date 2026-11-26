// D:\Deepfake-System\frontend\app\manager\users\HistoryModal.tsx
import { X, Video, Calendar, HardDrive, FileText } from "lucide-react";
import { User, PredictionHistory } from "@/services/managerApi";

interface HistoryModalProps {
    isOpen: boolean;
    user: User | null;
    history: PredictionHistory[];
    loading: boolean;
    onClose: () => void;
}

// Hàm format dung lượng file từ Bytes sang KB/MB
function formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function HistoryModal({ isOpen, user, history, loading, onClose }: HistoryModalProps) {
    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2621]/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-[#EAE3D2] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-[#2C2621]">
                
                {/* Header Modal */}
                <div className="p-6 border-b border-[#EAE3D2] flex items-center justify-between bg-[#FAF6F0]">
                    <div>
                        <h3 className="text-lg font-extrabold text-[#2C2621] flex items-center gap-2">
                            <Video className="w-5 h-5 text-[#8C7A6B]" /> Lịch Sử Quét & Metadata File
                        </h3>
                        <p className="text-xs text-[#8C7A6B] mt-1 font-medium">{user.fullname} ({user.username}) • {user.email}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl text-[#8C7A6B] hover:text-[#2C2621] hover:bg-white transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-white">
                    {loading ? (
                        <div className="text-center py-12 text-[#8C7A6B] text-xs font-semibold">Đang tải lịch sử...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-[#8C7A6B] text-xs font-medium">Chưa có lịch sử quét nào cho người dùng này.</div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => {
                                const fileInfo = item.file_info || item.file_upload;
                                const predResult = item.prediction || item.label;
                                const isFake = predResult?.toLowerCase() === "fake";

                                return (
                                    <div 
                                        key={item.history_id || item.id} 
                                        className="bg-[#FAF6F0]/60 border border-[#EAE3D2] rounded-2xl p-4 transition-all hover:border-[#D8CEBE]"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="space-y-1">
                                                <div className="font-bold text-[#2C2621] text-sm flex items-center gap-2">
                                                    <Video className="w-4 h-4 text-[#8C7A6B]" />
                                                    {item.video_name}
                                                </div>
                                                <div className="text-xs text-[#8C7A6B] flex items-center gap-3 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5 text-[#8C7A6B]" /> 
                                                        {new Date(item.created_at).toLocaleString("vi-VN")}
                                                    </span>
                                                    {item.model_version && (
                                                        <span className="bg-white border border-[#EAE3D2] px-2 py-0.5 rounded-md text-[10px] text-[#5C5246] font-mono">
                                                            {item.model_version}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Badge dự đoán */}
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                isFake 
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {predResult ? predResult.toUpperCase() : "UNKNOWN"}
                                                {item.confidence !== undefined && ` (${(item.confidence * 100).toFixed(1)}%)`}
                                            </div>
                                        </div>

                                        {/* Chi tiết File Upload đính kèm */}
                                        {fileInfo ? (
                                            <div className="mt-3 pt-3 border-t border-[#EAE3D2] grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-xl border border-[#EAE3D2]">
                                                <div className="flex items-center gap-1.5 text-[#2C2621]">
                                                    <HardDrive className="w-3.5 h-3.5 text-[#8C7A6B]" />
                                                    <span className="text-[#8C7A6B] font-medium">Kích thước:</span>
                                                    <span className="font-bold">{formatFileSize(fileInfo.file_size)}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-[#2C2621]">
                                                    <FileText className="w-3.5 h-3.5 text-[#8C7A6B]" />
                                                    <span className="text-[#8C7A6B] font-medium">MIME Type:</span>
                                                    <span className="font-bold">{fileInfo.mime_type || "N/A"}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-[11px] text-[#8C7A6B] italic font-medium">
                                                * Không tìm thấy thông tin file metadata tương ứng.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}