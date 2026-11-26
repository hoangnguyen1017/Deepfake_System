"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2, User, Mail, Hash, Lock, Check } from "lucide-react";

export default function RegisterForm() {
    const [form, setForm] = useState({
        username: "",
        fullname: "",
        email: "",
        age: "",
        gender: "",
        password: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // =========================
    // VALIDATION (SYNC BACKEND)
    // =========================
    const validateField = (name: string, value: string): string => {
        switch (name) {
            case "username":
                if (!value) return "Username is required";
                if (!/^[a-zA-Z0-9_]{3,20}$/.test(value))
                    return "3–20 chars: letters, numbers, _ only";
                return "";

            case "fullname":
                if (!value) return "Full name is required";
                if (!/^[a-zA-ZÀ-ỹ\s]{2,50}$/.test(value))
                    return "Only letters and spaces";
                return "";

            case "email":
                if (!value) return "Email is required";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                    return "Invalid email format";
                return "";

            case "age":
                if (!value) return "Age is required";
                if (Number(value) < 13) return "Must be 13+";
                return "";

            case "password":
                if (!value) return "Password is required";
                if (value.length < 8) return "Min 8 characters";
                if (!/[a-z]/.test(value)) return "Add lowercase letter";
                if (!/[A-Z]/.test(value)) return "Add uppercase letter";
                if (!/\d/.test(value)) return "Add number";
                return "";

            default:
                return "";
        }
    };

    // =========================
    // HANDLE CHANGE
    // =========================
    const handleChange = (name: string, value: string) => {
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: validateField(name, value),
        }));
    };

    // =========================
    // FORM VALIDITY (SAFE)
    // =========================
    const isValid =
        Boolean(form.username) &&
        Boolean(form.fullname) &&
        Boolean(form.email) &&
        Boolean(form.age) &&
        Boolean(form.password) &&
        Object.values(errors).every((e) => e === "");

    // =========================
    // SUBMIT
    // =========================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);

        try {
            const res = await axios.post(
                "http://localhost:8000/auth/register",
                {
                    username: form.username.trim(),
                    fullname: form.fullname.trim(),
                    email: form.email.trim(),
                    age: Number(form.age),
                    gender: form.gender ? form.gender.toLowerCase() : null,
                    password: form.password,
                }
            );

            alert(res.data.message);

            // reset form
            setForm({
                username: "",
                fullname: "",
                email: "",
                age: "",
                gender: "",
                password: "",
            });

            setErrors({});
        } catch (err: any) {
            alert(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "Register failed"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // UI HELPERS
    // =========================
    const inputClass = (field: string) =>
        `w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border text-[#2C2621] placeholder-[#A39585] text-xs font-medium focus:outline-none transition-all
        ${
            errors[field]
                ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                : "border-[#EAE3D2] focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20"
        }`;

    const errorText = (field: string) =>
        errors[field] && (
            <p className="text-[11px] font-medium text-rose-600 mt-1">
                {errors[field]}
            </p>
        );

    // =========================
    // UI
    // =========================
    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Header */}
            <div className="text-left space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-[#2C2621]">
                    Create Account
                </h1>
                <p className="text-xs text-[#8C7A6B]">
                    Fill in your credentials to join AI Vision Suite.
                </p>
            </div>

            <div className="space-y-4">
                {/* Grid 2 cột cho Username & Fullname */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* USERNAME */}
                    <div>
                        <label className="block text-xs font-semibold text-[#5C5246] mb-1">
                            Username
                        </label>
                        <input
                            placeholder="e.g. john_doe"
                            className={inputClass("username")}
                            value={form.username}
                            onChange={(e) =>
                                handleChange("username", e.target.value)
                            }
                        />
                        {errorText("username")}
                    </div>

                    {/* FULLNAME */}
                    <div>
                        <label className="block text-xs font-semibold text-[#5C5246] mb-1">
                            Full Name
                        </label>
                        <input
                            placeholder="e.g. John Doe"
                            className={inputClass("fullname")}
                            value={form.fullname}
                            onChange={(e) =>
                                handleChange("fullname", e.target.value)
                            }
                        />
                        {errorText("fullname")}
                    </div>
                </div>

                {/* EMAIL */}
                <div>
                    <label className="block text-xs font-semibold text-[#5C5246] mb-1">
                        Email Address
                    </label>
                    <input
                        placeholder="name@example.com"
                        className={inputClass("email")}
                        value={form.email}
                        onChange={(e) =>
                            handleChange("email", e.target.value)
                        }
                    />
                    {errorText("email")}
                </div>

                {/* Grid 2 cột cho Age & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* AGE */}
                    <div>
                        <label className="block text-xs font-semibold text-[#5C5246] mb-1">
                            Age
                        </label>
                        <input
                            type="number"
                            placeholder="Age (13+)"
                            className={inputClass("age")}
                            value={form.age}
                            onChange={(e) =>
                                handleChange("age", e.target.value)
                            }
                        />
                        {errorText("age")}
                    </div>

                    {/* GENDER */}
                    <div>
                        <label className="block text-xs font-semibold text-[#5C5246] mb-1">
                            Gender <span className="text-[#8C7A6B] font-normal">(Optional)</span>
                        </label>
                        <select
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#EAE3D2] text-[#2C2621] text-xs font-medium focus:outline-none focus:border-[#8C7A6B] focus:ring-2 focus:ring-[#8C7A6B]/20 transition-all"
                            value={form.gender}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    gender: e.target.value,
                                }))
                            }
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {/* PASSWORD */}
                <div>
                    <label className="block text-xs font-semibold text-[#5C5246] mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        placeholder="At least 8 chars, 1 upper, 1 number"
                        className={inputClass("password")}
                        value={form.password}
                        onChange={(e) =>
                            handleChange("password", e.target.value)
                        }
                    />
                    {errorText("password")}
                </div>

                {/* BUTTON */}
                <button
                    type="submit"
                    disabled={loading || !isValid}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs shadow-md transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 cursor-pointer
                        ${
                            loading || !isValid
                                ? "bg-[#EAE3D2] text-[#A39585] shadow-none cursor-not-allowed"
                                : "bg-[#2C2621] text-[#FAF6F0] hover:bg-[#423932] shadow-stone-900/10"
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#8C7A6B]" />
                            <span>Creating account...</span>
                        </>
                    ) : (
                        "Create Account"
                    )}
                </button>
            </div>
        </form>
    );
}