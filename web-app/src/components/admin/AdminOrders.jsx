import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, X, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api.js';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterOption, setFilterOption] = useState('ALL');

    const [selectedOrder, setSelectedOrder] = useState(null);
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
                            {orders.map((order, index) => (
                                <motion.tr 
                                    key={order._id} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-slate-50/80 transition-colors group"
                                >
                                    <td className="p-4 font-bold text-slate-900 whitespace-nowrap">{order.orderId}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{order.customerId?.name || order.userId?.name || 'Unknown'}</div>
                                        <div className="text-xs font-medium text-slate-500">{order.customerId?.email || order.userId?.email}</div>
                                    </td>
                                    <td className="p-4 font-extrabold text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase ${
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'PROCESSING' ? 'bg-indigo-100 text-indigo-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <motion.button 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => { 

                                                setSelectedOrder(order); 
                                                setEditForm({ status: order.status, courierName: order.tracking?.courierName, trackingNumber: order.tracking?.trackingNumber }); 
                                            }} 
                                            className="text-accent font-bold text-sm bg-accent/10 hover:bg-accent hover:text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
                                        >
                                            Manage
                                        </motion.button>
                                    </td>
                                </motion.tr>
                            ))}
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
            {}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        {}
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                        />

                        {}
                        <motion.div 
                            initial={{ x: '100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.5 }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Manage Order</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{selectedOrder.orderId}</p>
                                </div>
                                <motion.button whileHover={{ rotate: 90 }} onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full">
                                    <X size={20} />
                                </motion.button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Status</label>
                                    <select 
                                        value={editForm.status} 
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} 
                                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-bold text-slate-700"
                                    >
                                        <option value="PENDING">Pending</option><option value="PROCESSING">Processing</option>
                                        <option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>

                                <AnimatePresence>
                                    {(editForm.status === 'SHIPPED' || editForm.status === 'DELIVERED') && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-4 overflow-hidden">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Courier Partner</label>
                                                <input type="text" placeholder="e.g. BlueDart" value={editForm.courierName || ''} onChange={(e) => setEditForm({ ...editForm, courierName: e.target.value })} className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-medium text-slate-900" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tracking / AWB Number</label>
                                                <input type="text" placeholder="e.g. 123456789" value={editForm.trackingNumber || ''} onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })} className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-medium text-slate-900" />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedOrder(null)} className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
                                    Cancel
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isSaving} onClick={() => submitOrderUpdate(selectedOrder._id)} className="flex-1 px-4 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-accent rounded-xl transition-colors disabled:opacity-50 shadow-md">
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminOrders;