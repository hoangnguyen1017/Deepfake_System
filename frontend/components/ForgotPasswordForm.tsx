"use client";

import { useState } from "react";
import { forgotPassword } from "@/services/authApi";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Props = {
  onBack?: () => void;
};

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export default function ForgotPasswordForm({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await forgotPassword(email.trim());
      setSuccess(data.message || "Password reset link has been sent to your email.");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(
        apiErr.response?.data?.detail ||
          apiErr.message ||
          "Something went wrong."
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
      <div className="text-left space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-[#2C2621]">
          Forgot Password
        </h1>
        <p className="text-xs text-[#8C7A6B] leading-relaxed">
          Enter your registered email address. We'll send you instructions to reset your password.
        </p>
      </div>

      <div className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-[#5C5246] mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-[#2C2621] placeholder-[#A39585] text-xs font-medium focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition-all disabled:opacity-50"
            />
            <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]/60 pointer-events-none" />
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="flex items-start gap-2 text-xs font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

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
              <span>Sending link...</span>
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>

        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="w-full py-2 text-center text-xs font-semibold text-[#8C7A6B] hover:text-[#2C2621] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </button>
      </div>
    </form>
  );
}