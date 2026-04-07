import React, { createContext, useState, useEffect } from 'react';
import api from './utils/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data?.data) setUser(response.data.data);
            return response.data.data;
        } catch (error) {
            setUser(null);
            return null;
        }
    };

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            localStorage.removeItem('reseller_cart');

            const currentPath = window.location.pathname;
            const publicPaths = ['/', '/login', '/forgot-password', '/terms', '/privacy'];

            if (!publicPaths.includes(currentPath)) {
                window.location.href = '/login?session_expired=true';
            }
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);

        refreshUser().finally(() => setLoading(false));

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            setUser(response.data.data.user);
            return { success: true, user: response.data.data.user };
        } catch (error) {
            console.error('FULL LOGIN ERROR:', error);
            const message =
                error.response?.data?.message || `Network or Server Error: ${error.message}`;
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Error logging out', error);
        } finally {
            setUser(null);

            localStorage.removeItem('reseller_cart');

            window.location.href = '/';
        }
    };

    const sendOtp = async (phoneNumber, isLogin = false) => {
        try {
            const response = await api.post('/auth/send-otp', { phoneNumber, isLogin });
            return { success: true, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP',
            };
        }
    };

    const loginWithOtpReq = async (phoneNumber, otpCode) => {
        try {
            const response = await api.post('/auth/login-otp', { phoneNumber, otpCode });
            setUser(response.data.data.user);
            return { success: true, user: response.data.data.user };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Invalid OTP' };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
                refreshUser,
                sendOtp,
                loginWithOtpReq,
                isAdmin: user?.role === 'ADMIN',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
