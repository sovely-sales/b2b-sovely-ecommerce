import React from 'react';
import { X, Check } from 'lucide-react';

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
            className={`no-scrollbar fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 lg:sticky lg:top-24 lg:z-0 lg:h-[calc(100vh-theme(spacing.24)-2rem)] lg:w-64 lg:translate-x-0 lg:bg-transparent lg:p-0 lg:shadow-none ${
                isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            <div className="mb-8 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Filters</h3>
                <button
                    className="text-xs font-bold text-slate-400 transition-colors hover:text-slate-900"
                    onClick={resetAll}
                >
                    Clear All
                </button>
                <button
                    className="text-slate-400 lg:hidden"
                    onClick={() => setIsMobileFilterOpen(false)}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-10">
                {}
                <div>
                    <h4 className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                        Category
                    </h4>
                    <div className="space-y-1">
                        {[{ _id: 'All', name: 'All Categories' }, ...dbCategories].map((cat) => (
                            <label
                                key={cat._id || cat.name}
                                className="group flex cursor-pointer items-center justify-between py-1.5"
                            >
                                <span
                                    className={`text-sm transition-colors ${category === cat.name ? 'font-bold text-slate-900' : 'font-medium text-slate-500 group-hover:text-slate-800'}`}
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
                                    <Check size={14} className="text-slate-900" />
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {}
                <div>
                    <h4 className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                        Price Range
                    </h4>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            placeholder="Min"
                            value={minPrice}
                            onChange={(e) => setMinPrice(normalizePriceInput(e.target.value))}
                            onBlur={() => enforceRangeOnBlur('min')}
                            className="w-full rounded-xl bg-slate-100/50 px-4 py-2.5 text-sm font-medium text-slate-900 transition-all outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                        />
                        <span className="text-slate-300">-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(normalizePriceInput(e.target.value))}
                            onBlur={() => enforceRangeOnBlur('max')}
                            className="w-full rounded-xl bg-slate-100/50 px-4 py-2.5 text-sm font-medium text-slate-900 transition-all outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                        />
                    </div>
                </div>

                {}
                <div className="space-y-4">
                    <label className="flex cursor-pointer items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                            Verified Vendors Only
                        </span>
                        <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${verifiedOnly ? 'bg-emerald-500' : 'bg-slate-200'}`}
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

                    <label className="flex cursor-pointer items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Ready to Ship</span>
                        <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b2bFilters.readyToShip ? 'bg-emerald-500' : 'bg-slate-200'}`}
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
            </div>
        </aside>
    );
}
