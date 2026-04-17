import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { ROUTES } from '../utils/routes';
import { AuthContext } from '../AuthContext';

export default function ProductCard({ product }) {
    const { user } = useContext(AuthContext);
    const addToCart = useCartStore((state) => state.addToCart);
    const navigate = useNavigate();
    const [isAdded, setIsAdded] = useState(false);
    const [localQty, setLocalQty] = useState(1);

    const isOutOfStock = product.stock <= 0;

    const handleQtyChange = (newQty) => {
        if (newQty < 1) return;
        setLocalQty(newQty);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate(ROUTES.LOGIN);
            return;
        }

        if (isOutOfStock) return;

        setIsAdded(true);
        const res = await addToCart(product.id, localQty, 'DROPSHIP', 0);
        if (res.success) {
            navigate(ROUTES.MY_ACCOUNT);
        }
        setTimeout(() => setIsAdded(false), 1800);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            whileHover={{ y: -4 }}
            className={`group flex flex-col rounded-2xl border border-slate-200 bg-white transition-[border-color,box-shadow] duration-200 hover:border-indigo-200 hover:shadow-md ${
                isOutOfStock ? 'opacity-60 grayscale-[0.5]' : ''
            }`}
        >
            <Link
                to={`/product/${product.id}`}
                className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-slate-50"
            >
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full transform-gpu object-cover object-center mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isOutOfStock ? (
                        <span className="flex items-center gap-1 rounded-full bg-slate-900/90 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-md">
                            Sold Out
                        </span>
                    ) : product.margin >= 40 ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold tracking-widest text-emerald-700 uppercase ring-1 ring-emerald-600/20 backdrop-blur-md">
                            {product.margin}% Margin
                        </span>
                    ) : null}
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-5">
                <div
                    className={`mb-2 flex items-center text-xs text-slate-400 ${product.vendor && product.vendor.toLowerCase() !== 'your brand' ? 'justify-between' : 'justify-end'}`}
                >
                    {product.vendor && product.vendor.toLowerCase() !== 'your brand' && (
                        <span className="font-medium">{product.vendor}</span>
                    )}
                    <span
                        className="max-w-[120px] truncate rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-500"
                        title={product.skuId}
                    >
                        SKU: {product.skuId}
                    </span>
                </div>

                <Link
                    to={`/product/${product.id}`}
                    className="mb-4 line-clamp-2 text-sm font-semibold text-slate-800 transition-colors hover:text-indigo-600"
                >
                    {product.name}
                </Link>

                <div className="mt-auto flex flex-col gap-3">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black tracking-tight text-slate-900">
                            ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                            (+{product.gst || 18}% GST)
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2 transition-shadow focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleQtyChange(localQty - 1);
                                }}
                                className="p-1 text-slate-400 transition-colors hover:text-indigo-600"
                            >
                                <Minus size={14} />
                            </button>
                            <input
                                type="number"
                                value={localQty}
                                onClick={(e) => e.preventDefault()}
                                onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
                                className="w-12 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                                min="1"
                            />
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleQtyChange(localQty + 1);
                                }}
                                className="p-1 text-slate-400 transition-colors hover:text-indigo-600"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={isOutOfStock}
                            className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${
                                isOutOfStock
                                    ? 'bg-slate-100 text-slate-400'
                                    : isAdded
                                      ? 'bg-emerald-500 text-white shadow-sm'
                                      : 'bg-slate-900 text-white shadow-sm hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-500/20'
                            }`}
                        >
                            {isAdded ? (
                                <>
                                    <Check size={14} strokeWidth={3} /> Added
                                </>
                            ) : (
                                'Quick Add'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
