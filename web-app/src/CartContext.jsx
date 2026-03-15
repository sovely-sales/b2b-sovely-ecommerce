import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const localData = localStorage.getItem('sovely_cart');
        return localData ? JSON.parse(localData) : [];
    });

    useEffect(() => {
        localStorage.setItem('sovely_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Use _id for MongoDB compatibility
    const addToCart = (product, quantity = 1) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.product._id === product._id);
            if (existing) {
                return prev.map(item =>
                    item.product._id === product._id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.product._id !== productId));
    };

    const updateQuantity = (productId, change) => {
        setCartItems(prev => {
            return prev.map(item => {
                if (item.product._id === productId) {
                    const newQuantity = item.quantity + change;
                    if (newQuantity <= 0) return null; 
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(Boolean); 
        });
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
