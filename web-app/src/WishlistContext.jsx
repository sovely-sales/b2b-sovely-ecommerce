import React, { createContext, useState, useEffect, useContext } from 'react';
import api from './utils/api.js';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlistItems([]);
        }
    }, [user]);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await api.get('/wishlist');
            if (res.data?.success) {
                setWishlistItems(res.data.data.items.map(i => i.productId));
            }
        } catch (error) {
            console.error("Failed to fetch wishlist:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleWishlist = async (product) => {
        if (!user) {
            alert("Please login or create an account to use the wishlist.");
            return;
        }

        const productId = product.id || product._id;
        if (!productId) return;

        const exists = wishlistItems.some(i => {
            const currentId = (i?._id || i?.id || i)?.toString();
            return currentId === productId?.toString();
        });

        setWishlistItems(prev => {
            if (exists) {
                return prev.filter(i => {
                    const currentId = (i?._id || i?.id || i)?.toString();
                    return currentId !== productId?.toString();
                });
            } else {
                return [...prev, product];
            }
        });

        try {
            const res = await api.post('/wishlist/toggle', { productId });

            if (res.data?.success) {
                setWishlistItems(res.data.data.wishlist.items.map(i => i.productId));
            }
        } catch (error) {
            console.error("Failed to toggle wishlist:", error);

            fetchWishlist();
        }
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(i => {
            const currentId = (i?._id || i?.id || i)?.toString();
            return currentId === productId?.toString();
        });
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, loading }}>
            {children}
        </WishlistContext.Provider>
    );
};
