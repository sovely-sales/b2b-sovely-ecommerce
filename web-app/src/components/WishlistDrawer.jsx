import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistContext } from '../WishlistContext';
import { CartContext } from '../CartContext';
import { X, Trash2, Heart, ShoppingCart } from 'lucide-react';
import { productApi } from '../features/products/api/productApi';

function WishlistDrawer({ isOpen, onClose }) {
    const { wishlistItems, toggleWishlist } = useContext(WishlistContext);
    const { addToCart } = useContext(CartContext);
    const navigate = useNavigate();
    const [fullWishlistProducts, setFullWishlistProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFullProducts = async () => {
            if (!isOpen || !wishlistItems || wishlistItems.length === 0) return;

            setLoading(true);
            try {
                const itemsToDraw = wishlistItems.map(item => {
                    if (item && item.name && item.price) return item;
                    if (item && item.productId) return item.productId;
                    return item;
                });
                setFullWishlistProducts(itemsToDraw);
            } catch (error) {
                console.error("Error organizing wishlist objects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProducts();
    }, [isOpen, wishlistItems]);

    const formatPrice = (price) => {
        if (typeof price === 'number') return `₹${price.toLocaleString('en-IN')}`;
        return price; 
    };

    const getItemSafe = (item) => {
        const id = item._id || item.id || item;
        const name = item.name || item.title || 'Product Name';
        const price = item.price || item.platformSellPrice || 0;

        let extractedImage = 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&q=80';
        if (item.images && item.images.length > 0) {
            extractedImage = typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url;
        } else if (item.image) {
            extractedImage = typeof item.image === 'string' ? item.image : item.image.url;
        }

        return { id, name, price, image: extractedImage, src: item };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]" 
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div 
                className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md">
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        Your Wishlist 
                        <span className="bg-danger text-white text-xs py-0.5 px-2 rounded-full">
                            {wishlistItems?.length || 0}
                        </span>
                    </h2>
                    <button 
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" 
                        onClick={onClose}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                    {!wishlistItems || wishlistItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                <Heart size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Your wishlist is empty</h3>
                                <p className="text-slate-500 text-sm font-medium">Save items you love here to review them later.</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="mt-4 px-6 py-3 bg-white border border-slate-200 text-slate-900 font-bold rounded-full shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                            >
                                Discover Products
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-accent animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fullWishlistProducts.map((rawItem, idx) => {
                                const item = getItemSafe(rawItem);
                                return (
                                    <div 
                                        key={item.id || idx} 
                                        className="group bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex gap-4 cursor-pointer hover:border-accent/30 hover:shadow-md transition-all"
                                        onClick={() => {
                                            navigate(`/product/${item.id}`);
                                            onClose();
                                        }}
                                    >
                                        <div className="w-24 h-28 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        
                                        <div className="flex flex-col flex-1 py-1">
                                            <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-1 group-hover:text-accent transition-colors">
                                                {item.name}
                                            </h4>
                                            <div className="text-sm font-extrabold text-slate-900 mb-3">
                                                {formatPrice(item.price)}
                                            </div>
                                            
                                            <div className="mt-auto flex items-center gap-2">
                                                <button
                                                    className="flex-1 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-accent hover:shadow-md hover:shadow-accent/20 transition-all flex items-center justify-center gap-1.5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart({
                                                            id: item.id,
                                                            name: item.name,
                                                            price: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.-]+/g, "")) : item.price,
                                                            image: item.image,
                                                            sku: rawItem.sku || rawItem.skuId || `SKU-${item.id}`
                                                        });
                                                        toggleWishlist({ id: item.id }); 
                                                    }}
                                                >
                                                    <ShoppingCart size={14} /> Add to Cart
                                                </button>
                                                <button
                                                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-danger hover:border-danger hover:bg-danger/5 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleWishlist({ id: item.id });
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WishlistDrawer;
