"use client";

import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {

    return (

        <main
            className="
                min-h-screen
                bg-gradient-to-b
                from-black
                via-zinc-950
                to-black
                flex
                items-center
                justify-center
                text-white
            "
        >

            <Suspense fallback={<p>Loading...</p>}>

                <ResetPasswordForm />

            </Suspense>

        </main>

    );

}