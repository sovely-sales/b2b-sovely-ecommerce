import React, { createContext, useState, useEffect } from 'react';
import api from './utils/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    setUser(null); 
                }
                return Promise.reject(error);
            }
        );

        const fetchUser = async () => {
            try {

                const response = await api.get('/auth/me');
                if (response.data?.data) setUser(response.data.data);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();

        return () => api.interceptors.response.eject(interceptor);
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

            const response = await api.post('/auth/login', { email, password });
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

            const response = await api.post('/users/register', userData);

            if (userData.email) {
                return await login(userData.email, userData.password);
            }

            if (response.data?.data?.user) {
                setUser(response.data.data.user);
            }

            return { success: true }; 

        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Registration failed" };
        }
    };

    const logout = async () => {
        try {

            await api.post('/auth/logout'); 
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