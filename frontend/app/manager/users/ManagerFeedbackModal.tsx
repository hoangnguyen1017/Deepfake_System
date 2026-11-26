// app/manager/users/ManagerFeedbackModal.tsx
"use client";

import { useEffect, useState } from "react";
import { X, MessageSquare, Send, Paperclip, Trash2, Search, Loader2 } from "lucide-react";
import { managerApi, ManagerFeedback } from "@/services/managerApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManagerFeedbackModal({ isOpen, onClose }: Props) {
  const [feedbacks, setFeedbacks] = useState<ManagerFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<ManagerFeedback | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await managerApi.getAllFeedbacks(
        filterStatus === "all" ? undefined : filterStatus
      );
      setFeedbacks(data);
    } catch (err: any) {
      console.error("Lỗi tải feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFeedbacks();
    }
  }, [isOpen, filterStatus]);

  if (!isOpen) return null;

  // Helper hàm lấy tên hiển thị của người dùng an toàn
  const getUserDisplayName = (f: ManagerFeedback) => {
    if (f.user?.fullname) return f.user.fullname;
    if (f.user?.username) return f.user.username;
    if (f.username) return f.username;
    return `User #${f.user_id}`;
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback || !replyText.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      await managerApi.replyFeedback(selectedFeedback.feedback_id, replyText.trim());
      
      // Cập nhật lại state local
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.feedback_id === selectedFeedback.feedback_id
            ? { ...f, status: "replied", reply_content: replyText.trim(), replied_at: new Date().toISOString() }
            : f
        )
      );
      
      setSelectedFeedback((prev) =>
        prev ? { ...prev, status: "replied", reply_content: replyText.trim() } : null
      );
      setReplyText("");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Gửi phản hồi thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (feedbackId: number) => {
    if (!confirm("Bạn có chắc muốn xóa feedback này?")) return;
    try {
      await managerApi.deleteFeedback(feedbackId);
      setFeedbacks((prev) => prev.filter((f) => f.feedback_id !== feedbackId));
      if (selectedFeedback?.feedback_id === feedbackId) {
        setSelectedFeedback(null);
      }
    } catch (err: any) {
      alert("Xóa thất bại: " + err.message);
    }
  };

  // Cập nhật tìm kiếm theo Tiêu đề, Nội dung, Tên người dùng và Email
  const filteredList = feedbacks.filter((f) => {
    const searchLower = search.toLowerCase();
    const userName = getUserDisplayName(f).toLowerCase();
    const userEmail = f.user?.email?.toLowerCase() || "";
    
    return (
      f.title.toLowerCase().includes(searchLower) ||
      f.content.toLowerCase().includes(searchLower) ||
      userName.includes(searchLower) ||
      userEmail.includes(searchLower)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2621]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAE3D2] rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col text-[#2C2621]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#EAE3D2] flex justify-between items-center bg-[#FAF6F0]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#8C7A6B]" />
            <h3 className="text-lg font-extrabold text-[#2C2621]">Quản Lý Phản Hồi Từ Người Dùng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8C7A6B] hover:text-[#2C2621] hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Layout (2 Cột) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Cột trái: Danh sách Feedback (5 cols) */}
          <div className="md:col-span-5 border-r border-[#EAE3D2] flex flex-col bg-[#FAF6F0]/40">
            {/* Thanh Tìm kiếm & Lọc */}
            <div className="p-3 border-b border-[#EAE3D2] space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B]" />
                <input
                  type="text"
                  placeholder="Tìm theo tiêu đề, người gửi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-[#EAE3D2] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#2C2621] focus:outline-none focus:border-[#8C7A6B] font-medium"
                />
              </div>

              <div className="flex gap-1">
                {["all", "pending", "replied"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg capitalize transition cursor-pointer ${
                      filterStatus === st
                        ? "bg-[#2C2621] text-[#FAF6F0] shadow-xs"
                        : "bg-white text-[#5C5246] hover:bg-[#FAF6F0] border border-[#EAE3D2]"
                    }`}
                  >
                    {st === "all" ? "Tất cả" : st === "pending" ? "Chờ xử lý" : "Đã trả lời"}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#EAE3D2]/60 p-2 space-y-1">
              {loading ? (
                <div className="flex justify-center items-center py-12 text-[#8C7A6B] text-xs font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
                </div>
              ) : filteredList.length === 0 ? (
                <p className="text-center text-xs text-[#8C7A6B] py-10 font-medium">Không có phản hồi nào.</p>
              ) : (
                filteredList.map((f) => (
                  <div
                    key={f.feedback_id}
                    onClick={() => {
                      setSelectedFeedback(f);
                      setReplyText(f.reply_content || "");
                    }}
                    className={`p-3 rounded-2xl transition cursor-pointer border ${
                      selectedFeedback?.feedback_id === f.feedback_id
                        ? "bg-amber-900/10 border-amber-800/30 shadow-xs"
                        : "bg-white/60 border-transparent hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#2C2621] truncate">{f.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                          f.status === "replied"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {f.status === "replied" ? "Đã trả lời" : "Chờ xử lý"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8C7A6B] mt-2 font-medium">
                      <span>Nguồn: <strong className="text-[#2C2621] font-bold">{getUserDisplayName(f)}</strong></span>
                      <span>{new Date(f.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cột phải: Chi tiết & Khung gửi trả lời (7 cols) */}
          <div className="md:col-span-7 flex flex-col bg-white p-5 overflow-y-auto">
            {selectedFeedback ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* Tiêu đề & Thông tin User */}
                  <div className="flex justify-between items-start pb-3 border-b border-[#EAE3D2]">
                    <div>
                      <h4 className="text-base font-extrabold text-[#2C2621]">{selectedFeedback.title}</h4>
                      <p className="text-xs text-[#8C7A6B] mt-1 font-medium">
                        Gửi bởi{" "}
                        <span className="text-amber-900 font-bold">
                          {getUserDisplayName(selectedFeedback)}
                        </span>
                        {selectedFeedback.user?.email && (
                          <span className="text-[#8C7A6B] ml-1">({selectedFeedback.user.email})</span>
                        )}
                        {" "}vào ngày {new Date(selectedFeedback.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(selectedFeedback.feedback_id)}
                      className="p-1.5 rounded-xl border border-[#EAE3D2] text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                      title="Xóa Feedback"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Nội dung User phản hồi */}
                  <div className="my-4 p-4 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D2] text-xs text-[#2C2621] font-medium leading-relaxed">
                    {selectedFeedback.content}
                  </div>

                  {/* File đính kèm */}
                  {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-[#8C7A6B] mb-2 uppercase tracking-wider">Tập tin đính kèm:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFeedback.attachments.map((att) => (
                          <a
                            key={att.attachment_id}
                            href={att.file_path}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F0] rounded-xl border border-[#EAE3D2] text-xs text-amber-900 font-semibold hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            {att.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Trả lời */}
                <form onSubmit={handleReply} className="mt-6 pt-4 border-t border-[#EAE3D2] space-y-3">
                  <label className="block text-xs font-bold uppercase text-[#8C7A6B] tracking-wider">
                    Nội dung trả lời cho User (Hệ thống sẽ gửi thông báo đến chuông của User):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập câu trả lời hoặc hướng dẫn khắc phục..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#EAE3D2] rounded-2xl p-3 text-xs text-[#2C2621] font-medium focus:outline-none focus:border-[#8C7A6B]"
                  />

                  {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-semibold">{error}</p>}

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !replyText.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2621] hover:bg-[#423932] text-[#FAF6F0] font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-md shadow-stone-900/10"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin text-amber-200" /> : <Send className="w-4 h-4 text-amber-200" />}
                      Gửi câu trả lời
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-[#8C7A6B] text-xs font-medium">
                <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                Chọn một phản hồi ở danh sách bên trái để xem và trả lời.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}