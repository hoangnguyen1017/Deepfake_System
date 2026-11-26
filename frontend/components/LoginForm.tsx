"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/authApi";
import { saveTokens } from "@/utils/storage";
import { getUserRole } from "@/utils/auth";
import { Lock, User, AlertCircle, Loader2 } from "lucide-react";

type Props = {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
};

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export default function LoginForm({ onSuccess, onForgotPassword }: Props) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(username.trim(), password);

      if (!data.access_token || !data.refresh_token) {
        throw new Error("Invalid login response");
      }

      // 1. Lưu token vào bộ nhớ (localStorage / sessionStorage)
      saveTokens(data.access_token, data.refresh_token, rememberMe);

      // 2. Lấy role từ Access Token
      const userRole = getUserRole();

      // 3. Điều hướng theo vai trò
      if (userRole === "manager") {
        router.push("/manager/users");
      } else {
        router.push("/");
      }

      // Callback khi thành công (vd: đóng modal)
      onSuccess?.();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(
        apiErr.response?.data?.detail ||
          apiErr.message ||
          "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="text-left space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#2C2621]">
          Welcome 
        </h1>
        <p className="text-xs text-[#8C7A6B]">
          Please sign in to access your Deepfake Detection Suite.
        </p>
      </div>

      <div className="space-y-4">
        {/* Username Input */}
        <div>
          <label className="block text-xs font-semibold text-[#5C5246] mb-1.5">
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-[#2C2621] placeholder-[#A39585] text-xs font-medium focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition-all disabled:opacity-50"
              value={username}
              disabled={loading}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-semibold text-[#5C5246] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-[#2C2621] placeholder-[#A39585] text-xs font-medium focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition-all disabled:opacity-50"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Options Row */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 text-[#5C5246] select-none cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              disabled={loading}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-[#D8CEBE] text-[#8C7A6B] focus:ring-[#8C7A6B]/30 accent-[#8C7A6B] cursor-pointer"
            />
            Remember Me
          </label>

          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading}
            className="text-[#8C7A6B] hover:text-[#2C2621] font-semibold hover:underline disabled:opacity-50 transition-colors cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 text-xs font-medium text-rose-800 bg-rose-50/80 border border-rose-200 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-[#2C2621] text-[#FAF6F0] hover:bg-[#423932] text-xs font-semibold shadow-md shadow-stone-900/10 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#8C7A6B]" />
              <span>Logging in...</span>
            </>
          ) : (
            "Login"
          )}
        </button>
      </div>
    </form>
  );
}