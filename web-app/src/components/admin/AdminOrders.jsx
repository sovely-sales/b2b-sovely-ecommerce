import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    X,
    Package,
    Truck,
    MapPin,
    TrendingUp,
    AlertOctagon,
    ShieldCheck,
    ShoppingCart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';

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
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterOption]);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                // THE FIX: Changed from '/orders/admin/all' to '/orders/all'
                const res = await api.get('/orders/all', {
                    params: {
                        page,
                        limit: 20, // Increased limit for high-density view
                        search: debouncedSearch,
                        status: filterOption === 'ALL' ? '' : filterOption,
                    },
                });
                setOrders(res.data?.data?.orders || []);
                setTotalPages(res.data?.data?.pagination?.pages || 1);
            } catch (err) {
                console.error('Failed to fetch admin orders:', err);
                toast.error('Failed to load orders. Check your connection.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [page, debouncedSearch, filterOption]);

    const submitOrderUpdate = async (id) => {
        setIsSaving(true);
        try {
            const payload = {
                status: editForm.status,
                courierName: editForm.courierName,
                awbNumber: editForm.awbNumber,
                ndrReason: editForm.ndrReason,
            };

            const res = await api.put(`/orders/${id}/status`, payload);
            setOrders((prev) => prev.map((o) => (o._id === id ? res.data.data : o)));
            toast.success(`Order ${res.data.data.orderId} updated successfully`);
            setSelectedOrder(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update order');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING':
            case 'PROCESSING':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'SHIPPED':
                return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'DELIVERED':
            case 'PROFIT_CREDITED':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'NDR':
                return 'bg-amber-100 text-amber-800 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
            case 'RTO':
            case 'CANCELLED':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="w-full">
            {/* Command Bar */}
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-black text-slate-900">Order Fulfillment</h2>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500">
                        <Search size={16} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ml-2 w-48 border-none text-xs font-bold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500">
                        <Filter size={16} className="mr-2 text-slate-400" />
                        <select
                            value={filterOption}
                            onChange={(e) => setFilterOption(e.target.value)}
                            className="cursor-pointer border-none bg-transparent text-xs font-bold text-slate-700 outline-none"
                        >
                            <option value="ALL">All Orders</option>
                            <option value="PENDING">Pending (New)</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="NDR">NDR (Action Req)</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* High Density Orders Table */}
            <div className="relative mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900"></div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                                <th className="px-4 py-3">Order Details</th>
                                <th className="px-4 py-3">Reseller</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3 text-right">Financials</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400">
                                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                                        <span className="font-bold">No orders found.</span>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const isDropship = !!order.endCustomerDetails;
                                    const isCompleted = [
                                        'SHIPPED',
                                        'DELIVERED',
                                        'CANCELLED',
                                        'PROFIT_CREDITED',
                                    ].includes(order.status);

                                    return (
                                        <tr
                                            key={order._id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-mono text-xs font-black text-slate-900">
                                                    {order.orderId}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400">
                                                    {new Date(order.createdAt).toLocaleDateString(
                                                        'en-IN',
                                                        {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        }
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="text-xs font-extrabold text-slate-900">
                                                    {order.resellerId?.companyName ||
                                                        'Unknown Company'}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500">
                                                    {order.resellerId?.name || 'N/A'}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                {isDropship ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black tracking-widest text-amber-800 uppercase">
                                                            <Package size={10} /> Dropship
                                                        </span>
                                                        <div
                                                            className="mt-1 max-w-[120px] truncate text-[10px] font-bold text-slate-600"
                                                            title={order.endCustomerDetails.name}
                                                        >
                                                            To: {order.endCustomerDetails.name}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black tracking-widest text-indigo-800 uppercase">
                                                        <ShoppingCart size={10} /> Wholesale
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="text-xs font-black text-slate-900">
                                                    ₹
                                                    {order.totalPlatformCost.toLocaleString(
                                                        'en-IN'
                                                    )}
                                                </div>
                                                {isDropship && order.paymentMethod === 'COD' ? (
                                                    <div className="text-[9px] font-extrabold text-amber-600">
                                                        COD: ₹
                                                        {order.amountToCollect.toLocaleString(
                                                            'en-IN'
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-[9px] font-extrabold text-slate-400 uppercase">
                                                        Prepaid
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-extrabold tracking-widest uppercase ${getStatusStyle(order.status)}`}
                                                >
                                                    {order.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setEditForm({
                                                            status: order.status,
                                                            courierName:
                                                                order.tracking?.courierName || '',
                                                            awbNumber:
                                                                order.tracking?.awbNumber || '',
                                                            ndrReason:
                                                                order.ndrDetails?.reason || '',
                                                        });
                                                    }}
                                                    className={`rounded px-3 py-1.5 text-[10px] font-extrabold transition-colors ${
                                                        isCompleted
                                                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {isCompleted ? 'VIEW' : 'PROCESS'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30"
                >
                    <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                    Page <span className="text-slate-900">{page}</span> of{' '}
                    <span className="text-slate-900">{totalPages || 1}</span>
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30"
                >
                    Next <ChevronRight size={14} />
                </button>
            </div>

            {/* Solid Fast-Slide Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 z-40 bg-slate-900/40" // Removed blur for performance
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.2 }} // Swapped spring for faster tween
                            className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
                                        <Truck size={18} /> Dispatch Center
                                    </h3>
                                    <p className="mt-0.5 font-mono text-xs font-bold text-slate-500">
                                        {selectedOrder.orderId}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="rounded-full bg-slate-200/50 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto p-6">
                                {/* Financials & Routing */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                            Platform Cost
                                        </p>
                                        <p className="text-lg font-black text-slate-900">
                                            ₹{selectedOrder.totalPlatformCost}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400">
                                            Pre-deducted
                                        </p>
                                    </div>

                                    {!!selectedOrder.endCustomerDetails ? (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                            <p className="text-[9px] font-bold tracking-wider text-amber-600 uppercase">
                                                COD Collect
                                            </p>
                                            <p className="text-lg font-black text-amber-900">
                                                ₹{selectedOrder.amountToCollect}
                                            </p>
                                            <p className="text-[9px] font-bold text-amber-700">
                                                Must collect on delivery
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                                            <p className="text-[9px] font-bold tracking-wider text-indigo-600 uppercase">
                                                Routing
                                            </p>
                                            <p className="text-lg font-black text-indigo-900">
                                                Wholesale
                                            </p>
                                            <p className="text-[9px] font-bold text-indigo-700">
                                                Ship to Reseller Address
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Destination */}
                                <div>
                                    <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                                        <MapPin size={12} /> Destination Address
                                    </h4>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-700">
                                        {!!selectedOrder.endCustomerDetails ? (
                                            <>
                                                <p className="text-sm font-black text-slate-900">
                                                    {selectedOrder.endCustomerDetails.name}
                                                </p>
                                                <p className="text-slate-500">
                                                    {selectedOrder.endCustomerDetails.phone}
                                                </p>
                                                <p className="mt-1">
                                                    {
                                                        selectedOrder.endCustomerDetails.address
                                                            .street
                                                    }
                                                </p>
                                                <p>
                                                    {selectedOrder.endCustomerDetails.address.city},{' '}
                                                    {selectedOrder.endCustomerDetails.address.state}{' '}
                                                    {selectedOrder.endCustomerDetails.address.zip}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-amber-600">
                                                Ship directly to the Reseller's registered KYC
                                                address ({selectedOrder.resellerId?.companyName}).
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Form */}
                                <div className="border-t border-slate-200 pt-5">
                                    <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                                        <Package size={12} /> Status & Tracking Update
                                    </h4>

                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                                Update Status
                                            </label>
                                            <select
                                                value={editForm.status}
                                                onChange={(e) =>
                                                    setEditForm({
                                                        ...editForm,
                                                        status: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                                            >
                                                <option value="PENDING">Pending (New)</option>
                                                <option value="PROCESSING">
                                                    Processing (Packing)
                                                </option>
                                                <option value="SHIPPED">
                                                    Shipped (In Transit)
                                                </option>
                                                <option value="NDR">
                                                    NDR (Failed Delivery Attempt)
                                                </option>
                                                <option value="DELIVERED">
                                                    Delivered (Releases Profit)
                                                </option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                            {editForm.status === 'DELIVERED' && (
                                                <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                                    <TrendingUp size={10} /> Warning: Will instantly
                                                    credit ₹{selectedOrder.resellerProfitMargin} to
                                                    reseller wallet.
                                                </p>
                                            )}
                                        </div>

                                        {(editForm.status === 'SHIPPED' ||
                                            editForm.status === 'DELIVERED' ||
                                            editForm.status === 'NDR') && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                                        Courier Partner
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Delhivery"
                                                        value={editForm.courierName}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                courierName: e.target.value,
                                                            })
                                                        }
                                                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-600"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                                        AWB Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. AWB123456"
                                                        value={editForm.awbNumber}
                                                        onChange={(e) =>
                                                            setEditForm({
                                                                ...editForm,
                                                                awbNumber: e.target.value,
                                                            })
                                                        }
                                                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-600"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {editForm.status === 'NDR' && (
                                            <div>
                                                <label className="mb-1 flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase">
                                                    <AlertOctagon size={10} /> NDR Reason
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Address not found"
                                                    value={editForm.ndrReason || ''}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            ndrReason: e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs font-bold text-amber-900 outline-none focus:border-amber-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="flex gap-3 border-t border-slate-200 bg-white p-4">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="flex-1 rounded-lg border border-slate-300 bg-white py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={isSaving}
                                    onClick={() => submitOrderUpdate(selectedOrder._id)}
                                    className="flex-1 rounded-lg bg-slate-900 py-3 text-xs font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {isSaving ? 'Processing...' : 'Save Update'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrders;
