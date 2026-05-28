import React from 'react';
import { Zap, Box, ShieldCheck, TrendingUp } from 'lucide-react';

function B2BFilterBar({ filters, onFilterChange, className = '' }) {
    const marginTiers = [
        { label: 'Any Margin', value: 0 },
        { label: '20%+', value: 20 },
        { label: '40%+', value: 40 },
        { label: '60%+', value: 60 },
    ];

    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
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

            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-300 bg-white p-1 whitespace-nowrap shadow-sm">
                <div className="shrink-0 pr-1 pl-2 text-slate-400">
                    <TrendingUp size={16} />
                </div>
                {marginTiers.map((tier) => (
                    <button
                        key={tier.value}
                        onClick={() => onFilterChange('margin', tier.value)}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                            filters.margin === tier.value
                                ? 'bg-emerald-100 text-emerald-800 shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        {tier.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onFilterChange('readyToShip', !filters.readyToShip)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-black shadow-sm transition-all duration-300 ${
                        filters.readyToShip
                            ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-md ring-2 ring-amber-500/20'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                >
                    <Zap
                        size={16}
                        className={
                            filters.readyToShip ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                        }
                    />
                    Ready to Dispatch
                </button>

                <button
                    onClick={() => onFilterChange('lowRtoRisk', !filters.lowRtoRisk)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold shadow-sm transition-all duration-200 ${
                        filters.lowRtoRisk
                            ? 'border-blue-300 bg-blue-100 text-blue-800'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <ShieldCheck
                        size={16}
                        className={filters.lowRtoRisk ? 'text-blue-600' : 'text-slate-400'}
                    />
                    Low RTO Risk
                </button>
            </div>
        </div>
    );
}

export default B2BFilterBar;
