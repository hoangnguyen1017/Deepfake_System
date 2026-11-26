"use client";

import { useEffect, useState } from "react";
import {
  User,
  KeyRound,
  History,
  X,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  getProfile,
  updateProfile,
  changePassword,
  getHistory,
  deleteHistory,
  deleteAllHistory,
} from "@/services/profileApi";

type Props = {
  onClose: () => void;
};

export interface HistoryItem {
  id: number;
  filename?: string;
  video_name?: string;
  prediction?: string;
  label?: string;
  confidence: number | string;
  fake_percent?: number;
  real_percent?: number;
  created_at?: string;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export default function ProfileModal({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "history">("profile");

  // State Profile
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // State Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State Feedback / Notification Messages
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // State History
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadProfile();
    loadHistory();
  }, []);

  const clearMessage = () => setMessage(null);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setUsername(data.username || "");
      setFullname(data.fullname || "");
      setEmail(data.email || "");
      setAge(String(data.age ?? ""));
      setGender(data.gender || "male");
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getHistory();
      setHistories(data || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveProfile = async () => {
    clearMessage();
    setLoadingAction(true);
    try {
      await updateProfile({
        fullname,
        email,
        age: Number(age),
        gender,
      });
      setMessage({ type: "success", text: "Cập nhật thông tin cá nhân thành công!" });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setMessage({
        type: "error",
        text: apiErr.response?.data?.detail || "Cập nhật thông tin thất bại.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleChangePassword = async () => {
    clearMessage();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không trùng khớp!" });
      return;
    }

    setLoadingAction(true);
    try {
      await changePassword(oldPassword, newPassword);
      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setMessage({
        type: "error",
        text: apiErr.response?.data?.detail || "Đổi mật khẩu thất bại.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    try {
      await deleteHistory(historyId);
      setHistories((prev) => prev.filter((item) => item.id !== historyId));
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const handleDeleteAllHistory = async () => {
    const ok = confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử nhận diện?");
    if (!ok) return;

    try {
      if (typeof deleteAllHistory === "function") {
        await deleteAllHistory();
      } else {
        await Promise.all(histories.map((item) => deleteHistory(item.id)));
      }
      setHistories([]);
    } catch (err) {
      console.error("Failed to delete all history:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-[#EAE3D2] rounded-3xl p-6 sm:p-8 w-[900px] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl relative text-[#2C2621]">
        {/* Header Modal */}
        <div className="flex justify-between items-center pb-4 border-b border-[#EAE3D2]">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#2C2621]">
            <ShieldCheck className="w-6 h-6 text-amber-800" />
            Hồ Sơ Của Tôi
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8C7A6B] hover:text-[#2C2621] hover:bg-[#FAF6F0] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switch Tabs */}
        <div className="flex gap-2 my-5 p-1 bg-[#F5EFE6] rounded-2xl">
          <button
            onClick={() => {
              setActiveTab("profile");
              clearMessage();
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "profile"
                ? "bg-white text-[#2C2621] shadow-sm"
                : "text-[#8C7A6B] hover:text-[#2C2621]"
            }`}
          >
            <User className="w-4 h-4 text-amber-800" /> Thông tin cá nhân
          </button>

          <button
            onClick={() => {
              setActiveTab("password");
              clearMessage();
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "password"
                ? "bg-white text-[#2C2621] shadow-sm"
                : "text-[#8C7A6B] hover:text-[#2C2621]"
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-800" /> Đổi mật khẩu
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              clearMessage();
            }}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-[#2C2621] shadow-sm"
                : "text-[#8C7A6B] hover:text-[#2C2621]"
            }`}
          >
            <History className="w-4 h-4 text-amber-800" /> Lịch sử kiểm tra ({histories.length})
          </button>
        </div>

        {/* Dynamic Alert Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">
                  Tên tài khoản (Username)
                </label>
                <input
                  value={username}
                  disabled
                  className="w-full p-3 rounded-xl bg-[#F5EFE6] border border-[#EAE3D2] text-xs font-medium text-[#8C7A6B] cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">Họ và tên</label>
                <input
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Nhập họ và tên..."
                  className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-xs text-[#2C2621] placeholder-[#A09383] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">Địa chỉ Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-xs text-[#2C2621] placeholder-[#A09383] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">Tuổi</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="20"
                    className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-xs text-[#2C2621] placeholder-[#A09383] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-xs text-[#2C2621] focus:outline-none focus:ring-2 focus:ring-amber-800/40 cursor-pointer"
                  >
                    <option value="male">Nam (Male)</option>
                    <option value="female">Nữ (Female)</option>
                    <option value="other">Khác (Other)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loadingAction}
                className="w-full mt-4 py-3 rounded-xl bg-[#2C2621] hover:bg-[#423932] text-[#FAF6F0] font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-800" /> Đang cập nhật...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          )}

          {/* PASSWORD TAB */}
          {activeTab === "password" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-xs text-[#2C2621] placeholder-[#A09383] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-xs text-[#2C2621] placeholder-[#A09383] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-xs text-[#2C2621] placeholder-[#A09383] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loadingAction}
                className="w-full mt-4 py-3 rounded-xl bg-[#2C2621] hover:bg-[#423932] text-[#FAF6F0] font-semibold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-800" /> Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </button>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12 text-xs text-[#8C7A6B] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-800" />
                  <span>Đang tải lịch sử...</span>
                </div>
              ) : histories.length === 0 ? (
                <div className="text-center text-xs text-[#8C7A6B] py-12">
                  Chưa có lịch sử kiểm tra nào.
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                    {histories.map((item) => {
                      const labelStr = item.prediction || item.label || "N/A";
                      const isFake = labelStr.toUpperCase() === "FAKE";
                      const fileName = item.filename || item.video_name || `Record #${item.id}`;
                      const conf =
                        typeof item.confidence === "number"
                          ? (item.confidence * 100).toFixed(1) + "%"
                          : item.confidence;

                      return (
                        <div
                          key={item.id}
                          className="bg-[#FAF6F0] border border-[#EAE3D2] rounded-2xl p-4 flex justify-between items-center transition hover:border-[#D8CEBE]"
                        >
                          <div className="space-y-1 min-w-0 pr-3">
                            <div className="font-semibold text-xs text-[#2C2621] truncate max-w-[320px]">
                              {fileName}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] flex-wrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                                  isFake
                                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                }`}
                              >
                                {labelStr.toUpperCase()}
                              </span>
                              <span className="text-[#8C7A6B] font-mono">Độ tin cậy: {conf}</span>
                              {item.created_at && (
                                <span className="text-[#A09383] flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.created_at).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteHistory(item.id)}
                            className="p-2 text-[#8C7A6B] hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Xóa mục này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#EAE3D2] flex justify-between items-center">
                    <span className="text-xs text-[#8C7A6B]">
                      Tổng số: <strong className="text-[#2C2621]">{histories.length}</strong> bản ghi
                    </span>
                    <button
                      onClick={handleDeleteAllHistory}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả lịch sử
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}