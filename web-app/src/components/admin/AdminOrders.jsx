import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api.js';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterOption, setFilterOption] = useState('ALL');

    const [updatingId, setUpdatingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterOption]);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const res = await api.get('/orders/admin/all', {
                    params: {
                        page,
                        limit: 10,
                        search: debouncedSearch,
                        status: filterOption
                    }
                });
                setOrders(res.data.data.data);
                setTotalPages(res.data.data.pagination.totalPages);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [page, debouncedSearch, filterOption]);

    const submitOrderUpdate = async (id) => {
        setIsSaving(true);
        try {
            const res = await api.put(`/orders/${id}/status`, { 
                status: editForm.status, 
                courierName: editForm.courierName, 
                trackingNumber: editForm.trackingNumber 
            });
            setOrders(prev => prev.map(o => o._id === id ? res.data.data : o));
            setUpdatingId(null);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message;
            alert(`Update Failed: ${errorMsg}`);
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none outline-none ml-3 w-full text-sm font-medium text-slate-900 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center bg-white px-4 rounded-xl border border-slate-200 shadow-sm focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                    <Filter size={18} className="text-slate-400 mr-2" />
                    <select
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value)}
                        className="border-none outline-none py-2.5 bg-transparent text-sm font-bold text-slate-700 cursor-pointer"
                    >
                        <option value="ALL">All Filters</option>
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6">
                <div className="overflow-x-auto relative min-h-[300px]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-400">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin mb-2"></div>
                        </div>
                    )}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Order ID</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && orders.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No orders found matching your search.</td></tr> : null}
                            {orders.map(order => {
                                const isUpdating = updatingId === order._id;
                                return (
                                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900 whitespace-nowrap">{order.orderId}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{order.customerId?.name || order.userId?.name || 'Unknown'}</div>
                                            <div className="text-xs font-medium text-slate-500">{order.customerId?.email || order.userId?.email}</div>
                                        </td>
                                        <td className="p-4 font-extrabold text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase ${
                                                order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'PROCESSING' ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                            {order.tracking?.trackingNumber && <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{order.tracking.courierName}: {order.tracking.trackingNumber}</div>}
                                        </td>
                                        <td className="p-4">
                                            {isUpdating ? (
                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    <select 
                                                        value={editForm.status} 
                                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} 
                                                        className="p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-accent"
                                                    >
                                                        <option value="PENDING">Pending</option><option value="PROCESSING">Processing</option>
                                                        <option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option>
                                                        <option value="CANCELLED">Cancelled</option>
                                                    </select>
                                                    {(editForm.status === 'SHIPPED' || editForm.status === 'DELIVERED') && (
                                                        <>
                                                            <input type="text" placeholder="Courier" value={editForm.courierName || ''} onChange={(e) => setEditForm({ ...editForm, courierName: e.target.value })} className="p-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-accent" />
                                                            <input type="text" placeholder="AWB Number" value={editForm.trackingNumber || ''} onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })} className="p-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-accent" />
                                                        </>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button disabled={isSaving} onClick={() => submitOrderUpdate(order._id)} className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-xs hover:bg-accent transition-colors disabled:opacity-50">
                                                            {isSaving ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button onClick={() => setUpdatingId(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2 rounded-lg text-xs hover:bg-slate-200 transition-colors">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setUpdatingId(order._id); setEditForm({ status: order.status, courierName: order.tracking?.courierName, trackingNumber: order.tracking?.trackingNumber }); }} className="text-accent hover:text-slate-900 font-bold text-sm bg-accent/10 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors">Manage</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-sm font-bold text-slate-500">
                    Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages || 1}</span>
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </>
    );
};

export default AdminOrders;