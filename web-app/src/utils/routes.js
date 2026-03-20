export const ROUTES = {
    HOME: '/',
    SEARCH: '/search',
    PRODUCT: (id) => `/product/${id}`,
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    CHECKOUT: '/checkout',
    ORDERS: '/orders',
    ORDER_TRACKING: (id) => `/orders/${id}/track`,
    WALLET: '/wallet',
    MY_ACCOUNT: '/my-account',
    ACCOUNT_SETTINGS: '/account/settings', // Fix for Flaw #1
    INVOICES: '/invoices',
    QUICK_ORDER: '/quick-order',
    ADMIN: '/admin'
};