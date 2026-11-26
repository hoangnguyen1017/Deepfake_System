"use client";

import { useState } from "react";
import {
  Film,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  Video,
  Flame,
  Waves,
  Image as ImageIcon,
  Info,
} from "lucide-react";

type SequenceInfo = {
  sequence_index: number;
  position_name?: string;
  start_frame: number;
  end_frame: number;
  length: number;
  prediction: "FAKE" | "REAL";
  confidence: number;
  fake_percent: number;
  real_percent: number;
  preview_image?: string;
  temporal_image?: string;
  fft_map_image?: string;
  freq_importance?: {
    mag_mid: number;
    mag_high: number;
    phase_mid: number;
    phase_high: number;
  };
  timeline_attn?: number[];
};

type Props = {
  result: any;
  loading: boolean;
  isLoggedIn: boolean;
};

export default function ResultPanel({ result, loading, isLoggedIn }: Props) {
  const [selectedSeqIndex, setSelectedSeqIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"PREVIEW" | "TEMPORAL" | "FFT">("PREVIEW");
  const [showDetail, setShowDetail] = useState<boolean>(false);

  if (!isLoggedIn) {
    return (
      <div className="glass rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center text-center bg-white/70 border border-[#EAE3D2]">
        <div className="text-4xl mb-4 bg-[#FAF6F0] p-4 rounded-full border border-[#EAE3D2]">
          🔒
        </div>
        <h3 className="text-xl font-bold mb-2 text-[#2C2621]">Yêu cầu đăng nhập</h3>
        <p className="text-[#8C7A6B] text-sm max-w-sm">
          Vui lòng đăng nhập để thực hiện phân tích video và xem chi tiết chuỗi sequence AI.
        </p>
      </div>
    );
  }

  const sequences: SequenceInfo[] =
    result?.sequences || result?.frame_analysis_details?.sequences || [];
  const totalFrames =
    result?.total_frames || result?.frame_analysis_details?.num_frames_extracted || 0;

  const currentSeq = sequences[selectedSeqIndex] || sequences[0];

  let displayImage = currentSeq?.preview_image || result?.preview_image;
  if (viewMode === "TEMPORAL" && currentSeq?.temporal_image) {
    displayImage = currentSeq.temporal_image;
  } else if (viewMode === "FFT" && currentSeq?.fft_map_image) {
    displayImage = currentSeq.fft_map_image;
  }

  const currentPrediction = currentSeq?.prediction || result?.prediction;

  return (
    <div className="glass rounded-3xl p-6 shadow-xl flex flex-col transition-all bg-white/70 border border-[#EAE3D2] text-[#2C2621]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2C2621] flex items-center gap-2">
          <Activity className="w-6 h-6 text-amber-800" />
          Kết Quả Phân Tích
        </h2>
        {result && (
          <span className="text-xs text-[#8C7A6B] bg-[#FAF6F0] px-3 py-1 rounded-full border border-[#EAE3D2] font-medium">
            {result.model_version || "Deepfake-FFT-Temporal"}
          </span>
        )}
      </div>

      {!result && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-[#8C7A6B] border border-dashed border-[#D8CEBE] bg-[#FAF6F0]/50 rounded-2xl p-6">
          <Film className="w-12 h-12 mb-3 text-[#A09383] animate-pulse" />
          <p className="text-sm font-semibold text-[#2C2621]">Chưa có dữ liệu phân tích</p>
          <p className="text-xs text-[#8C7A6B] mt-1">
            Tải video ở khung bên trái và nhấn "Nhận diện Deepfake"
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-52 bg-[#F5EFE6] rounded-2xl border border-[#EAE3D2]" />
          <div className="h-10 bg-[#F5EFE6] rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 bg-[#F5EFE6] rounded-xl" />
            <div className="h-20 bg-[#F5EFE6] rounded-xl" />
            <div className="h-20 bg-[#F5EFE6] rounded-xl" />
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* PREVIEW IMAGE CONTAINER */}
          <div className="relative rounded-2xl overflow-hidden border border-[#EAE3D2] bg-[#FAF6F0] flex items-center justify-center min-h-[220px]">
            {displayImage ? (
              <img
                src={`data:image/jpeg;base64,${displayImage}`}
                className="w-full object-contain max-h-[250px] transition-all duration-300"
                alt="Prediction Preview Frame"
              />
            ) : (
              <div className="text-xs text-[#8C7A6B]">Không có hình ảnh preview</div>
            )}

            {/* BADGE VỊ TRÍ */}
            <div className="absolute top-3 left-3 bg-[#2C2621]/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-[#FAF6F0] border border-[#2C2621] font-mono">
              {currentSeq?.position_name || (currentSeq ? `Đoạn #${currentSeq.sequence_index}` : "Ảnh đại diện")}
            </div>

            {/* BADGE PREDICTION */}
            <div className="absolute top-3 right-3">
              <span
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md border ${
                  currentPrediction === "FAKE"
                    ? "bg-rose-100/90 text-rose-800 border-rose-300"
                    : "bg-emerald-100/90 text-emerald-800 border-emerald-300"
                }`}
              >
                {currentPrediction === "FAKE" ? (
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                )}
                {currentPrediction}
              </span>
            </div>
          </div>

          {/* VIEW MODE SWITCH BUTTONS */}
          <div className="flex items-center justify-center gap-2 bg-[#FAF6F0] p-1.5 rounded-2xl border border-[#EAE3D2]">
            <button
              onClick={() => setViewMode("PREVIEW")}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === "PREVIEW"
                  ? "bg-[#2C2621] text-[#FAF6F0] shadow-sm"
                  : "text-[#8C7A6B] hover:text-[#2C2621] hover:bg-white"
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Khung BBox
            </button>

            {currentSeq?.temporal_image && (
              <button
                onClick={() => setViewMode("TEMPORAL")}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === "TEMPORAL"
                    ? "bg-rose-800 text-white shadow-sm"
                    : "text-[#8C7A6B] hover:text-rose-900 hover:bg-white"
                }`}
              >
                <Flame className="w-4 h-4" /> Temporal Stream
              </button>
            )}

            {currentSeq?.fft_map_image && (
              <button
                onClick={() => setViewMode("FFT")}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === "FFT"
                    ? "bg-amber-800 text-white shadow-sm"
                    : "text-[#8C7A6B] hover:text-amber-900 hover:bg-white"
                }`}
              >
                <Waves className="w-4 h-4" /> FFT Stream
              </button>
            )}
          </div>

          {/* EXPLANATION BOX */}
          <div className="bg-[#FAF6F0] border border-[#EAE3D2] p-3.5 rounded-2xl text-xs space-y-3 transition-all">
            {viewMode === "PREVIEW" && (
              <div className="space-y-1.5 text-[#5C5246]">
                <div className="flex items-center gap-2 font-semibold text-[#2C2621]">
                  <Info className="w-4 h-4 shrink-0 text-amber-800" />
                  <span>Mô hình AI 2-Stream (Temporal & FFT):</span>
                </div>
                <p className="pl-6 leading-relaxed">
                  Hệ thống quét khuôn mặt và phân tích song song qua <strong className="text-[#2C2621]">2 nhánh độc lập</strong>: 
                  chuyển động thời gian (<strong className="text-rose-800">Temporal</strong>) và phổ tần số vi mô (<strong className="text-amber-800">FFT Spectrum</strong>).
                </p>
                <p className="pl-6 leading-relaxed">
                  ⚡ Kết quả <strong className="text-[#2C2621]">% FAKE / REAL</strong> phía trên là kết quả chung sau khi AI tổng hợp và đối chiếu dữ liệu từ cả 2 nhánh trên.
                </p>
              </div>
            )}

            {viewMode === "TEMPORAL" && (
              <div className="space-y-3 text-[#5C5246]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-rose-800">
                    <Flame className="w-4 h-4 shrink-0" />
                    <span>Luồng Chuyển Động (Temporal Stream):</span>
                  </div>
                  <button
                    onClick={() => setShowDetail(!showDetail)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-900 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg border border-rose-300 transition cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {showDetail ? "Ẩn giải thích" : "Giải thích chi tiết"}
                  </button>
                </div>

                <p className="leading-relaxed pl-1">
                  Phân tích sự mượt mà của chuyển động theo thời gian. 
                  <strong className="text-[#2C2621]"> Hình trái:</strong> Bản đồ biến đổi chuyển động giữa các frame. 
                  <strong className="text-[#2C2621]"> Hình phải:</strong> Vùng biểu trưng đặc trưng (CNN Feature Map) mà AI tập trung soi kỹ nhất.
                </p>

                {showDetail && (
                  <div className="mt-3 pt-3 border-t border-[#EAE3D2] space-y-3 text-[11px] leading-relaxed animate-fadeIn">
                    <div className="bg-white p-2.5 rounded-xl border border-[#EAE3D2] space-y-1">
                      <span className="font-bold text-rose-800 block">⚙️ Cách hoạt động:</span>
                      <p className="text-[#5C5246]">
                        Mô hình đưa video qua CNN Encoder để lấy véc-tơ đặc trưng không gian, sau đó ứng dụng <strong className="text-[#2C2621]">Temporal Attention</strong> và tính <strong className="text-[#2C2621]">Feature Difference</strong> để phát hiện bất thường trong nhịp chuyển động (chớp mắt, mấp máy môi, biểu cảm mặt).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl space-y-1">
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dấu hiệu REAL
                        </span>
                        <ul className="text-[#5C5246] list-disc list-inside space-y-0.5">
                          <li><strong className="text-[#2C2621]">Ảnh trái:</strong> Ánh sáng đỏ phân bổ đều, mượt mà khi cơ mặt chuyển động.</li>
                          <li><strong className="text-[#2C2621]">Ảnh phải:</strong> Vùng chú ý tỏa đều quanh các ngũ quan tự nhiên.</li>
                        </ul>
                      </div>

                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl space-y-1">
                        <span className="font-bold text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Dấu hiệu FAKE
                        </span>
                        <ul className="text-[#5C5246] list-disc list-inside space-y-0.5">
                          <li><strong className="text-[#2C2621]">Ảnh trái:</strong> Điểm chói đỏ rực bất thường ở mắt/môi (giật khung hình/flicker).</li>
                          <li><strong className="text-[#2C2621]">Ảnh phải:</strong> Vùng đỏ/cam rực <strong className="text-rose-900">bám chặt viền mặt/cằm/tóc</strong> (lỗi ghép mặt Deepfake).</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === "FFT" && (
              <div className="space-y-3 text-[#5C5246]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-amber-900">
                    <Waves className="w-4 h-4 shrink-0" />
                    <span>Luồng Tần Số (FFT Stream):</span>
                  </div>
                  <button
                    onClick={() => setShowDetail(!showDetail)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 transition cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {showDetail ? "Ẩn giải thích" : "Giải thích chi tiết"}
                  </button>
                </div>

                <p className="leading-relaxed pl-1">
                  Soi vết nhiễu vi mô bằng biến đổi tần số Fourier. 
                  <strong className="text-[#2C2621]"> Hình trái:</strong> Bản đồ vết lọc nhiễu SRM đè trên mặt. 
                  <strong className="text-[#2C2621]"> Hình phải:</strong> Phổ năng lượng 2D FFT thể hiện phân bố tần số.
                </p>

                {showDetail && (
                  <div className="mt-3 pt-3 border-t border-[#EAE3D2] space-y-3 text-[11px] leading-relaxed animate-fadeIn">
                    <div className="bg-white p-2.5 rounded-xl border border-[#EAE3D2] space-y-1">
                      <span className="font-bold text-amber-900 block">⚙️ Cách hoạt động:</span>
                      <p className="text-[#5C5246]">
                        Sử dụng kính lọc SRM để bắt lấy các hạt nhiễu ẩn trên da, sau đó dùng thuật toán Chuyển đổi Fourier (FFT) biến đổi ảnh sang không gian tần số (Frequency Domain) để tìm các vết gợn ma trận nhân tạo từ thuật toán AI tạo ảnh.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl space-y-1">
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dấu hiệu REAL
                        </span>
                        <ul className="text-[#5C5246] list-disc list-inside space-y-0.5">
                          <li><strong className="text-[#2C2621]">Ảnh trái:</strong> Hạt nhiễu mịn, phân bố đồng nhất tự nhiên như nhiễu camera.</li>
                          <li><strong className="text-[#2C2621]">Ảnh phải:</strong> Tâm sáng đối xứng mượt, không có vệt chấm sáng bất thường.</li>
                        </ul>
                      </div>

                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl space-y-1">
                        <span className="font-bold text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Dấu hiệu FAKE
                        </span>
                        <ul className="text-[#5C5246] list-disc list-inside space-y-0.5">
                          <li><strong className="text-[#2C2621]">Ảnh trái:</strong> Xuất hiện các ô lưới vuông/nhiễu ô cờ (Checkerboard Artifacts).</li>
                          <li><strong className="text-[#2C2621]">Ảnh phải:</strong> Phổ tần số xuất hiện dải sáng dị biệt hoặc các vệt sáng lạ ở dải tần cao.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QUICK STATS GRID */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FAF6F0] border border-[#EAE3D2] p-3 rounded-2xl flex flex-col items-center text-center">
              <span className="text-xs text-[#8C7A6B] mb-1 flex items-center gap-1 font-medium">
                <Video className="w-3.5 h-3.5 text-amber-800" /> Tổng Frames
              </span>
              <span className="text-lg font-extrabold text-[#2C2621]">{totalFrames}</span>
            </div>
            <div className="bg-[#FAF6F0] border border-[#EAE3D2] p-3 rounded-2xl flex flex-col items-center text-center">
              <span className="text-xs text-[#8C7A6B] mb-1 flex items-center gap-1 font-medium">
                <Layers className="w-3.5 h-3.5 text-amber-800" /> Số Đoạn
              </span>
              <span className="text-lg font-extrabold text-[#2C2621]">
                {sequences.length} Phân Đoạn
              </span>
            </div>
            <div className="bg-[#FAF6F0] border border-[#EAE3D2] p-3 rounded-2xl flex flex-col items-center text-center">
              <span className="text-xs text-[#8C7A6B] mb-1 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-700" /> Thời Gian
              </span>
              <span className="text-lg font-extrabold text-[#2C2621]">
                {result?.processing_time_ms
                  ? (result.processing_time_ms / 1000).toFixed(1)
                  : 0}
                s
              </span>
            </div>
          </div>

          {/* DANH SÁCH PHÂN ĐOẠN */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#2C2621] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-800" />
                Phân Đoạn Video (Nhấn để chuyển đoạn)
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {sequences.map((seq, idx) => {
                const isSelected = selectedSeqIndex === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSeqIndex(idx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between relative overflow-hidden ${
                      isSelected
                        ? "ring-2 ring-[#2C2621] bg-white border-[#2C2621] shadow-md scale-[1.01]"
                        : seq.prediction === "FAKE"
                        ? "bg-rose-50/60 border-rose-200 hover:bg-rose-100/60"
                        : "bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                            isSelected
                              ? "bg-[#2C2621] text-white border-[#2C2621]"
                              : "bg-[#F5EFE6] text-[#2C2621] border-[#EAE3D2]"
                          }`}
                        >
                          {seq.position_name || `Đoạn #${seq.sequence_index}`}
                        </span>
                        <span className="text-xs text-[#8C7A6B] font-mono">
                          Frame {seq.start_frame} → {seq.end_frame}
                        </span>
                      </div>

                      <div className="w-44 h-1.5 bg-[#EAE3D2] rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${
                            seq.prediction === "FAKE" ? "bg-rose-600" : "bg-emerald-600"
                          }`}
                          style={{ width: `${seq.fake_percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-md border inline-block ${
                          seq.prediction === "FAKE"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}
                      >
                        {seq.prediction}
                      </span>
                      <span className="text-[11px] text-[#8C7A6B] font-mono block mt-1">
                        Fake: {seq.fake_percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}