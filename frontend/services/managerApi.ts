// D:\Deepfake-System\frontend\services\managerApi.ts
import { getAccessToken } from "@/utils/storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getAuthHeaders = () => {
    const token = getAccessToken();
    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
};

export interface User {
    user_id: number;
    username: string;
    fullname: string;
    email: string;
    age: number;
    gender?: "male" | "female" | "other" | null;
    role: "user" | "manager";
    is_active: boolean;
    created_at: string;
    last_login?: string | null;
}

// UserMiniInfo dùng cho thông tin lồng trong Feedback/Prediction
export interface UserMiniInfo {
    username: string;
    fullname: string;
    email: string;
}

export interface FileUploadInfo {
    file_id: number;
    user_id: number;
    filename: string;
    stored_filename: string;
    file_path: string;
    file_size: number;
    mime_type?: string | null;
    status: "pending" | "processing" | "completed" | "failed";
    error_message?: string | null;
    file_metadata?: Record<string, any> | null;
    uploaded_at: string;
}

export interface PredictionHistory {
    history_id?: number;
    id: number;
    video_name: string;
    prediction?: "real" | "fake" | string;
    label: string;
    confidence: number;
    fake_percent?: number;
    real_percent?: number;
    model_version?: string;
    processing_time_ms?: number;
    created_at: string;
    file_info?: FileUploadInfo | null;
    file_upload?: FileUploadInfo | null;
}

export interface ManagerStats {
    total_users: number;
    active_users: number;
    total_scans: number;
    fake_detected_ratio: number;
}

export interface FeedbackAttachment {
    attachment_id: number;
    filename: string;
    file_path: string;
    file_type: string;
    mime_type?: string | null;
}

export interface ManagerFeedback {
    feedback_id: number;
    user_id: number;
    title: string;
    content: string;
    status: "pending" | "replied" | "closed";
    reply_content?: string | null;
    replied_by?: number | null;
    replied_at?: string | null;
    created_at: string;
    attachments: FeedbackAttachment[];
    username?: string;
    user?: UserMiniInfo | null;
}

export interface AdvancedAnalytics {
    prediction_dist: {
        total_scans: number;
        real_count: number;
        fake_count: number;
        real_percentage: number;
        fake_percentage: number;
    };
    confidence_dist: {
        low_confidence_count: number;
        moderate_confidence_count: number;
        high_confidence_count: number;
        low_confidence_percentage: number;
    };
    hourly_peak_matrix: Array<{
        day_of_week: number;
        day_name: string;
        hour: number;
        scan_count: number;
    }>;
}

export const managerApi = {
    getUsers: async (): Promise<User[]> => {
        const response = await fetch(`${API_BASE_URL}/manager/users`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách người dùng.`;
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    getStats: async (): Promise<ManagerStats> => {
        const response = await fetch(`${API_BASE_URL}/manager/stats`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorMsg = `Lỗi ${response.status}: Không thể tải số liệu thống kê.`;
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    createUser: async (userData: Partial<User> & { password?: string }): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/manager/users`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            let errorMsg = "Không thể tạo tài khoản.";
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    updateUser: async (userId: number, userData: Partial<User> & { password?: string }): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/manager/users/${userId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            let errorMsg = "Cập nhật tài khoản thất bại.";
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    toggleUserStatus: async (userId: number, isActive: boolean): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/manager/users/${userId}/status`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ is_active: isActive }),
        });

        if (!response.ok) {
            let errorMsg = "Thay đổi trạng thái tài khoản thất bại.";
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    getUserHistory: async (userId: number): Promise<PredictionHistory[]> => {
        const response = await fetch(`${API_BASE_URL}/manager/users/${userId}/history`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorMsg = "Không thể tải lịch sử của người dùng này.";
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    deleteUser: async (userId: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/manager/users/${userId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorMsg = "Xóa tài khoản thất bại.";
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
    },

    exportUsers: async (format: "csv" | "xlsx"): Promise<Blob> => {
        const response = await fetch(`${API_BASE_URL}/manager/users/export?format=${format}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorMsg = "Xuất dữ liệu thất bại.";
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.blob();
    },

    importUsers: async (file: File): Promise<{ success: boolean; imported_count: number; errors: string[] }> => {
        const token = getAccessToken();
        const formData = new FormData();
        formData.append("file", file);

        const headers: Record<string, string> = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/manager/users/import`, {
            method: "POST",
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            let errorMsg = "Nhập file dữ liệu thất bại.";
            try {
                const errData = await response.json();
                errorMsg = errData.detail || errData.message || errorMsg;
            } catch (e) {
                const textErr = await response.text();
                if (textErr) errorMsg = textErr;
            }
            throw new Error(errorMsg);
        }
        return response.json();
    },

    getAllFeedbacks: async (status?: string): Promise<ManagerFeedback[]> => {
        const queryParam = status ? `?status_filter=${status}&status=${status}` : "";
        const response = await fetch(`${API_BASE_URL}/manager/feedbacks${queryParam}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách feedback.`;
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    replyFeedback: async (feedbackId: number, replyContent: string): Promise<ManagerFeedback> => {
        const response = await fetch(`${API_BASE_URL}/manager/feedbacks/${feedbackId}/reply`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ reply_content: replyContent }),
        });

        if (!response.ok) {
            let errorMsg = "Gửi phản hồi thất bại.";
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    getAdvancedAnalytics: async (): Promise<AdvancedAnalytics> => {
        const response = await fetch(`${API_BASE_URL}/manager/analytics/advanced`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorMsg = `Lỗi ${response.status}: Không thể tải số liệu thống kê nâng cao.`;
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return response.json();
    },

    deleteFeedback: async (feedbackId: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/manager/feedbacks/${feedbackId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let errorMsg = "Xóa feedback thất bại.";
            try {
                const err = await response.json();
                errorMsg = err.detail || err.message || errorMsg;
            } catch (_) {}
            throw new Error(errorMsg);
        }
    },
};