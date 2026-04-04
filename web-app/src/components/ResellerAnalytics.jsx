import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IndianRupee,
    TrendingUp,
    Clock,
    AlertTriangle,
    ShieldAlert,
    ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ResellerAnalytics = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [range, setRange] = useState('month');

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/analytics/reseller?range=${range}`);
                setData(res.data.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch reseller analytics', error);
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, [range]);

    if (isLoading && !data) {
        return <div className="mt-8 h-64 w-full animate-pulse rounded-[2.5rem] bg-slate-100"></div>;
    }

    if (!data) return null;

    const maxProfit = Math.max(...data.profitTrend.map((d) => d.profit), 1);

    // FIX: Dynamically calculate the number of days for the chart title
    const daysInTrend = data.profitTrend?.length || 15;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
        >
            {/* Header with Range Selector */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    {/* FIX: Reduced the font size here to clearly make it a subsection of the Hub */}
                    <h2 className="text-xl font-bold text-slate-800">Performance Overview</h2>
                    <p className="text-sm font-medium text-slate-500">
                        Monitor your margins and operational health.
                    </p>
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
                    {['week', 'month', '3months'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${range === r
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action Required Banner for NDRs */}
            {data.kpis.ndrActionRequired > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-extrabold text-red-900">
                                {data.kpis.ndrActionRequired} Orders require your attention!
                            </h4>
                            <p className="text-sm font-medium text-red-700">
                                Delivery failed. Contact buyers to update addresses or attempt
                                re-delivery to prevent RTO charges.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/orders?filter=ndr"
                        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                    >
                        Review NDRs <ArrowRight size={16} />
                    </Link>
                </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <IndianRupee size={20} />
                        </div>
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                            Available Profit
                        </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">
                        ₹{data.kpis.realizedProfit.toLocaleString('en-IN')}
                    </h3>
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <TrendingUp size={14} /> Ready for withdrawal
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <Clock size={20} />
                        </div>
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                            Pipeline Margin
                        </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">
                        ₹{data.kpis.pendingProfit.toLocaleString('en-IN')}
                    </h3>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                        Expected from shipped/delivered orders
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <AlertTriangle size={20} />
                        </div>
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                            Overall RTO Rate
                        </span>
                    </div>
                    <div className="flex items-end gap-3">
                        <h3
                            className={`text-3xl font-black ${data.kpis.rtoRate > 20 ? 'text-red-600' : 'text-slate-900'}`}
                        >
                            {data.kpis.rtoRate}%
                        </h3>
                        {data.kpis.rtoRate > 20 && (
                            <span className="mb-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                                High Risk
                            </span>
                        )}
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={`h-full ${data.kpis.rtoRate > 20 ? 'bg-red-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(data.kpis.rtoRate, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    {/* FIX: Title is now dynamically based on the array length */}
                    <h3 className="text-lg font-extrabold text-slate-900">{daysInTrend}-Day Margin Trend</h3>
                    <p className="text-sm font-medium text-slate-500">
                        Your total expected margins generated per day.
                    </p>
                </div>

                <div className="flex h-48 items-end gap-2 sm:gap-4">
                    {data.profitTrend.map((day, idx) => {
                        const heightPct = (day.profit / maxProfit) * 100;
                        return (
                            <div
                                key={idx}
                                className="group relative flex h-full flex-1 flex-col items-center justify-end"
                            >
                                {/* Tooltip */}
                                <div className="absolute -top-10 z-10 scale-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                                    ₹{day.profit.toLocaleString('en-IN')}
                                </div>
                                {/* Bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPct}%` }}
                                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                                    className="w-full rounded-t-md bg-emerald-200 transition-colors group-hover:bg-emerald-500"
                                ></motion.div>
                                {/* Label */}
                                <span className="mt-2 hidden text-[10px] font-bold text-slate-400 sm:block">
                                    {/* For 90 days, we don't want to show every single date label, it gets too crowded */}
                                    {(daysInTrend > 30 ? (idx % 5 === 0) : (idx % 2 === 0)) ? day.date : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default ResellerAnalytics;