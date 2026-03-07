import axios from 'axios';

const api = axios.create({
    // Now it dynamically reads the URL we saved in the .env file!
    baseURL: import.meta.env.VITE_API_BASE_URL, 
    withCredentials: true
});

export const productApi = {
    getProducts: async ({ page = 1, limit = 12, query = '', categoryId = '' } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (query) params.append('query', query);
        if (categoryId && categoryId !== 'All') params.append('categoryId', categoryId);

        const response = await api.get(`/products?${params.toString()}`);
        return response.data.data;
    },

    getProductById: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data.data;
    },

    getCategories: async () => {
        const response = await api.get('/categories');
        return response.data.data;
    },

    getBestDeals: async (limit = 6) => {
        const response = await api.get(`/products/deals?limit=${limit}`);
        return response.data.data;
    }
};
