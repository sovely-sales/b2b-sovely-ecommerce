

const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const API_BASE_URL = base.endsWith('/') ? base : `${base}/`;

export default API_BASE_URL;
