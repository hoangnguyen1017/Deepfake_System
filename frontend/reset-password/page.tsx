import { Suspense } from "react";

import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
    return (
        <main
            className="
                min-h-screen
                flex
                items-center
                justify-center
                bg-black
                text-white
                px-4
            "
        >
            <Suspense
                fallback={
                    <div className="text-zinc-400">
                        Loading...
                    </div>
                }
            >
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}