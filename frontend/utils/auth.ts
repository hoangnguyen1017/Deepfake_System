import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "./storage";

export function getUserRole(): string | null {
    const token = getAccessToken();

    if (!token) return null;

    try {
        const decoded: any = jwtDecode(token);
        return decoded.role || null;
    } catch {
        return null;
    }
}