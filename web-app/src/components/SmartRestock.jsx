import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, TrendingDown, PackagePlus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCartStore } from '../store/cartStore';
import { ROUTES } from '../utils/routes';

const SmartRestock = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [addingItemId, setAddingItemId] = useState(null);

    const addToCart = useCartStore((state) => state.addToCart);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const res = await api.get('/analytics/restock-predictions');
                setRecommendations(res.data.data || []);
            } catch (error) {
                console.error('Failed to fetch restock predictions', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPredictions();
    }, []);

    const handleQuickAdd = async (productId, qty) => {
        setAddingItemId(productId);

        const res = await addToCart(productId, qty, 'DROPSHIP');
        if (res.success) {
            navigate(ROUTES.MY_ACCOUNT);
        }
        setAddingItemId(null);
    };

    if (isLoading) {
        return (
            <div className="mt-8 h-48 animate-pulse rounded-[2.5rem] border border-slate-100 bg-slate-50 p-8"></div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 overflow-hidden rounded-[2.5rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm"
        >
            <div className="flex items-center justify-between border-b border-amber-100 px-8 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <TrendingDown size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                            Inventory Predictions
                        </h3>
                        <p className="text-xs font-medium text-amber-700">
                            Based on your sales velocity, you may run out of these soon.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2">
                <AnimatePresence>
                    {recommendations.map((item, index) => (
                        <motion.div
                            key={item.productId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg"
                        >
                            <div>
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <h4 className="line-clamp-2 font-bold text-slate-900">
                                        {item.title}
                                    </h4>
                                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-extrabold tracking-wider text-red-600 uppercase">
                                        <AlertCircle size={12} /> {item.estimatedDaysLeft} Days Left
                                    </span>
                                </div>
                                <p className="mb-4 font-mono text-xs font-medium text-slate-500">
                                    {item.sku}
                                </p>
                            </div>

                            <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-4">
                                <div>
                                    <span className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        Est. Margin
                                    </span>
                                    <span className="text-sm font-black text-emerald-600">
                                        {item.margin}%
                                    </span>
                                </div>
                                <button
                                    onClick={() =>
                                        handleQuickAdd(item.productId, item.suggestedQty)
                                    }
                                    disabled={addingItemId === item.productId}
                                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {addingItemId === item.productId ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <PackagePlus size={14} />
                                    )}
                                    {addingItemId === item.productId
                                        ? 'Adding...'
                                        : `Add ${item.suggestedQty} Units`}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default SmartRestock;
