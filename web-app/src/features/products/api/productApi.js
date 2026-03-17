import api from '../../../utils/api.js';

export const productApi = {
    getProducts: async ({ 
        page = 1, limit = 24, query = '', categoryId = '',
        minPrice, maxPrice, saleOnly, shipping, minRating, sort
    } = {}) => {
        const params = new URLSearchParams();

        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (query) params.append('query', query);
        if (categoryId && categoryId !== 'All') params.append('categoryId', categoryId);

        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (saleOnly) params.append('saleOnly', 'true');
        if (shipping && shipping.length > 0) params.append('shipping', shipping.join(',')); 
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