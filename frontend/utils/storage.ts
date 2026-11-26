export const saveTokens = (
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean
) => {
    const storage = rememberMe
        ? localStorage
        : sessionStorage;

    storage.setItem("access_token", accessToken);
    storage.setItem("refresh_token", refreshToken);
};

export const getAccessToken = (): string | null => {
    return (
        localStorage.getItem("access_token") ??
        sessionStorage.getItem("access_token")
    );
};

export const getRefreshToken = (): string | null => {
    return (
        localStorage.getItem("refresh_token") ??
        sessionStorage.getItem("refresh_token")
    );
};

export const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
};

export const updateAccessToken = (
    accessToken: string
) => {

    if (
        localStorage.getItem("access_token")
    ) {

        localStorage.setItem(
            "access_token",
            accessToken
        );

    } else {

        sessionStorage.setItem(
            "access_token",
            accessToken
        );

    }
};