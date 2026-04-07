import { create } from 'zustand';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useCartStore = create((set, get) => ({
    cart: null,
    isLoading: false,
    error: null,

    getCartCount: () => {
        const cart = get().cart;
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((total, item) => total + (item.qty || 0), 0);
    },

    fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get('/cart');
            set({ cart: res.data.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to fetch cart',
                isLoading: false,
            });
        }
    },

    addToCart: async (
        productId,
        qty,
        orderType,
        resellerSellingPrice = 0,
        customerDetails = null,
        saveToAddressBook = false
    ) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post('/cart', {
                productId,
                qty,
                orderType,
                resellerSellingPrice,
                customerDetails,
                saveToAddressBook,
            });
            set({ cart: res.data.data, isLoading: false });
            toast.success(`${qty} item(s) added to your procurement cart!`, {
                position: 'bottom-right',
                duration: 3000,
            });
            return { success: true };
        } catch (error) {
            set({ error: error.response?.data?.message, isLoading: false });
            toast.error(error.response?.data?.message || 'Failed to add to cart', {
                position: 'bottom-right',
            });
            return { success: false, message: error.response?.data?.message };
        }
    },

    updateCartItem: async (itemId, qty, resellerSellingPrice) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.put(`/cart/item/${itemId}`, {
                qty,
                resellerSellingPrice,
            });
            set({ cart: res.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.response?.data?.message, isLoading: false });
        }
    },

    assignCustomerToItem: async (itemId, customerDetails, saveToAddressBook = false) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.put(`/cart/item/${itemId}/customer`, {
                customerDetails,
                saveToAddressBook,
            });
            set({ cart: res.data.data, isLoading: false });
            toast.success('Destination assigned successfully!', { position: 'bottom-right' });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message, isLoading: false });
            toast.error(error.response?.data?.message || 'Failed to assign destination');
            return false;
        }
    },

    removeFromCart: async (itemId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.delete(`/cart/item/${itemId}`);
            set({ cart: res.data.data, isLoading: false });
            toast.success('Item removed from cart', { position: 'bottom-right' });
        } catch (error) {
            set({ error: error.response?.data?.message, isLoading: false });
        }
    },

    clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.delete('/cart');

            set({ cart: res.data.data, isLoading: false });
            toast.success('Cart cleared successfully', { position: 'bottom-right' });
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to clear cart',
                isLoading: false,
            });
            toast.error('Could not clear cart. Please try again.', { position: 'bottom-right' });
        }
    },

    clearCartState: () => set({ cart: null }),
}));
