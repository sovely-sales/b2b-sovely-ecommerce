import React from 'react';
import { Zap, Box, Percent } from 'lucide-react';

function B2BFilterBar({ filters, onFilterChange, className = '' }) {
    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            {}
            <div className="focus-within:border-primary focus-within:ring-primary relative flex items-center rounded-lg border border-slate-300 bg-white shadow-sm transition-all focus-within:ring-1">
                <div className="pointer-events-none pl-3 text-slate-400">
                    <Box size={16} />
                </div>
                <select
                    className="w-full cursor-pointer appearance-none border-none bg-transparent py-2.5 pr-8 pl-2 text-sm font-medium text-slate-700 outline-none"
                    value={filters.moq || 'all'}
                    onChange={(e) => onFilterChange('moq', e.target.value)}
                >
                    <option value="all">Any MOQ</option>
                    <option value="under-50">Low MOQ (&lt; 50 units)</option>
                    <option value="50-500">Medium (50 - 500 units)</option>
                    <option value="bulk">True Bulk (500+ units)</option>
                </select>
                <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>

            {}
            <div className="focus-within:border-primary focus-within:ring-primary relative flex items-center rounded-lg border border-slate-300 bg-white shadow-sm transition-all focus-within:ring-1">
                <div className="pointer-events-none pl-3 text-slate-400">
                    <Percent size={16} />
                </div>
                <select
                    className="w-full cursor-pointer appearance-none border-none bg-transparent py-2.5 pr-8 pl-2 text-sm font-medium text-slate-700 outline-none"
                    value={filters.margin || 'all'}
                    onChange={(e) => onFilterChange('margin', e.target.value)}
                >
                    <option value="all">All Profit Margins</option>
                    <option value="high-margin">High Margin (40%+)</option>
                </select>
                <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>

            {}
            <button
                onClick={() => onFilterChange('readyToShip', !filters.readyToShip)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold shadow-sm transition-all duration-200 ${
                    filters.readyToShip
                        ? 'border-amber-300 bg-amber-100 text-amber-800'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
                <Zap
                    size={16}
                    className={
                        filters.readyToShip ? 'fill-amber-600 text-amber-600' : 'text-slate-400'
                    }
                />
                Ready to Dispatch
            </button>
        </div>
    );
}

export default B2BFilterBar;
