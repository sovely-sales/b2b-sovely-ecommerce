import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IndianRupee,
    TrendingUp,
    Clock,
    AlertTriangle,
    ShieldAlert,
    ArrowRight,
    Package,
    Star,
    Award,
    Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ResellerAnalytics = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(
                    `/analytics/reseller?startDate=${startDate}&endDate=${endDate}`
                );
                setData(res.data.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to fetch reseller analytics', error);
                setIsLoading(false);
            }
        };

        if (startDate && endDate) {
            fetchAnalytics();
        }
    }, [startDate, endDate]);

    if (isLoading && !data) {
        return <div className="mt-8 h-64 w-full animate-pulse rounded-[2rem] bg-slate-100"></div>;
    }

    if (!data) return null;

    const maxProfit = Math.max(...(data.profitTrend?.map((d) => d.profit) || [1]), 1);
    const daysInTrend = data.profitTrend?.length || 1;

    const gapClass = daysInTrend > 60 ? 'gap-0' : daysInTrend > 30 ? 'gap-[1px]' : 'gap-1 sm:gap-2';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
        >
            {}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Performance Overview</h2>
                    <p className="text-sm font-medium text-slate-500">
                        Monitor your margins, operational health, and best customers.
                    </p>
                </div>

                {}
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="flex items-center gap-2 px-2 text-slate-400">
                        <Calendar size={16} />
                    </div>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate}
                        className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 transition-colors outline-none hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm font-black text-slate-300">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        max={new Date().toISOString().split('T')[0]}
                        className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 transition-colors outline-none hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
            </div>

            {}
            {data.kpis.ndrActionRequired > 0 && (
                <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
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
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto"
                    >
                        Review NDRs <ArrowRight size={16} />
                    </Link>
                </div>
            )}

            {}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <Package size={20} />
                        </div>
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                            Order Volume
                        </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">
                        {data.kpis.totalOrders.toLocaleString('en-IN')}
                    </h3>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                        Processed in this period
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <IndianRupee size={20} />
                        </div>
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                            Realized Profit
                        </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">
                        ₹{data.kpis.realizedProfit.toLocaleString('en-IN')}
                    </h3>
                    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <TrendingUp size={14} /> Ready for withdrawal
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
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
                        Expected upon delivery
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
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
                            className={`h-full transition-all duration-1000 ${data.kpis.rtoRate > 20 ? 'bg-red-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(data.kpis.rtoRate, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900">Margin Trend</h3>
                            <p className="text-sm font-medium text-slate-500">
                                Total expected margins generated per day.
                            </p>
                        </div>
                        {isLoading && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
                        )}
                    </div>

                    {}
                    <div
                        className={`flex h-56 w-full items-end border-b border-slate-100 pb-2 ${gapClass}`}
                    >
                        {data.profitTrend?.map((day, idx) => {
                            const heightPct = Math.max((day.profit / maxProfit) * 100, 1);

                            const showLabel = idx % Math.ceil(daysInTrend / 6) === 0;

                            return (
                                <div
                                    key={idx}
                                    className="group relative flex h-full min-w-[2px] flex-1 flex-col items-center justify-end"
                                >
                                    <div className="absolute -top-10 z-10 scale-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-white opacity-0 shadow-md transition-all group-hover:scale-100 group-hover:opacity-100">
                                        ₹{day.profit.toLocaleString('en-IN')}
                                    </div>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPct}%` }}
                                        transition={{
                                            duration: 0.5,
                                            delay: idx * 0.01,
                                            ease: 'easeOut',
                                        }}
                                        className="w-full rounded-t-[2px] bg-indigo-100 transition-colors group-hover:bg-indigo-500"
                                    ></motion.div>

                                    <span
                                        className={`mt-3 -ml-2 origin-top-left rotate-[-45deg] text-[10px] font-bold whitespace-nowrap text-slate-400 transition-opacity ${showLabel ? 'opacity-100' : 'hidden opacity-0 sm:block sm:opacity-0'}`}
                                    >
                                        {day.date}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {}
                <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            <Award size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900">Top Buyers</h3>
                            <p className="text-xs font-medium text-slate-500">
                                Highest LTV Customers
                            </p>
                        </div>
                    </div>

                    <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
                        {data.topBuyers?.length > 0 ? (
                            data.topBuyers.map((buyer, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-2xl border border-slate-50 p-3 transition-colors hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-md">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="line-clamp-1 text-sm font-bold text-slate-900">
                                                {buyer.name}
                                            </p>
                                            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                {buyer.orderCount} Orders
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-emerald-600">
                                            +₹{buyer.totalProfitGenerated.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-400">
                                            Net Margin
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
                                <Star size={32} className="mb-2 opacity-20" />
                                <p className="text-sm font-bold">No dropship data yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ResellerAnalytics;
