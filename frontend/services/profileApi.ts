import api from "./api";

export const getProfile = async () => {
  const res = await api.get("/profile/me");
  return res.data;
};

export const updateProfile = async (data: {
  fullname: string;
  email: string;
  age: number;
  gender: string;
}) => {
  const res = await api.put("/profile/me", data);
  return res.data;
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
) => {
  const res = await api.put("/profile/change-password", {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return res.data;
};

// ==========================================
// ĐỒNG BỘ CÁC ROUTE LỊCH SỬ VỚI ROUTER /PREDICT
// ==========================================

export const getHistory = async (skip: number = 0, limit: number = 20) => {
  const res = await api.get("/predict/history", {
    params: { skip, limit },
  });
  return res.data;
};

export const getHistoryDetail = async (predictionId: number) => {
  const res = await api.get(`/predict/history/${predictionId}`);
  return res.data;
};

export const deleteHistory = async (predictionId: number) => {
  const res = await api.delete(`/predict/history/${predictionId}`);
  return res.data;
};

export const deleteAllHistory = async () => {
  const res = await api.delete("/predict/history");
  return res.data;
};

export const getUploadedFiles = async (skip: number = 0, limit: number = 20) => {
  const res = await api.get("/predict/files", {
    params: { skip, limit },
  });
  return res.data;
};