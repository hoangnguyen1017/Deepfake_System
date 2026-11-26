"use client";

import { useEffect, useState } from "react";
import { X, Upload, MessageSquare, Clock, CheckCircle2, Paperclip } from "lucide-react";
import {
  getUserFeedbacks,
  sendFeedback,
  FeedbackItem,
} from "@/services/feedbackApi";

type Props = {
  onClose: () => void;
  selectedFeedbackId?: number | null;
};

export default function FeedbackModal({ onClose, selectedFeedbackId }: Props) {
  const [tab, setTab] = useState<"create" | "history">("create");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState<FeedbackItem[]>([]);

  const fetchHistory = async () => {
    try {
      const data = await getUserFeedbacks();
      setHistory(data);
    } catch (err) {
      console.error("Lỗi tải lịch sử feedback:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    if (selectedFeedbackId) {
      setTab("history");
    }
  }, [selectedFeedbackId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Vui lòng điền đầy đủ tiêu đề và nội dung.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      files.forEach((file) => formData.append("files", file));

      await sendFeedback(formData);
      setSuccess("Gửi phản hồi thành công! Chúng tôi sẽ hồi đáp sớm nhất.");
      setTitle("");
      setContent("");
      setFiles([]);
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Gửi phản hồi thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#EAE3D2] rounded-3xl p-6 w-full max-w-2xl text-[#2C2621] shadow-2xl relative max-h-[85vh] flex flex-col">
      {/* Header Modal */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D2]">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[#2C2621]">
          <MessageSquare className="w-5 h-5 text-amber-800" />
          Phản hồi & Báo lỗi
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#8C7A6B] hover:text-[#2C2621] hover:bg-[#FAF6F0] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Switch Tab */}
      <div className="flex gap-2 my-4 p-1 bg-[#F5EFE6] rounded-xl">
        <button
          onClick={() => setTab("create")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
            tab === "create"
              ? "bg-white text-[#2C2621] shadow-sm font-semibold"
              : "text-[#8C7A6B] hover:text-[#2C2621]"
          }`}
        >
          Gửi phản hồi mới
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
            tab === "history"
              ? "bg-white text-[#2C2621] shadow-sm font-semibold"
              : "text-[#8C7A6B] hover:text-[#2C2621]"
          }`}
        >
          Lịch sử góp ý ({history.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {tab === "create" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">
                Tiêu đề
              </label>
              <input
                type="text"
                placeholder="Nhập tiêu đề hoặc vướng mắc..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-sm text-[#2C2621] placeholder-[#A09383] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">
                Nội dung chi tiết
              </label>
              <textarea
                rows={4}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-sm text-[#2C2621] placeholder-[#A09383] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8C7A6B] mb-1.5">
                File đính kèm (Ảnh / Video minh họa)
              </label>
              <div className="flex items-center justify-center border border-dashed border-[#D8CEBE] hover:border-[#8C7A6B] bg-[#FAF6F0] rounded-xl p-4 cursor-pointer relative transition">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 text-sm text-[#8C7A6B]">
                  <Upload className="w-4 h-4 text-amber-800" />
                  <span>
                    {files.length > 0
                      ? `Đã chọn ${files.length} file`
                      : "Nhấn để chọn Ảnh hoặc Video"}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-rose-700 text-xs bg-rose-50 border border-rose-200 p-3 rounded-xl">
                {error}
              </p>
            )}
            {success && (
              <p className="text-emerald-800 text-xs bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#2C2621] hover:bg-[#423932] text-[#FAF6F0] font-semibold text-sm transition cursor-pointer disabled:opacity-50 shadow-md"
            >
              {loading ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-xs text-[#8C7A6B] py-8">
                Bạn chưa gửi phản hồi nào.
              </p>
            ) : (
              history.map((item) => (
                <div
                  key={item.feedback_id}
                  className={`p-4 rounded-xl border bg-[#FAF6F0] transition ${
                    selectedFeedbackId === item.feedback_id
                      ? "border-amber-800 ring-1 ring-amber-800"
                      : "border-[#EAE3D2]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-[#2C2621]">
                      {item.title}
                    </h4>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        item.status === "replied"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {item.status === "replied" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Đã trả lời
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Đang chờ
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-[#5C5246] mt-2">{item.content}</p>

                  {/* File đính kèm */}
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {item.attachments.map((att) => (
                        <a
                          key={att.attachment_id}
                          href={att.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-amber-900 hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded border border-[#EAE3D2]"
                        >
                          <Paperclip className="w-3 h-3 text-[#8C7A6B]" /> {att.filename}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Phản hồi từ Manager */}
                  {item.reply_content && (
                    <div className="mt-3 p-3 rounded-lg bg-[#F5EFE6] border border-[#EAE3D2]">
                      <p className="text-[11px] font-semibold text-amber-900 mb-1">
                        Phản hồi từ Quản trị viên:
                      </p>
                      <p className="text-xs text-[#2C2621]">{item.reply_content}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}