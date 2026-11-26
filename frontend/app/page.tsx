"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import LoginForm from "@/components/LoginForm";
import ProfileModal from "@/components/ProfileModal";
import RegisterForm from "@/components/RegisterForm";
import ResultPanel from "@/components/ResultPanel";
import VideoUploader from "@/components/VideoUploader";
import NotificationBell from "@/components/NotificationBell";
import FeedbackModal from "@/components/FeedbackModal";
import { useDeepfakeDetect } from "@/hooks/useDeepfakeDetect";
import { getProfile } from "@/services/profileApi";
import { clearTokens, getAccessToken } from "@/utils/storage";
import { getUserRole } from "@/utils/auth";
import {
  Shield,
  MessageSquarePlus,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Activity,
  Cpu,
  X,
  Zap,
} from "lucide-react";
import { Footer } from "@/components/Footer";export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<string | null>(null);

  // States hiển thị Modal
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const {
    previewUrl,
    loading,
    result,
    error,
    handleVideoChange,
    handleDetect,
    resetDetection,
  } = useDeepfakeDetect();

  const closeAllModals = useCallback(() => {
    setShowLogin(false);
    setShowRegister(false);
    setShowProfile(false);
    setShowForgotPassword(false);
    setShowFeedback(false);
    setSelectedFeedbackId(null);
  }, []);

  // Đóng modal khi nhấn phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAllModals();
        setShowUserDropdown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeAllModals]);

  // Kiểm tra trạng thái đăng nhập & lấy Role
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();

      if (!token) {
        setIsLoggedIn(false);
        setRole(null);
        return;
      }

      try {
        const profile = await getProfile();
        const currentRole = getUserRole();

        setUsername(profile.username);
        setRole(currentRole || profile.role?.toLowerCase() || null);
        setIsLoggedIn(true);
      } catch {
        clearTokens();
        setIsLoggedIn(false);
        setRole(null);
      }
    };

    initAuth();
  }, []);

  const handleLoginSuccess = async () => {
    try {
      resetDetection();
      const profile = await getProfile();
      const currentRole = getUserRole();

      setUsername(profile.username);
      setRole(currentRole || profile.role?.toLowerCase() || null);
      setIsLoggedIn(true);
      closeAllModals();
    } catch (err) {
      console.error("Login success handler error:", err);
    }
  };

  const handleLogout = () => {
    clearTokens();
    resetDetection();
    setIsLoggedIn(false);
    setUsername("");
    setRole(null);
    closeAllModals();
  };

  const handleSelectFeedbackNotification = (feedbackId: number) => {
    setSelectedFeedbackId(feedbackId);
    setShowFeedback(true);
  };

  return (
    <>
      <main className="relative min-h-screen text-[#2C2621] overflow-x-hidden antialiased flex flex-col justify-between">
        {/* Ambient Glow Effects (Hạ tone Be ấm) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-200/20 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-[350px] right-0 w-[450px] h-[250px] bg-stone-300/30 blur-[120px] pointer-events-none rounded-full" />

        {/* Sticky Glass Navbar - Be Tone */}
        <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#FAF6F0]/80 border-b border-[#EAE3D2] transition-all duration-200">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo / Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => router.push("/")}
            >
              <div className="relative w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center shadow-md shadow-stone-800/10 group-hover:scale-105 transition-transform duration-200">
                <Shield className="w-5 h-5 text-[#F5EFE6]" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-600 border-2 border-[#FAF6F0] rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-[#2C2621]">
                  Deepfake Detect
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-[#8C7A6B] uppercase -mt-1">
                  AI Vision Suite
                </span>
              </div>
            </div>

            {/* Actions */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                {/* Góp ý Button */}
                <button
                  onClick={() => {
                    setSelectedFeedbackId(null);
                    setShowFeedback(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 border border-[#EAE3D2] hover:border-[#D8CEBE] hover:bg-white text-[#5C5246] hover:text-[#2C2621] text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Gửi phản hồi"
                >
                  <MessageSquarePlus className="w-4 h-4 text-[#8C7A6B]" />
                  <span>Feedback</span>
                </button>

                {/* Manager Button */}
                {role === "manager" && (
                  <button
                    onClick={() => router.push("/manager/users")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-900/10 border border-amber-900/20 text-amber-900 hover:bg-amber-900/15 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Quản Lý</span>
                  </button>
                )}

                {/* Notification Bell */}
                <div className="p-0.5">
                  <NotificationBell
                    onSelectFeedbackNotification={handleSelectFeedbackNotification}
                  />
                </div>

                <div className="h-4 w-[1px] bg-[#EAE3D2] mx-0.5" />

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown((prev) => !prev)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-white/60 border border-transparent hover:border-[#EAE3D2] transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#8C7A6B] border border-[#8C7A6B]/20 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#2C2621] max-w-[130px] truncate">
                      {username}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#8C7A6B] transition-transform duration-200 ${
                        showUserDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Popover Menu */}
                  {showUserDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-[#EAE3D2] shadow-xl backdrop-blur-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-2 border-b border-[#F5EFE6]">
                          <p className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider">
                            Tài khoản
                          </p>
                          <p className="text-sm font-semibold text-[#2C2621] truncate">
                            {username}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            setShowProfile(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-[#5C5246] hover:text-[#2C2621] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                        >
                          <User className="w-4 h-4 text-[#8C7A6B]" />
                          Hồ sơ cá nhân
                        </button>

                        <div className="my-1 border-t border-[#F5EFE6]" />

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 rounded-xl text-[#5C5246] hover:text-[#2C2621] hover:bg-white/60 text-xs font-semibold transition-all cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="relative group px-4 py-2 rounded-xl bg-[#2C2621] text-[#FAF6F0] hover:bg-[#423932] text-xs font-semibold shadow-md shadow-stone-900/10 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    Đăng ký ngay
                  </span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main Workspace Area */}
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-16">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#EAE3D2] text-[#8C7A6B] text-xs font-semibold mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Next-Gen Deepfake Detection Engine</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#2C2621] leading-tight">
              Phân tích & Phát hiện{" "}
              <span className="text-[#8C7A6B]">
                Deepfake
              </span>{" "}
              Chính xác
            </h1>

            <p className="text-[#6E6356] mt-3 text-sm md:text-base leading-relaxed">
              Tải lên video của bạn để mô hình Deep Learning phân tích khuôn mặt, chuyển động và kết cấu sinh học thời gian thực.
            </p>

            {/* Quick Metrics Bar */}
            {/* <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-[#EAE3D2]/60 text-xs text-[#8C7A6B] font-medium">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-800" />
                <span>Mô hình Two-Stream Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span>Phân tích Frame-by-Frame</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-700" />
                <span>Xử lý thời gian thực</span>
              </div>
            </div> */}
          </div>

          {/* Workspace Container */}
          <div className="p-6 md:p-8 rounded-3xl bg-white/70 border border-[#EAE3D2] backdrop-blur-xl shadow-xl shadow-stone-900/5 relative">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <VideoUploader
                previewUrl={previewUrl}
                onChange={handleVideoChange}
                onDetect={handleDetect}
                loading={loading}
                error={error}
                isLoggedIn={isLoggedIn}
                onRequireLogin={() => setShowLogin(true)}
              />
              <ResultPanel
                result={result}
                loading={loading}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
        </div>
        <Footer />
      </main>

      {/* Modal Overlay Container - Tone Be */}
      {showLogin && (
        <ModalWrapper onClose={() => setShowLogin(false)}>
          <LoginForm
            onSuccess={handleLoginSuccess}
            onForgotPassword={() => {
              setShowLogin(false);
              setShowForgotPassword(true);
            }}
          />
        </ModalWrapper>
      )}

      {showRegister && (
        <ModalWrapper onClose={() => setShowRegister(false)}>
          <RegisterForm />
        </ModalWrapper>
      )}

      {showForgotPassword && (
        <ModalWrapper onClose={() => setShowForgotPassword(false)}>
          <ForgotPasswordForm />
        </ModalWrapper>
      )}

      {showProfile && (
        <ModalWrapper onClose={() => setShowProfile(false)}>
          <ProfileModal onClose={() => setShowProfile(false)} />
        </ModalWrapper>
      )}

      {showFeedback && (
        <ModalWrapper onClose={closeAllModals} maxWidth="max-w-2xl">
          <FeedbackModal
            onClose={closeAllModals}
            selectedFeedbackId={selectedFeedbackId}
          />
        </ModalWrapper>
      )}
    </>
  );
}

{/* Helper Modal Wrapper với Tone Be */}
function ModalWrapper({
  children,
  onClose,
  maxWidth = "max-w-md",
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[#2C2621]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidth} bg-white border border-[#EAE3D2] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-[#2C2621]`}
      >
        {/* <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#8C7A6B] hover:text-[#2C2621] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button> */}
        {children}
      </div>
    </div>
  );
}