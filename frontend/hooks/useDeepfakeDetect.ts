import { useState, useEffect } from "react";
import { detectDeepfake } from "@/services/deepfakeApi";

export interface DetectResult {
  prediction: string;
  confidence: number;
  fake_percent: number;
  real_percent: number;
  preview_image?: string;
}

export function useDeepfakeDetect() {
  const [video, setVideo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState<string>("");

  // Clean up Object URL khi component unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleVideoChange = (file: File | null) => {
    if (!file) {
      resetDetection();
      return;
    }

    if (!file.type.startsWith("video/")) {
      setError("File được chọn không phải là định dạng video hợp lệ");
      return;
    }

    // Thu hồi URL cũ trước khi tạo URL mới
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setError("");
    setResult(null);
    setVideo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDetect = async () => {
    if (!video || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await detectDeepfake(video);
      setResult(data);
    } catch (err: any) {
      // In log an toàn và chi tiết hơn
      console.error("DETECT ERROR DETAILED:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: err,
      });

      // Bắt message lỗi từ Backend (FastAPI hoặc Custom Response)
      const resData = err.response?.data;
      const detail = resData?.detail || resData?.message;

      if (Array.isArray(detail)) {
        // FastAPI Validation Error (422)
        setError(
          detail
            .map((e: any) => e.msg || (typeof e === "string" ? e : JSON.stringify(e)))
            .join(", ")
        );
      } else if (typeof detail === "string") {
        setError(detail);
      } else if (err.message === "Network Error") {
        setError("Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại Server API.");
      } else {
        setError(err.message || "Phát hiện Deepfake thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetDetection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setVideo(null);
    setPreviewUrl("");
    setResult(null);
    setError("");
    setLoading(false);
  };

  return {
    video,
    previewUrl,
    loading,
    result,
    error,
    handleVideoChange,
    handleDetect,
    resetDetection,
  };
}