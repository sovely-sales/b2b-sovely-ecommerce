import axios from 'axios';
import { API_BASE_URL } from './apiBaseUrl.js';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || API_BASE_URL || '/api/v1',
    withCredentials: true
});

api.interceptors.response.use((response) => {

    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error("API Route Not Found: Received HTML instead of JSON. Check your API base URL.");
    }
    return response;
});

export default api;