import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Minus, Plus, Box } from 'lucide-react';

export default function ProductTableRow({ product, bulkCartQty, onUpdateBulkCart }) {
    const [localQty, setLocalQty] = useState(1);
    const isSelected = !!bulkCartQty;

    useEffect(() => {
        if (!bulkCartQty) setLocalQty(1);
    }, [bulkCartQty]);

    const handleQtyChange = (newQty) => {
        if (newQty < 1) return;
        setLocalQty(newQty);

        onUpdateBulkCart(product, newQty, true);
    };

    const handleToggleSelect = () => {
        onUpdateBulkCart(product, localQty, !isSelected);
    };

    const handleRowClick = (e) => {
        if (
            e.target.closest('button') ||
            e.target.closest('a') ||
            e.target.tagName.toLowerCase() === 'input'
        ) {
            return;
        }
        handleToggleSelect();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleRowClick}
            className={`group flex cursor-pointer flex-col border-b p-4 transition-colors last:border-0 md:grid md:grid-cols-[40px_auto_1fr_120px_120px_160px] md:items-center md:gap-4 md:p-3 ${
                isSelected
                    ? 'border-emerald-100 bg-emerald-50/50'
                    : 'border-slate-100 hover:bg-slate-50/50'
            }`}
        >
            {}
            <div className="hidden items-center justify-center md:flex">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleToggleSelect}
                    className="h-5 w-5 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
            </div>

            {}
            <div className="hidden h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            </div>

            {}
            <div className="flex min-w-0 flex-col items-start justify-center">
                <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                        SKU: {product.skuId}
                    </span>
                    {product.isVerified && (
                        <ShieldCheck size={14} className="text-blue-500" title="Verified Vendor" />
                    )}
                </div>
                {}
                <div className="w-full truncate">
                    <Link
                        to={`/product/${product.id}`}
                        className="inline text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600"
                    >
                        {product.name}
                    </Link>
                </div>
                {product.vendor && product.vendor.toLowerCase() !== 'your brand' && (
                    <span className="truncate text-xs font-medium text-slate-500">
                        By {product.vendor}
                    </span>
                )}
            </div>

            {}
            <div className="hidden flex-col items-center justify-center md:flex">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <Box size={14} className="text-slate-400" /> Stock: {product.stock}
                </span>
            </div>

            {}
            <div className="hidden flex-col items-end justify-center md:flex">
                <span className="text-base font-extrabold text-slate-900">
                    ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                    +{product.gst || 18}% GST
                </span>
            </div>

            {}
            <div className="mt-4 flex flex-col gap-2 md:mt-0">
                <div className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2">
                    <button
                        onClick={() => handleQtyChange(localQty - 1)}
                        className="p-1 text-slate-400 hover:text-slate-900"
                    >
                        <Minus size={14} />
                    </button>
                    <input
                        type="number"
                        value={localQty}
                        onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
                        className="w-12 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                        min="1"
                    />
                    <button
                        onClick={() => handleQtyChange(localQty + 1)}
                        className="p-1 text-slate-400 hover:text-slate-900"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <button
                    onClick={handleToggleSelect}
                    className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-bold transition-all md:hidden ${isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    {isSelected ? 'Selected for Bulk Add' : 'Select Item'}
                </button>
            </div>
        </motion.div>
    );
}
