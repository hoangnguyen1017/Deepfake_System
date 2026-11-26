import axios from "axios";

const API_URL =
    "http://localhost:8000";

export const registerUser = async (
    data: any
) => {

    const res = await axios.post(
        `${API_URL}/auth/register`,
        data
    );

    return res.data;
};

export const loginUser = async (
    username: string,
    password: string
) => {

    const res = await axios.post(
        `${API_URL}/auth/login`,
        {
            username,
            password,
        }
    );

    return res.data;
};

export const refreshToken = async (
    refreshToken: string
) => {

    const res = await axios.post(
        `${API_URL}/auth/refresh`,
        {
            refresh_token:
                refreshToken
        }
    );

    return res.data;
};

export const forgotPassword = async (
    email: string
) => {

    const res = await axios.post(
        `${API_URL}/auth/forgot-password`,
        {
            email,
        }
    );

    return res.data;
};

export const resetPassword = async (
    token: string,
    newPassword: string
) => {

    const res = await axios.post(
        `${API_URL}/auth/reset-password`,
        {
            token,
            new_password: newPassword,
        }
    );

    return res.data;
};