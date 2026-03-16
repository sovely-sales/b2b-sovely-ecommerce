import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertCircle, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import api from '../../utils/api.js';

const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']; 

const AdminOverview = ({ setActiveTab }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // Hitting our new blazing-fast aggregation endpoint!
                const res = await api.get('/analytics/admin');
                setAnalytics(res.data.data);
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading || !analytics) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-accent rounded-full animate-spin mb-4"></div>
                <p className="font-medium">Crunching Telemetry...</p>
            </div>
        );
    }

    const { kpis, revenueTrend, orderStatus, inventoryHealth } = analytics;

    // Find the low stock count safely from our new payload
    const lowStockData = inventoryHealth.find(item => item.name === 'Low Stock');
    const outOfStockData = inventoryHealth.find(item => item.name === 'Out of Stock');
    const totalAlerts = (lowStockData?.value || 0) + (outOfStockData?.value || 0);

    return (
        <div className="flex flex-col gap-6">
            {/* KPI Cards (Now we have 4!) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="bg-green-50 p-4 rounded-2xl"><DollarSign size={24} className="text-green-600" /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</p>
                        <h3 className="text-xl font-black text-slate-900">₹{kpis.totalRevenue.toLocaleString('en-IN')}</h3>
                    </div>
                </div>

                <div onClick={() => setActiveTab('users')} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group">
                    <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-100 transition-colors"><Users size={24} className="text-blue-600" /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Customers</p>
                        <h3 className="text-xl font-black text-slate-900">{kpis.totalCustomers.toLocaleString('en-IN')}</h3>
                    </div>
                </div>

                <div onClick={() => setActiveTab('orders')} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-accent hover:shadow-md transition-all group">
                    <div className="bg-indigo-50 p-4 rounded-2xl group-hover:bg-accent/10 transition-colors"><ShoppingBag size={24} className="text-indigo-600 group-hover:text-accent" /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Orders Processing</p>
                        <h3 className="text-xl font-black text-slate-900">{kpis.processingOrders}</h3>
                    </div>
                </div>

                <div onClick={() => setActiveTab('products')} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-danger hover:shadow-md transition-all group">
                    <div className="bg-red-50 p-4 rounded-2xl group-hover:bg-danger/10 transition-colors"><AlertCircle size={24} className="text-red-600 group-hover:text-danger" /></div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Alerts</p>
                        <h3 className="text-xl font-black text-slate-900">{totalAlerts} Items</h3>
                    </div>
                </div>
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Line Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
                    <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">30-Day Revenue Trend</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val}`} dx={-10} />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="Revenue" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Pie Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Lifetime Order Status</h3>
                    <div className="h-[300px] w-full flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={orderStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {orderStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Health Bar Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-3">
                    <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Inventory Health Snapshot</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inventoryHealth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} width={120} />
                                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={30}>
                                    {inventoryHealth.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name.includes('Out') ? '#ef4444' : entry.name.includes('Low') ? '#f59e0b' : '#10b981'} />
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