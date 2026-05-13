const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

export const API_BASE_URL = base;

export default API_BASE_URL;
