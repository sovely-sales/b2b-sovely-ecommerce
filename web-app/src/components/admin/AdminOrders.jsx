import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
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
    ShoppingCart,
    Download,
    Calendar,
    ShieldCheck,
    RefreshCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';

const FINAL_VIEW_ONLY_STATUSES = new Set([
    'DELIVERED',
    'CANCELLED',
    'PROFIT_CREDITED',
    'RTO_DELIVERED',
]);

const DEFAULT_MANUAL_OVERRIDE_STATUSES = [
    'PROCESSING',
    'SHIPPED',
    'NDR',
    'RTO',
    'RTO_DELIVERED',
    'DELIVERED',
    'CANCELLED',
];

const MANUAL_OVERRIDE_LABELS = {
    PROCESSING: 'Processing (Packing)',
    SHIPPED: 'Shipped (In Transit)',
    NDR: 'NDR (Failed Delivery Attempt)',
    RTO: 'RTO (In Transit to Origin)',
    RTO_DELIVERED: 'RTO Delivered (Apply Settlement)',
    DELIVERED: 'Delivered (Releases Profit)',
    CANCELLED: 'Cancelled',
};

const getManualOverrideStatuses = (currentStatus) =>
    currentStatus === 'SHIPPED' ? ['RTO', 'DELIVERED'] : DEFAULT_MANUAL_OVERRIDE_STATUSES;

const WUKUSY_STATUS_MAP = {
    shipped: 'SHIPPED',
    confirmed: 'PROCESSING',
    'cancelled-new': 'CANCELLED',
    cancelled: 'CANCELLED',
    pending: 'PENDING',
    delivered: 'DELIVERED',
};

function cleanField(val = '') {
    return val
        .replace(/^"+|"+$/g, '')
        .replace(/^=/, '')
        .trim();
}

function parseCSVText(text) {
    const rows = [];
    let row = [],
        field = '',
        i = 0,
        insideQuotes = false;
    while (i < text.length) {
        const char = text[i];
        if (insideQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }
                insideQuotes = false;
                i++;
                continue;
            }
            field += char;
            i++;
            continue;
        }
        if (char === '"') {
            insideQuotes = true;
            i++;
            continue;
        }
        if (char === ',') {
            row.push(field);
            field = '';
            i++;
            continue;
        }
        if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            i++;
            continue;
        }
        if (char === '\r') {
            i++;
            continue;
        }
        field += char;
        i++;
    }
    row.push(field);
    rows.push(row);
    return rows;
}

function parseCsvToOrders(csvText) {
    const rows = parseCSVText(csvText);
    const headerIndex = rows.findIndex((row) =>
        row.some((col) => cleanField(col) === 'Wukusy Order No')
    );
    if (headerIndex === -1) return null;

    const header = rows[headerIndex].map(cleanField);
    const dataRows = rows.slice(headerIndex + 1).filter((r) => r.some((c) => c.trim()));
    const col = (row, name) => cleanField(row[header.indexOf(name)] ?? '');

    return dataRows.map((row) => {
        const rawStatus = col(row, 'Status').toLowerCase();
        const courier = col(row, 'Courier');
        const tracking = col(row, 'Tracking');
        return {
            wukusyOrderNo: col(row, 'Wukusy Order No'),
            platformOrderNo: col(row, 'Platform Order No'),
            orderDate: col(row, 'Order Date'),
            customerName: col(row, 'Customer Name'),
            phone: col(row, 'Phone'),
            city: col(row, 'city'),
            state: col(row, 'State'),
            sku: col(row, 'SKU'),
            quantity: col(row, 'Quantity'),
            sellingPrice: col(row, 'Sellling Price'),
            orderProfit: col(row, 'Order Profit'),
            paymentStatus: col(row, 'Payment Status'),
            rawStatus: col(row, 'Status'),
            mappedStatus: WUKUSY_STATUS_MAP[rawStatus] || 'PROCESSING',
            courier,
            tracking,
            hasShipment: !!(courier || tracking),
        };
    });
}

