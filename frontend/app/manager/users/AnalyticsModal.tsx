// D:\Deepfake-System\frontend\app\manager\users\AnalyticsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { managerApi, AdvancedAnalytics } from "@/services/managerApi";
import { 
    X, Loader2, PieChart as PieIcon, BarChart2, 
    AlertTriangle, ShieldCheck, Clock 
} from "lucide-react";
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const COLORS_PREDICTION = ["#059669", "#e11d48"]; // Real: Emerald Green, Fake: Rose Red

export default function AnalyticsModal({ isOpen, onClose }: Props) {
    const [data, setData] = useState<AdvancedAnalytics | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            managerApi.getAdvancedAnalytics()
                .then(res => setData(res))
                .catch(err => alert("Lỗi khi tải dữ liệu thống kê: " + (err.message || "Không thể kết nối máy chủ")))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Chuẩn bị dữ liệu cho PieChart Real vs Fake
    const piePredictionData = data ? [
        { name: "Ảnh/Video Real", value: data.prediction_dist.real_count },
        { name: "Phát hiện Deepfake", value: data.prediction_dist.fake_count }
    ] : [];

    // Chuẩn bị dữ liệu cho BarChart Độ tin cậy
    const barConfidenceData = data ? [
        { name: "Thấp (< 60%)", count: data.confidence_dist.low_confidence_count, fill: "#d97706" },
        { name: "Trung bình (60-80%)", count: data.confidence_dist.moderate_confidence_count, fill: "#2563eb" },
        { name: "Cao (> 80%)", count: data.confidence_dist.high_confidence_count, fill: "#059669" }
    ] : [];

    // Tóm tắt khung giờ cao điểm theo ngày
    const peakByDay = data ? ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => {
        const dayItems = data.hourly_peak_matrix.filter(item => item.day_name === day);
        const totalScanDay = dayItems.reduce((acc, curr) => acc + curr.scan_count, 0);
        return { day, totalScanDay };
    }) : [];

    return (
        <div className="fixed inset-0 z-50 bg-[#2C2621]/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white border border-[#EAE3D2] w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#2C2621]">
                
                {/* Header */}
                <div className="p-6 border-b border-[#EAE3D2] flex items-center justify-between bg-[#FAF6F0]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#FAF6F0] border border-[#EAE3D2] rounded-2xl text-[#8C7A6B]">
                            <BarChart2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-[#2C2621]">Thống Kê Chi Tiết Hệ Thống</h2>
                            <p className="text-xs text-[#8C7A6B] font-medium mt-0.5">Phân tích kết quả dự đoán, độ tin cậy AI & tần suất sử dụng</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-[#8C7A6B] hover:text-[#2C2621] p-2 rounded-xl bg-white border border-[#EAE3D2] hover:bg-[#FAF6F0] transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
                    {loading || !data ? (
                        <div className="py-20 flex flex-col items-center justify-center text-[#8C7A6B]">
                            <Loader2 className="w-8 h-8 animate-spin text-[#8C7A6B] mb-3" />
                            <p className="text-xs font-semibold">Đang tính toán số liệu thống kê...</p>
                        </div>
                    ) : (
                        <>
                            {/* Card Cảnh Báo Retraining */}
                            <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-900">Tệp dữ liệu nghi ngờ / Độ tin cậy thấp</h4>
                                        <p className="text-xs text-amber-800/90 mt-0.5">
                                            Có <span className="font-bold text-amber-950">{data.confidence_dist.low_confidence_count}</span> lượt quét ({data.confidence_dist.low_confidence_percentage}%) có độ tin cậy &lt; 60%. Cần thu thập tệp này để bổ sung Retraining mô hình.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Grid 2 Biểu Đồ Dạng Tròn & Cột */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Chart 1: Phân bổ Real vs Fake */}
                                <div className="bg-[#FAF6F0]/60 p-5 rounded-2xl border border-[#EAE3D2] flex flex-col items-center">
                                    <h3 className="text-sm font-bold text-[#2C2621] mb-2 flex items-center gap-2 self-start">
                                        <PieIcon className="w-4 h-4 text-[#8C7A6B]" /> Tỷ Lệ Phát Hiện Deepfake
                                    </h3>
                                    <div className="w-full h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={piePredictionData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {piePredictionData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS_PREDICTION[index % COLORS_PREDICTION.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: "#FAF6F0", borderColor: "#EAE3D2", borderRadius: "12px", color: "#2C2621" }}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-around w-full mt-2 text-xs border-t border-[#EAE3D2] pt-3">
                                        <div className="text-emerald-700 font-bold">Real: {data.prediction_dist.real_percentage}%</div>
                                        <div className="text-rose-700 font-bold">Fake: {data.prediction_dist.fake_percentage}%</div>
                                    </div>
                                </div>

                                {/* Chart 2: Phân bổ Confidence Score */}
                                <div className="bg-[#FAF6F0]/60 p-5 rounded-2xl border border-[#EAE3D2]">
                                    <h3 className="text-sm font-bold text-[#2C2621] mb-4 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-[#8C7A6B]" /> Phân Bổ Độ Tin Cậy Dự Đoán
                                    </h3>
                                    <div className="w-full h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barConfidenceData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#EAE3D2" />
                                                <XAxis dataKey="name" stroke="#8C7A6B" tick={{ fontSize: 11 }} />
                                                <YAxis stroke="#8C7A6B" allowDecimals={false} />
                                                <Tooltip contentStyle={{ backgroundColor: "#FAF6F0", borderColor: "#EAE3D2", borderRadius: "12px", color: "#2C2621" }} />
                                                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                            </div>

                            {/* Chart 3: Mật độ lượt quét trong tuần */}
                            <div className="bg-[#FAF6F0]/60 p-5 rounded-2xl border border-[#EAE3D2]">
                                <h3 className="text-sm font-bold text-[#2C2621] mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[#8C7A6B]" /> Tổng Số Lượt Quét Theo Các Ngày Trong Tuần
                                </h3>
                                <div className="w-full h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={peakByDay}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#EAE3D2" />
                                            <XAxis dataKey="day" stroke="#8C7A6B" />
                                            <YAxis stroke="#8C7A6B" allowDecimals={false} />
                                            <Tooltip contentStyle={{ backgroundColor: "#FAF6F0", borderColor: "#EAE3D2", borderRadius: "12px", color: "#2C2621" }} />
                                            <Bar dataKey="totalScanDay" fill="#8C7A6B" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}