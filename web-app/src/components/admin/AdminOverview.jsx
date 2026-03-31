import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertCircle, Users, ShieldAlert } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from 'recharts';
import api from '../../utils/api.js';

const AdminOverview = ({ setActiveTab }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                
                const res = await api.get('/analytics/dashboard');
                setAnalytics(res.data.data);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading || !analytics) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="border-t-accent mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200"></div>
                <p className="font-medium">Crunching Telemetry...</p>
            </div>
        );
    }

    const { kpis, revenueTrend, orderStatus, inventoryHealth } = analytics;

    const lowStockData = inventoryHealth.find((item) => item.name === 'Low Stock');
    const outOfStockData = inventoryHealth.find((item) => item.name === 'Out of Stock');
    const totalAlerts = (lowStockData?.value || 0) + (outOfStockData?.value || 0);

    
    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'DELIVERED':
                return '#10b981'; 
            case 'PROCESSING':
                return '#f59e0b'; 
            case 'SHIPPED':
                return '#3b82f6'; 
            case 'PENDING':
                return '#8b5cf6'; 
            case 'CANCELLED':
                return '#ef4444'; 
            default:
                return '#64748b'; 
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                {}
                <div className="flex cursor-default items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-green-500 hover:shadow-md">
                    <div className="rounded-2xl bg-green-50 p-4">
                        <DollarSign size={24} className="text-green-600" />
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Total Revenue
                        </p>
                        <h3 className="text-xl font-black text-slate-900">
                            ₹{kpis.totalRevenue?.toLocaleString('en-IN') || 0}
                        </h3>
                    </div>
                </div>

                {}
                <div
                    onClick={() => setActiveTab('users')}
                    className="group flex cursor-pointer items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
                >
                    <div className="rounded-2xl bg-blue-50 p-4 transition-colors group-hover:bg-blue-100">
                        <Users size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Total Customers
                        </p>
                        <h3 className="text-xl font-black text-slate-900">
                            {kpis.totalCustomers?.toLocaleString('en-IN') || 0}
                        </h3>
                    </div>
                </div>

                {}
                <div
                    onClick={() => setActiveTab('orders')}
                    className="group flex cursor-pointer items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md"
                >
                    <div className="rounded-2xl bg-indigo-50 p-4 transition-colors group-hover:bg-indigo-100">
                        <ShoppingBag size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Orders Processing
                        </p>
                        <h3 className="text-xl font-black text-slate-900">
                            {kpis.processingOrders || 0}
                        </h3>
                    </div>
                </div>

                {}
                <div
                    onClick={() => setActiveTab('products')}
                    className="group flex cursor-pointer items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-red-500 hover:shadow-md"
                >
                    <div className="rounded-2xl bg-red-50 p-4 transition-colors group-hover:bg-red-100">
                        <AlertCircle size={24} className="text-red-600" />
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            Stock Alerts
                        </p>
                        <h3 className="text-xl font-black text-slate-900">{totalAlerts} Items</h3>
                    </div>
                </div>

                {}
                <div
                    onClick={() => setActiveTab('users')}
                    className="group flex cursor-pointer items-center gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm transition-all hover:bg-amber-100 hover:shadow-md"
                >
                    <div className="rounded-2xl bg-amber-200/50 p-4 transition-colors group-hover:bg-amber-200">
                        <ShieldAlert size={24} className="text-amber-700" />
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] font-bold tracking-wider text-amber-700 uppercase">
                            Pending KYC
                        </p>
                        <h3 className="text-xl font-black text-amber-900">
                            {kpis.pendingKycCount || 0} Req
                        </h3>
                    </div>
                </div>
            </div>

            {}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="mb-6 text-sm font-bold tracking-wider text-slate-900 uppercase">
                        30-Day Revenue Trend
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={revenueTrend}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e2e8f0"
                                />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(val) => `₹${val}`}
                                    dx={-10}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Revenue"
                                    stroke="#0f172a"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-6 text-sm font-bold tracking-wider text-slate-900 uppercase">
                        Lifetime Order Status
                    </h3>
                    <div className="flex h-[300px] w-full flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={orderStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {orderStatus.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getStatusColor(entry.name)}
                                        />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#64748b',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-3">
                    <h3 className="mb-6 text-sm font-bold tracking-wider text-slate-900 uppercase">
                        Inventory Health Snapshot
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={inventoryHealth}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                layout="vertical"
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                    stroke="#e2e8f0"
                                />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
                                    width={120}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={30}>
                                    {inventoryHealth.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                entry.name.includes('Out')
                                                    ? '#ef4444'
                                                    : entry.name.includes('Low')
                                                      ? '#f59e0b'
                                                      : '#10b981'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
