"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/utils/auth";
import { getAccessToken } from "@/utils/storage";

export const useAuthRedirect = () => {
    const router = useRouter();

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            router.push("/");
            return;
        }

        const role = getUserRole();

        if (role === "manager") {
            router.push("/manager");
        }
    }, [router]);
};