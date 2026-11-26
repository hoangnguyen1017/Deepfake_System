import api from "./api";

export interface DetectResult {
  id?: number;
  prediction: "FAKE" | "REAL" | string;
  confidence: number;
  fake_percent: number;
  real_percent: number;
  preview_image: string;
  processing_time_ms?: number;
  created_at?: string;
}

export const detectDeepfake = async (file: File): Promise<DetectResult> => {
  const formData = new FormData();
  formData.append("file", file);

  // Không set cứng "Content-Type" để trình duyệt tự động đính kèm boundary parameter
  const res = await api.post("/predict", formData, {
    timeout: 1000 * 60 * 5, // 5 phút xử lý cho mô hình Swin + Optical Flow
  });

  return res.data;
};