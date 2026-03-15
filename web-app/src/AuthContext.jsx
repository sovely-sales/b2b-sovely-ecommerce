import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './utils/apiBaseUrl.js';

export const AuthContext = createContext();

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, 
    withCredentials: true 
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Use the Vite proxy (no need for full URL if proxy is setup)
    const api = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true 
    });
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Correct endpoint for fetching current user
                const response = await api.get('/users/current-user');
                if (response.data?.data) setUser(response.data.data);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const sendOtp = async (phoneNumber, isLogin = false) => {
        try {
            const endpoint = isLogin ? '/users/send-login-otp' : '/users/send-otp';
            await api.post(endpoint, { phoneNumber });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Failed to send OTP" };
        }
    }

    const login = async (email, password) => {
        try {
            const response = await api.post('/users/login', { email, password });
            setUser(response.data.data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Login failed" };
        }
    };

    const loginWithOtpReq = async (phoneNumber, otpCode) => {
        try {
            const response = await api.post('/users/login-otp', { phoneNumber, otpCode });
            setUser(response.data.data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "OTP verification failed" };
        }
    };

    const register = async (userData) => {
        try {
            await api.post('/users/register', userData);
            if (userData.email) return await login(userData.email, userData.password);
            return await loginWithOtpReq(userData.phoneNumber, userData.otpCode);
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Registration failed" };
        }
    };

    const logout = async () => {
        try {
            await api.post('/users/logout'); // Correct endpoint
            setUser(null);
        } catch (error) {
            console.error("Error logging out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithOtpReq, register, logout, sendOtp, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
