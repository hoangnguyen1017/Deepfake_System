// src/services/feedbackApi.ts
import api from "./api"; // Import axios instance hiện có của bạn

export interface FeedbackAttachment {
  attachment_id: number;
  filename: string;
  file_path: string;
  file_type: string;
}

export interface FeedbackItem {
  feedback_id: number;
  title: string;
  content: string;
  status: "pending" | "replied" | "closed";
  reply_content?: string;
  replied_at?: string;
  created_at: string;
  attachments: FeedbackAttachment[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  reference_id?: number;
  created_at: string;
}

// 1. Gửi Feedback (Text + Files)
export const sendFeedback = async (formData: FormData) => {
  const response = await api.post("/user/feedback", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// 2. Lấy danh sách Feedback của người dùng
export const getUserFeedbacks = async (): Promise<FeedbackItem[]> => {
  const response = await api.get("/user/feedbacks");
  return response.data;
};

// 3. Lấy số thông báo chưa đọc
export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await api.get("/user/notifications/unread-count");
  return response.data.unread_count;
};

// 4. Lấy danh sách thông báo (tối đa 10 tin)
export const getNotifications = async (limit = 10): Promise<NotificationItem[]> => {
  const response = await api.get(`/user/notifications?limit=${limit}`);
  return response.data;
};

// 5. Đánh dấu 1 thông báo đã đọc
export const markNotificationAsRead = async (id: number) => {
  const response = await api.patch(`/user/notifications/${id}/read`);
  return response.data;
};

// 6. Đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = async () => {
  const response = await api.patch("/user/notifications/read-all");
  return response.data;
};