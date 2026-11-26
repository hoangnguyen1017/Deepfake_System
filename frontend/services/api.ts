import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  updateAccessToken,
} from "@/utils/storage";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Chỉ thực hiện refresh token khi nhận status 401
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post("http://localhost:8000/auth/refresh", {
          refresh_token: refreshToken,
        });

        const newAccessToken = res.data.access_token;
        updateAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.reload();
        }
        return Promise.reject(refreshError);
      }
    }

    // Giữ nguyên AxiosError để phía Hook catch đúng err.response hoặc err.message
    return Promise.reject(error);
  }
);

export default api;