const AdminOrders = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(() => {
        const p = Number(searchParams.get('page'));
        return p > 0 ? p : 1;
    });
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const [filterOption, setFilterOption] = useState(() => searchParams.get('status') || 'ALL');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const searchInputRef = useRef(null);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewMode, setViewMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Standard Export Modal States
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const [parsedOrders, setParsedOrders] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [csvFileName, setCsvFileName] = useState('');

    // Wukusy Sync States
    const [isUploadingCsv, setIsUploadingCsv] = useState(false);
    const [ewayBillNumber, setEwayBillNumber] = useState('');
    const manualOverrideStatuses = selectedOrder
        ? getManualOverrideStatuses(selectedOrder.status)
        : DEFAULT_MANUAL_OVERRIDE_STATUSES;

    useEffect(() => {
        const nextParams = new URLSearchParams();
        if (debouncedSearch.trim()) nextParams.set('search', debouncedSearch.trim());
        if (filterOption !== 'ALL') nextParams.set('status', filterOption);
        if (page > 1) nextParams.set('page', page);

        setSearchParams(nextParams, { replace: true });
    }, [debouncedSearch, filterOption, page, setSearchParams]);

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const activeTag = document.activeElement?.tagName;
            if (
                activeTag === 'INPUT' ||
                activeTag === 'TEXTAREA' ||
                document.activeElement?.isContentEditable
            ) {
                return;
            }
            if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) {
                return;
            }
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, filterOption, startDate, endDate]);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const res = await api.get('/orders/all', {
                    params: {
                        page,
                        limit: 20,
                        search: debouncedSearch,
                        status: filterOption === 'ALL' ? '' : filterOption,
                        startDate,
                        endDate,
                    },
                });

                const extractedOrders =
                    res.data?.data?.orders || res.data?.data?.data || res.data?.data || [];
                setOrders(Array.isArray(extractedOrders) ? extractedOrders : []);
                setTotalPages(
                    res.data?.data?.pagination?.pages || res.data?.data?.pagination?.totalPages || 1
                );
            } catch (err) {
                console.error('Failed to fetch admin orders:', err);
                toast.error('Failed to load orders. Check your connection.');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [page, debouncedSearch, filterOption, startDate, endDate]);

    // ==========================================
    // ACTIONS
    // ==========================================

    const submitOrderUpdate = async (id) => {
        if (!editForm.status) {
            toast.error('Please select a valid status before saving.');
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                status: editForm.status,
                courierName: editForm.courierName,
                awbNumber: editForm.awbNumber,
                platformOrderNo: editForm.platformOrderNo,
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

    const handleAuthorize = async (orderId) => {
        setIsSaving(true);
        try {
            const res = await api.put(`/orders/${orderId}/authorize`, { ewayBillNumber });
            setOrders((prev) => prev.map((o) => (o._id === orderId ? res.data.data : o)));
            toast.success('Order authorized successfully!');
            setSelectedOrder(res.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to authorize order');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportWukusy = async () => {
        setIsExporting(true);
        try {
            const res = await api.get('/orders/export-wukusy', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `wukusy_untracked_orders_${new Date().toISOString().split('T')[0]}.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Untracked orders downloaded!');
        } catch (err) {
            toast.error('Failed to export untracked orders.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportWukusy = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        event.target.value = '';

        setCsvFileName(file.name);
        setSyncResult(null);

        const reader = new FileReader();
        reader.onload = () => {
            const orders = parseCsvToOrders(reader.result);
            if (!orders) {
                toast.error("Couldn't find 'Wukusy Order No' column.");
                return;
            }
            setParsedOrders(orders);
            toast.success(`${orders.length} orders loaded — review and confirm sync below`);
        };
        reader.readAsText(file);
    };

    const handleExportOrders = async () => {
        if (!exportStartDate || !exportEndDate) {
            toast.error('Please select both start and end dates');
            return;
        }
        if (new Date(exportStartDate) > new Date(exportEndDate)) {
            toast.error('Start date cannot be after end date');
            return;
        }

        setIsExporting(true);
        try {
            const res = await api.get('/orders/export', {
                params: { startDate: exportStartDate, endDate: exportEndDate },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `orders_export_${exportStartDate}_to_${exportEndDate}.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Export downloaded successfully!');
            setIsExportModalOpen(false);
        } catch (err) {
            toast.error('Failed to export orders. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleConfirmSync = async () => {
        if (!parsedOrders.length) return;
        setIsUploadingCsv(true);
        const uploadToast = toast.loading('Syncing statuses with Wukusy...');

        const csvLines = [
            'Wukusy Order No,Platform Order No,Order Date,Customer Name,Phone,city,State,SKU,Quantity,Sellling Price,Order Profit,Payment Status,Status,Courier,Tracking',
            ...parsedOrders.map((o) =>
                [
                    o.wukusyOrderNo,
                    o.platformOrderNo,
                    o.orderDate,
                    o.customerName,
                    o.phone,
                    o.city,
                    o.state,
                    o.sku,
                    o.quantity,
                    o.sellingPrice,
                    o.orderProfit,
                    o.paymentStatus,
                    o.rawStatus,
                    o.courier,
                    o.tracking,
                ]
                    .map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`)
                    .join(',')
            ),
        ].join('\n');

        const formData = new FormData();
        formData.append(
            'file',
            new Blob([csvLines], { type: 'text/csv' }),
            csvFileName || 'sync.csv'
        );

        try {
            const res = await api.post('/orders/import-wukusy', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(res.data.message, { id: uploadToast });
            setSyncResult(res.data.result || { updated: parsedOrders.length, skipped: 0 });
            setParsedOrders([]);
            setPage(1);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to sync CSV', { id: uploadToast });
        } finally {
            setIsUploadingCsv(false);
        }
    };

    const handleExportCourierOrders = async () => {
        if (!exportStartDate || !exportEndDate) {
            toast.error('Please select both start and end dates');
            return;
        }
        setIsExporting(true);
        try {
            const res = await api.get('/orders/export-courier', {
                params: { startDate: exportStartDate, endDate: exportEndDate },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `courier_orders_export_${exportStartDate}_to_${exportEndDate}.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Courier orders downloaded successfully!');
            setIsExportModalOpen(false);
        } catch (err) {
            toast.error('Failed to export courier orders. Please try again.');
        } finally {
            setIsExporting(false);
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
            case 'RTO_DELIVERED':
            case 'CANCELLED':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="w-full">
            {}
            <div className="mb-6 space-y-4">
                {}
                <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm md:flex-row">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-black text-indigo-900">
                            <RefreshCcw size={16} className="text-indigo-600" />
                            Warehouse Sync Pipeline (Sovely server)
                        </h2>
                        <p className="mt-1 text-xs font-bold text-indigo-700/70">
                            Export new processing orders and sync back shipping/cancellation
                            statuses.
                        </p>
                    </div>
                    <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
                        <button
                            onClick={handleExportWukusy}
                            disabled={isExporting}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-xs font-extrabold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 disabled:opacity-50 md:w-auto"
                        >
                            <Package size={16} /> Export Untracked Orders
                        </button>
                        <label
                            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-indigo-700 md:w-auto ${isUploadingCsv ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            <TrendingUp size={16} />{' '}
                            {isUploadingCsv ? 'Syncing...' : 'Load Sovely CSV'}
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleImportWukusy}
                                disabled={isUploadingCsv}
                            />
                        </label>
                    </div>
                </div>

                {}
                <AnimatePresence>
                    {parsedOrders.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                        >
                            {}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                                <div>
                                    <p className="text-sm font-black text-slate-900">
                                        CSV Preview — {csvFileName}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400">
                                        {parsedOrders.length} orders ready to sync
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setParsedOrders([]);
                                            setSyncResult(null);
                                        }}
                                        className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700"
                                    >
                                        <X size={14} /> Discard
                                    </button>
                                    <button
                                        onClick={handleConfirmSync}
                                        disabled={isUploadingCsv}
                                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <RefreshCcw
                                            size={14}
                                            className={isUploadingCsv ? 'animate-spin' : ''}
                                        />
                                        {isUploadingCsv
                                            ? 'Syncing...'
                                            : `Confirm Sync (${parsedOrders.length})`}
                                    </button>
                                </div>
                            </div>

                            {/* Sync result */}
                            {syncResult && (
                                <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-5 py-2.5 text-xs font-bold text-emerald-800">
                                    <CheckCircle size={14} className="text-emerald-600" />
                                    Sync complete — <strong>{syncResult.updated}</strong> updated
                                    {syncResult.skipped > 0 && (
                                        <>
                                            , <strong>{syncResult.skipped}</strong> skipped
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Preview table */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                                            <th className="px-4 py-2.5">Order No</th>
                                            <th className="px-4 py-2.5">Customer</th>
                                            <th className="px-4 py-2.5">SKU</th>
                                            <th className="px-4 py-2.5">Courier</th>
                                            <th className="px-4 py-2.5">Tracking</th>
                                            <th className="px-4 py-2.5">Wukusy Status</th>
                                            <th className="px-4 py-2.5">Maps To</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {parsedOrders.map((order, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5 font-mono text-xs font-black text-slate-900">
                                                    #{order.wukusyOrderNo}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="text-xs font-bold text-slate-800">
                                                        {order.customerName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {order.city}, {order.state}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-[10px] font-bold text-slate-500">
                                                    {order.sku}
                                                </td>
                                                <td className="px-4 py-2.5 text-xs font-bold text-indigo-700">
                                                    {order.courier || (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 font-mono text-[10px] font-bold text-slate-600">
                                                    {order.tracking || (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-[10px] font-bold text-slate-500">
                                                    {order.rawStatus}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-extrabold tracking-widest uppercase ${getStatusStyle(order.mappedStatus)}`}
                                                    >
                                                        {order.mappedStatus.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-7">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 md:col-span-2 lg:col-span-2">
                    <Search size={18} className="text-slate-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search Order ID, End Customer, AWB, Company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-3 w-full border-none text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 lg:col-span-2">
                    <Filter size={18} className="mr-2 shrink-0 text-slate-400" />
                    <select
                        value={filterOption}
                        onChange={(e) => setFilterOption(e.target.value)}
                        className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                    >
                        <option value="ALL">All Orders</option>
                        <option value="PENDING">Pending (New)</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="NDR">NDR (Action Req)</option>
                        <option value="RTO">RTO In Transit</option>
                        <option value="RTO_DELIVERED">RTO Delivered</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
                <div className="flex min-w-0 items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <Calendar size={16} className="mr-2 shrink-0 text-slate-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full min-w-0 cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                        title="Start Date"
                    />
                </div>
                <div className="flex min-w-0 items-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <Calendar size={16} className="mr-2 shrink-0 text-slate-400" />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full min-w-0 cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                        title="End Date"
                    />
                </div>
                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-slate-800"
                >
                    <Download size={18} /> Export
                </button>
            </div>

            {}
            <div className="relative mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                    </div>
                )}

                <div className="min-h-[300px] overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
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
                                        <Package size={40} className="mx-auto mb-3 opacity-20" />
                                        <span className="font-bold">
                                            No orders found matching your filters.
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const isDropship = !!order.endCustomerDetails;
                                    const isCompleted = FINAL_VIEW_ONLY_STATUSES.has(order.status);

                                    return (
                                        <tr
                                            key={order._id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-mono text-xs font-black text-slate-900">
                                                    {order.orderId}
                                                </div>

                                                {/* Newly Added Platform Order No */}
                                                {order.platformOrderNo && (
                                                    <div
                                                        className="mt-0.5 line-clamp-1 font-mono text-[10px] font-bold text-indigo-600"
                                                        title={order.platformOrderNo}
                                                    >
                                                        <span className="text-slate-400">
                                                            Platform ID:
                                                        </span>{' '}
                                                        {order.platformOrderNo}
                                                    </div>
                                                )}

                                                <div className="mt-1 text-[10px] font-bold text-slate-400">
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
                                                <div className="line-clamp-1 text-xs font-extrabold text-slate-900">
                                                    {order.resellerId?.companyName ||
                                                        'Unknown Company'}
                                                </div>
                                                <div className="line-clamp-1 text-[10px] font-bold text-slate-500">
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
                                                        const availableStatuses =
                                                            getManualOverrideStatuses(order.status);

                                                        setSelectedOrder(order);
                                                        setViewMode(isCompleted);
                                                        setEwayBillNumber(
                                                            order.ewayBillNumber || ''
                                                        );
                                                        setEditForm({
                                                            status: availableStatuses.includes(
                                                                order.status
                                                            )
                                                                ? order.status
                                                                : '',
                                                            courierName:
                                                                order.tracking?.courierName || '',
                                                            awbNumber:
                                                                order.tracking?.awbNumber || '',
                                                            platformOrderNo:
                                                                order.platformOrderNo || '',
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
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                    <ChevronLeft size={16} /> Prev
                </button>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    Page
                    <input
                        type="number"
                        min={1}
                        max={totalPages || 1}
                        value={page}
                        onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : 1;
                            setPage(Math.min(totalPages || 1, Math.max(1, val)));
                        }}
                        className="w-14 [appearance:textfield] rounded-lg border border-slate-200 bg-white py-1 text-center text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    of <span className="text-slate-900">{totalPages || 1}</span>
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>

            {/* View/Process Modal */}
            {createPortal(
                <AnimatePresence>
                    {selectedOrder && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedOrder(null)}
                                className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'tween', duration: 0.2 }}
                                className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                            >
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
                                            <Truck size={18} /> Dispatch Center
                                        </h3>
                                        <div className="mt-0.5 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                            <p className="font-mono text-xs font-bold text-slate-900">
                                                {selectedOrder.orderId}
                                            </p>
                                            {selectedOrder.platformOrderNo && (
                                                <>
                                                    <span className="hidden text-slate-300 sm:inline">
                                                        •
                                                    </span>
                                                    <p className="font-mono text-[10px] font-bold text-indigo-600">
                                                        Platform: {selectedOrder.platformOrderNo}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="rounded-full bg-slate-200/50 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto p-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                Platform Cost
                                            </p>
                                            <p className="text-lg font-black text-slate-900">
                                                ₹
                                                {selectedOrder.totalPlatformCost?.toLocaleString(
                                                    'en-IN'
                                                )}
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
                                                    ₹
                                                    {selectedOrder.amountToCollect?.toLocaleString(
                                                        'en-IN'
                                                    )}
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
                                                    Ship to Reseller
                                                </p>
                                            </div>
                                        )}
                                    </div>

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
                                                        {
                                                            selectedOrder.endCustomerDetails.address
                                                                .city
                                                        }
                                                        ,{' '}
                                                        {
                                                            selectedOrder.endCustomerDetails.address
                                                                .state
                                                        }{' '}
                                                        {
                                                            selectedOrder.endCustomerDetails.address
                                                                .zip
                                                        }
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-amber-600">
                                                    Ship directly to the Reseller's registered KYC
                                                    address ({selectedOrder.resellerId?.companyName}
                                                    ).
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {viewMode && (
                                        <>
                                            {selectedOrder.items?.length > 0 && (
                                                <div>
                                                    <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                                                        <Package size={12} /> Items (
                                                        {selectedOrder.items.length})
                                                    </h4>
                                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                        {selectedOrder.items.map((item, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center gap-3 p-3"
                                                            >
                                                                {item.image ? (
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.title}
                                                                        className="h-10 w-10 flex-shrink-0 rounded-lg border border-slate-200 object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                                                                        <Package
                                                                            size={14}
                                                                            className="text-slate-400"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-xs font-bold text-slate-900">
                                                                        {item.title}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-slate-400">
                                                                        SKU: {item.sku}{' '}
                                                                        &nbsp;·&nbsp; Qty:{' '}
                                                                        {item.qty}
                                                                    </p>
                                                                </div>
                                                                <p className="shrink-0 text-xs font-black text-slate-700">
                                                                    ₹
                                                                    {item.platformBasePrice?.toLocaleString(
                                                                        'en-IN'
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedOrder.statusHistory?.length > 0 && (
                                                <div>
                                                    <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                                                        <TrendingUp size={12} /> Tracking Timeline
                                                    </h4>
                                                    <div className="relative space-y-4 border-l-2 border-slate-100 pl-5">
                                                        {[...selectedOrder.statusHistory]
                                                            .reverse()
                                                            .map((h, i) => (
                                                                <div key={i} className="relative">
                                                                    <div
                                                                        className={`absolute -left-[23px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[8px] font-black text-white shadow-sm ${h.status === 'DELIVERED' || h.status === 'PROFIT_CREDITED' ? 'bg-emerald-500' : h.status === 'SHIPPED' ? 'bg-indigo-500' : h.status === 'NDR' ? 'bg-amber-500' : h.status === 'CANCELLED' || h.status === 'RTO' || h.status === 'RTO_DELIVERED' ? 'bg-red-500' : 'bg-slate-400'}`}
                                                                    >
                                                                        ●
                                                                    </div>
                                                                    <p className="text-[10px] font-extrabold tracking-wider text-slate-800 uppercase">
                                                                        {h.status.replace(
                                                                            /_/g,
                                                                            ' '
                                                                        )}
                                                                    </p>
                                                                    {h.comment && (
                                                                        <p className="mt-0.5 text-[10px] text-slate-500">
                                                                            {h.comment}
                                                                        </p>
                                                                    )}
                                                                    <p className="mt-0.5 text-[9px] font-bold text-slate-400">
                                                                        {new Date(
                                                                            h.date
                                                                        ).toLocaleString('en-IN')}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {!viewMode && (
                                        <div className="border-t border-slate-200 pt-5">
                                            <h4 className="mb-3 flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                                                <Package size={12} /> Fulfillment Action
                                            </h4>

                                            {selectedOrder.status === 'PENDING' ? (
                                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <ShieldCheck
                                                            size={18}
                                                            className="text-blue-700"
                                                        />
                                                        <h5 className="font-extrabold text-blue-900">
                                                            Authorize Order
                                                        </h5>
                                                    </div>

                                                    {selectedOrder.totalPlatformCost >= 50000 &&
                                                        !selectedOrder.endCustomerDetails && (
                                                            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-100 p-3 text-xs font-bold text-amber-900 shadow-sm">
                                                                <span className="mb-1 flex items-center gap-1.5 font-black text-amber-700 uppercase">
                                                                    <AlertOctagon size={14} />{' '}
                                                                    Action Required
                                                                </span>
                                                                This B2B order exceeds ₹50,000. An
                                                                E-Way Bill is strictly required to
                                                                avoid border penalties.
                                                            </div>
                                                        )}

                                                    <div className="mb-4">
                                                        <label className="mb-1.5 block text-[10px] font-extrabold tracking-widest text-blue-800 uppercase">
                                                            E-Way Bill Number (If Applicable)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            maxLength={12}
                                                            placeholder="e.g. 123456789012"
                                                            value={ewayBillNumber}
                                                            onChange={(e) =>
                                                                setEwayBillNumber(
                                                                    e.target.value.replace(
                                                                        /\D/g,
                                                                        ''
                                                                    )
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-blue-200 p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            handleAuthorize(selectedOrder._id)
                                                        }
                                                        disabled={
                                                            isSaving ||
                                                            (selectedOrder.totalPlatformCost >=
                                                                50000 &&
                                                                !selectedOrder.endCustomerDetails &&
                                                                ewayBillNumber.length < 12)
                                                        }
                                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {isSaving
                                                            ? 'Processing...'
                                                            : 'Authorize & Move to Packing'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    {selectedOrder.status === 'PROCESSING' && (
                                                        <div className="rounded-lg bg-indigo-50 p-3 text-xs font-bold text-indigo-800">
                                                            This order is approved. It will
                                                            automatically update to{' '}
                                                            <strong>Shipped</strong> when you upload
                                                            the Wukusy sync CSV. You can also
                                                            manually override the status below.
                                                        </div>
                                                    )}
                                                    {selectedOrder.status === 'SHIPPED' && (
                                                        <div className="rounded-lg bg-indigo-50 p-3 text-xs font-bold text-indigo-800">
                                                            This order is already shipped. Next
                                                            status can only be <strong>RTO</strong>{' '}
                                                            or <strong>Delivered</strong>.
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                                            Manual Override Status
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
                                                            {selectedOrder.status === 'SHIPPED' && (
                                                                <option value="" disabled>
                                                                    Select next status
                                                                </option>
                                                            )}
                                                            {manualOverrideStatuses.map(
                                                                (statusCode) => (
                                                                    <option
                                                                        key={statusCode}
                                                                        value={statusCode}
                                                                    >
                                                                        {MANUAL_OVERRIDE_LABELS[
                                                                            statusCode
                                                                        ] ||
                                                                            statusCode.replace(
                                                                                /_/g,
                                                                                ' '
                                                                            )}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </div>

                                                    {/* Manual Logistics Details */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                                                Courier Partner
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Delhivery"
                                                                value={editForm.courierName || ''}
                                                                onChange={(e) =>
                                                                    setEditForm({
                                                                        ...editForm,
                                                                        courierName: e.target.value,
                                                                    })
                                                                }
                                                                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                                                Tracking ID (AWB)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. 1421...312"
                                                                value={editForm.awbNumber || ''}
                                                                onChange={(e) =>
                                                                    setEditForm({
                                                                        ...editForm,
                                                                        awbNumber: e.target.value,
                                                                    })
                                                                }
                                                                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                                                            Platform Order ID (Optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. AMZ-12345"
                                                            value={editForm.platformOrderNo || ''}
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    platformOrderNo: e.target.value,
                                                                })
                                                            }
                                                            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                                                        />
                                                    </div>

                                                    {editForm.status === 'NDR' && (
                                                        <div>
                                                            <label className="mb-1 flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase">
                                                                <AlertOctagon size={10} /> NDR
                                                                Reason
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
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 border-t border-slate-200 bg-white p-4">
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="flex-1 rounded-lg border border-slate-300 bg-white py-3 text-xs font-extrabold text-slate-600 transition-colors hover:bg-slate-50"
                                    >
                                        {viewMode ? 'Close' : 'Cancel'}
                                    </button>
                                    {!viewMode && selectedOrder.status !== 'PENDING' && (
                                        <button
                                            disabled={isSaving || !editForm.status}
                                            onClick={() => submitOrderUpdate(selectedOrder._id)}
                                            className="flex-1 rounded-lg bg-slate-900 py-3 text-xs font-extrabold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            {isSaving ? 'Processing...' : 'Save Manual Update'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}

                    {}
                    {isExportModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsExportModalOpen(false)}
                                className="fixed inset-0 z-40 bg-slate-900/40"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                                    <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-slate-800 uppercase">
                                        <Calendar size={16} className="text-indigo-600" /> Export
                                        Orders
                                    </h3>
                                    <button
                                        onClick={() => setIsExportModalOpen(false)}
                                        className="rounded-full bg-slate-200/50 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-4 p-6">
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={exportStartDate}
                                            onChange={(e) => setExportStartDate(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={exportEndDate}
                                            onChange={(e) => setExportEndDate(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                                    <button
                                        onClick={handleExportOrders}
                                        disabled={isExporting}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-600 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                                    >
                                        {isExporting ? 'Downloading...' : 'Download Standard CSV'}
                                    </button>
                                    <button
                                        onClick={handleExportCourierOrders}
                                        disabled={isExporting}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-xs font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isExporting ? 'Downloading...' : 'Download Courier Order'}
                                    </button>
                                    <button
                                        onClick={() => setIsExportModalOpen(false)}
                                        className="w-full rounded-lg border border-slate-300 bg-white py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default AdminOrders;
