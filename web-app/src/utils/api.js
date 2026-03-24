import axios from 'axios';
import { API_BASE_URL } from './apiBaseUrl.js';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // CRITICAL: Allows sending/receiving httpOnly cookies
});

// Variables to manage the refresh token queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            throw new Error(
                'API Route Not Found: Received HTML instead of JSON. Check your API base URL.'
            );
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Catch 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            // THE FIX: Do not intercept 401s from /auth/me!
            // This allows guests to visit the site without being violently redirected.
            if (
                originalRequest.url.includes('/auth/login') ||
                originalRequest.url.includes('/auth/register') ||
                originalRequest.url.includes('/auth/refresh-token') ||
                originalRequest.url.includes('/auth/me') // <--- Added this line
            ) {
                return Promise.reject(error);
            }

            // Prevent infinite loops if the refresh token endpoint itself fails
            if (originalRequest.url.includes('/auth/refresh-token')) {
                return Promise.reject(error);
            }

            // If a refresh is already happening, queue this request until it's done
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call our backend endpoint to refresh the httpOnly cookie
                await api.post('/auth/refresh-token');

                isRefreshing = false;
                processQueue(null);

                // Retry the original failed request
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError);

                // If the refresh token is dead, force the user to log out
                window.dispatchEvent(new Event('auth:unauthorized'));
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
