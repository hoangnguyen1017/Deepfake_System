"use client";

import { useState } from "react";

import {
    useSearchParams,
    useRouter,
} from "next/navigation";

import {
    resetPassword,
} from "@/services/authApi";

export default function ResetPasswordForm() {

    const searchParams =
        useSearchParams();

    const router =
        useRouter();

    const token =
        searchParams.get("token") ?? "";

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [success, setSuccess] =
        useState("");

    const [error, setError] =
        useState("");

    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        setError("");

        setSuccess("");

        if (!token) {

            setError(
                "Invalid reset link."
            );

            return;

        }

        if (
            newPassword !==
            confirmPassword
        ) {

            setError(
                "Passwords do not match."
            );

            return;

        }

        setLoading(true);

        try {

            const data =
                await resetPassword(
                    token,
                    newPassword
                );

            setSuccess(
                data.message
            );

            setTimeout(() => {

                router.push("/");

            }, 3000);

        } catch (err: any) {

                console.log(err.response?.data);

                const detail = err.response?.data?.detail;

                if (typeof detail === "string") {

                    setError(detail);

                } else if (Array.isArray(detail)) {

                    setError(detail[0]?.msg ?? "Reset password failed.");

                } else {

                    setError("Reset password failed.");

                }

            } finally {

            setLoading(false);

        }

    };

    return (

        <form
            onSubmit={handleSubmit}
            className="
                glass
                rounded-3xl
                p-8
                w-full
                max-w-md
            "
        >

            <h1
                className="
                    text-3xl
                    font-bold
                    mb-6
                "
            >

                Reset Password

            </h1>

            <input

                type="password"

                placeholder="New Password"

                value={newPassword}

                disabled={loading}

                onChange={(e) =>
                    setNewPassword(
                        e.target.value
                    )
                }

                className="
                    w-full
                    p-3
                    rounded-xl
                    bg-zinc-900
                    mb-4
                "

            />

            <input

                type="password"

                placeholder="Confirm Password"

                value={confirmPassword}

                disabled={loading}

                onChange={(e) =>
                    setConfirmPassword(
                        e.target.value
                    )
                }

                className="
                    w-full
                    p-3
                    rounded-xl
                    bg-zinc-900
                "

            />

            {success && (

                <p
                    className="
                        text-green-400
                        mt-4
                        text-sm
                    "
                >

                    {success}

                    <br />

                    Redirecting to login...

                </p>

            )}

            {error && (

                <p
                    className="
                        text-red-400
                        mt-4
                        text-sm
                    "
                >

                    {error}

                </p>

            )}

            <button

                type="submit"

                disabled={loading}

                className="
                    w-full
                    mt-6
                    py-3
                    rounded-xl
                    bg-white
                    text-black
                    font-semibold
                    disabled:opacity-50
                "

            >

                {

                    loading

                        ? "Resetting..."

                        : "Reset Password"

                }

            </button>

        </form>

    );

}