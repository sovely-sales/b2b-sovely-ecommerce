import React from 'react';
import { X, Box, Check, Truck, ShieldCheck, Zap } from 'lucide-react';

export default function ProductFilterSidebar({
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    category,
    setCategory,
    dbCategories,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    maxDispatchDays,
    setMaxDispatchDays,
    verifiedOnly,
    setVerifiedOnly,
    b2bFilters,
    setB2bFilters,
    resetAll,
}) {
    return (
        <aside
            className={`no-scrollbar fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 lg:sticky lg:top-24 lg:z-0 lg:h-[calc(100vh-theme(spacing.24)-2rem)] lg:w-64 lg:translate-x-0 lg:rounded-xl lg:border lg:border-slate-200 lg:p-5 lg:shadow-sm ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-bold text-slate-900">Filters</h3>
                <div className="flex items-center gap-2">
                    <button
                        className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
                        onClick={resetAll}
                    >
                        Clear All
                    </button>
                    <button
                        className="p-1 text-slate-400 lg:hidden"
                        onClick={() => setIsMobileFilterOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {}
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Box size={14} /> Category
                    </h4>
                    <div className="no-scrollbar max-h-48 space-y-0.5 overflow-y-auto pr-2">
                        {[{ _id: 'All', name: 'All Categories' }, ...dbCategories].map((cat) => (
                            <label
                                key={cat._id || cat.name}
                                className="group flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                            >
                                <span
                                    className={`text-sm transition-colors ${category === cat.name ? 'font-bold text-emerald-600' : 'font-medium text-slate-600 group-hover:text-slate-900'}`}
                                >
                                    {cat.name}
                                </span>
                                <input
                                    type="radio"
                                    className="sr-only"
                                    checked={category === cat.name}
                                    onChange={() => setCategory(cat.name)}
                                />
                                {category === cat.name && (
                                    <Check size={14} className="text-emerald-600" />
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {}
                <div className="space-y-3 border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-semibold text-slate-700">Unit Price (₹)</h4>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={minPrice}
                            onChange={(e) => {
                                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                                setMinPrice(val);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        />
                        <span className="text-slate-300">-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={(e) => {
                                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                                setMaxPrice(val);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        />
                    </div>
                </div>

                {}
                <div className="space-y-3 border-t border-slate-100 pt-5">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Truck size={14} /> Dispatch Target
                    </h4>
                    <div className="flex flex-col gap-2">
                        {[
                            { val: '1', label: 'Under 24 Hours' },
                            { val: '3', label: 'Under 3 Days' },
                            { val: '7', label: 'Under 7 Days' },
                        ].map((time) => (
                            <button
                                key={time.val}
                                onClick={() =>
                                    setMaxDispatchDays(maxDispatchDays === time.val ? '' : time.val)
                                }
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${maxDispatchDays === time.val ? 'border-slate-900 bg-slate-900 font-bold text-white' : 'border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                            >
                                {time.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Verified Supplier */}
                <div className="border-t border-slate-100 pt-5">
                    <label className="group flex cursor-pointer items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors group-hover:text-slate-900">
                            <ShieldCheck size={16} className="text-blue-600" /> Verified Vendors
                        </span>
                        <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${verifiedOnly ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={verifiedOnly}
                                onChange={() => setVerifiedOnly(!verifiedOnly)}
                            />
                            <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${verifiedOnly ? 'translate-x-4.5' : 'translate-x-1'}`}
                            />
                        </div>
                    </label>
                </div>

                {/* Ready to Ship Sidebar */}
                <div className="border-t border-slate-100 pt-5">
                    <label className="group flex cursor-pointer items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors group-hover:text-slate-900">
                            <Zap size={16} className="text-amber-500" /> Ready to Ship
                        </span>
                        <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b2bFilters.readyToShip ? 'bg-amber-500' : 'bg-slate-200'}`}
                        >
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={b2bFilters.readyToShip}
                                onChange={() =>
                                    setB2bFilters((p) => ({ ...p, readyToShip: !p.readyToShip }))
                                }
                            />
                            <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${b2bFilters.readyToShip ? 'translate-x-4.5' : 'translate-x-1'}`}
                            />
                        </div>
                    </label>
                </div>

                {/* Top Vendors Selection */}
                <div className="space-y-3 border-t border-slate-100 pt-5 pb-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-700 uppercase">
                        Top Verified Brands
                    </h4>
                    <div className="flex flex-col gap-1">
                        {['all', 'Titan', 'Syska', 'HP', 'Sovely Official'].map((v) => (
                            <button
                                key={v}
                                onClick={() => setB2bFilters((p) => ({ ...p, vendor: v }))}
                                className={`rounded-lg px-3 py-2 text-left text-sm transition-all ${b2bFilters.vendor === v ? 'bg-slate-900 font-extrabold text-white shadow-md' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                {v === 'all' ? 'All Vendors' : v}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
