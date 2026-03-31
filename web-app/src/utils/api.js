import axios from 'axios';
import { API_BASE_URL } from './apiBaseUrl.js';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, 
});


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

        
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            
            if (
                originalRequest.url.includes('/auth/login') ||
                originalRequest.url.includes('/auth/register') ||
                originalRequest.url.includes('/auth/refresh-token') ||
                originalRequest.url.includes('/auth/me') 
            ) {
                return Promise.reject(error);
            }

            
            if (originalRequest.url.includes('/auth/refresh-token')) {
                return Promise.reject(error);
            }

            
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
                
                await api.post('/auth/refresh-token');

                isRefreshing = false;
                processQueue(null);

                
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError);

                
                window.dispatchEvent(new Event('auth:unauthorized'));
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
