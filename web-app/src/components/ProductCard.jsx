import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, AlertCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function ProductCard({ product }) {
    const addToCart = useCartStore((state) => state.addToCart);
    const [currentQty, setCurrentQty] = useState(product.moq);
    const [isAdded, setIsAdded] = useState(false);

    // Explicitly check for out of stock
    const isOutOfStock = product.stock <= 0;

    const handleQtyChange = (newQty) => {
        if (isOutOfStock) return;
        if (newQty < product.moq) return;
        setCurrentQty(newQty);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOutOfStock) return;

        setIsAdded(true);
        await addToCart(product.id, currentQty, 'WHOLESALE', 0);
        setTimeout(() => setIsAdded(false), 1800);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            // Add a slight grayscale/opacity effect to the whole card if out of stock
            className={`group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-lg ${isOutOfStock ? 'opacity-70 grayscale-[0.3]' : ''}`}
        >
            <Link
                to={`/product/${product.id}`}
                className="relative aspect-square overflow-hidden bg-slate-50"
            >
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges Container */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {/* Out of Stock Badge Overlay */}
                    {isOutOfStock && (
                        <span className="flex items-center gap-1 rounded-md bg-red-500/90 px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm shadow-sm">
                            <AlertCircle size={12} /> Out of Stock
                        </span>
                    )}

                    {product.margin >= 40 && !isOutOfStock && (
                        <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-800 uppercase shadow-sm">
                            High Margin
                        </span>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-4">
                <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">SKU: {product.skuId}</span>
                    <span className="text-xs font-bold text-slate-700">MOQ: {product.moq}</span>
                </div>
                <Link
                    to={`/product/${product.id}`}
                    className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600"
                >
                    {product.name}
                </Link>
                <div className="mt-auto flex items-end justify-between pt-4">
                    <div>
                        <span className="block text-xs font-medium text-slate-400 line-through">
                            ₹{product.originalPrice}
                        </span>
                        <span className="text-lg font-extrabold text-slate-900">
                            ₹{product.price.toLocaleString()}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="block text-sm font-bold text-emerald-600">
                            {product.margin}% Margin
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                    <div className="flex h-10 w-1/3 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2">
                        <input
                            type="number"
                            value={currentQty}
                            onChange={(e) =>
                                handleQtyChange(parseInt(e.target.value) || product.moq)
                            }
                            disabled={isOutOfStock}
                            className="w-full bg-transparent text-center text-sm font-bold text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            min={product.moq}
                            step={product.moq}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={isOutOfStock}
                        // Change button styling and text based on stock status
                        className={`flex h-10 w-2/3 items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-70 ${isOutOfStock
                                ? 'bg-slate-300 text-slate-500'
                                : isAdded
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                    >
                        {isOutOfStock ? 'Sold Out' : isAdded ? 'Added' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}