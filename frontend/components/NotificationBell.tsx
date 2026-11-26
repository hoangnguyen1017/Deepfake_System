"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, CheckCheck, MessageSquare } from "lucide-react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationItem,
} from "@/services/feedbackApi";

type Props = {
  onSelectFeedbackNotification?: (feedbackId: number) => void;
};

export default function NotificationBell({ onSelectFeedbackNotification }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const fetchList = async () => {
    try {
      const list = await getNotifications(10);
      setNotifications(list);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchList();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markNotificationAsRead(item.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }

    if (item.reference_id && onSelectFeedbackNotification) {
      onSelectFeedbackNotification(item.reference_id);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icon Chuông */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl bg-white border border-[#EAE3D2] hover:border-[#D8CEBE] hover:bg-[#FAF6F0] text-[#8C7A6B] hover:text-[#2C2621] transition cursor-pointer shadow-xs"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-white border border-[#EAE3D2] shadow-2xl z-50 overflow-hidden text-[#2C2621]">
          <div className="flex items-center justify-between p-4 border-b border-[#EAE3D2] bg-[#FAF6F0]">
            <h3 className="font-semibold text-sm text-[#2C2621]">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-amber-900 hover:text-amber-950 font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#F5EFE6]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8C7A6B]">
                Không có thông báo nào
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item)}
                  className={`p-3.5 transition cursor-pointer flex gap-3 hover:bg-[#FAF6F0] ${
                    !item.is_read ? "bg-amber-50/50" : ""
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[#F5EFE6] text-[#8C7A6B] h-fit">
                    <MessageSquare className="w-4 h-4 text-amber-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-semibold ${
                          !item.is_read ? "text-[#2C2621]" : "text-[#8C7A6B]"
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-amber-800 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#5C5246] mt-1 line-clamp-2">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-[#A09383] mt-1 block">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}