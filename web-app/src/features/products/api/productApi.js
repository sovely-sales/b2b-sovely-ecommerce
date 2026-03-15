import axios from 'axios';
import { API_BASE_URL } from '../../../utils/apiBaseUrl.js';

// Fallback to localhost:3000 if the env variable is missing during development
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Intercept responses to ensure we don't accidentally return HTML or undefined
api.interceptors.response.use((response) => {
    // If the server returns HTML (usually Vite's dev server fallback), throw an error
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error("API Route Not Found: Received HTML instead of JSON. Check your VITE_API_BASE_URL.");
    }
    return response;
});

export const productApi = {
    getProducts: async ({ 
        page = 1, limit = 24, query = '', categoryId = '',
        minPrice, maxPrice, saleOnly, shipping, minRating, sort
    } = {}) => {
        const params = new URLSearchParams();
        
        // Base params
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (query) params.append('query', query);
        if (categoryId && categoryId !== 'All') params.append('categoryId', categoryId);
        
        // New Filter Params
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (saleOnly) params.append('saleOnly', 'true');
        if (shipping && shipping.length > 0) params.append('shipping', shipping.join(',')); // Sends as "3-5,7-14"
        if (minRating) params.append('minRating', minRating);
        if (sort && sort !== 'default') params.append('sort', sort);

        const response = await api.get(`/products?${params.toString()}`);
    const payload = response.data?.data;
        const safePage = Number(page) || 1;
        const safeLimit = Number(limit) || 12;

        return {
            products: Array.isArray(payload?.products) ? payload.products : [],
            pagination: {
                total: Number(payload?.pagination?.total) || 0,
                page: Number(payload?.pagination?.page) || safePage,
                pages: Number(payload?.pagination?.pages) || 1,
                limit: safeLimit,
            },
        };
    },

    getProductById: async (id) => {
        const response = await api.get(`/products/${id}`);
        if (!response.data?.data) throw new Error("Product not found");
        return response.data.data;
    },

    getCategories: async () => {
        const response = await api.get('/categories');
    return Array.isArray(response.data?.data) ? response.data.data : [];
    },

    getBestDeals: async (limit = 6) => {
        const response = await api.get(`/products/deals?limit=${limit}`);
        return response.data?.data || [];
    }
};