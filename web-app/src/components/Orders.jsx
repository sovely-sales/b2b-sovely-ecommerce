import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Package,
    Truck,
    CheckCircle2,
    ArrowLeft,
    AlertCircle,
    Search,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    MapPin,
    AlertOctagon,
    Wallet,
    Clock,
    CreditCard,
    Box,
    Receipt,
    Scale,
    FileText,
} from 'lucide-react';
import api from '../utils/api.js';
import { useDebounce } from '../hooks/useDebounce.js';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;
const VALID_STATUS_FILTERS = new Set([
    'ALL',
    'PENDING_PROCESSING',
    'SHIPPED',
    'NDR',
    'DELIVERED',
    'PROFIT_CREDITED',
    'RTO',
    'CANCELLED',
]);

const getInitialStatusFilter = (searchParams) => {
    const statusParam = (searchParams.get('status') || '').toUpperCase();
    if (VALID_STATUS_FILTERS.has(statusParam)) return statusParam;
    const legacyFilterParam = (searchParams.get('filter') || '').toUpperCase();
    if (legacyFilterParam === 'NDR') return 'NDR';
    return 'ALL';
};

const Orders = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(() => getInitialStatusFilter(searchParams));
    const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
    const [sortOrder, setSortOrder] = useState(() => searchParams.get('sort') || 'latest');
    const [page, setPage] = useState(() => {
        const pageFromUrl = Number(searchParams.get('page'));
        return Number.isInteger(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const debouncedSearchTerm = useDebounce(searchTerm, 350);

    const [ndrForms, setNdrForms] = useState({});
    const [submittingNdr, setSubmittingNdr] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const params = { page, limit: PAGE_SIZE, sort: sortOrder };
                if (filter !== 'ALL') params.status = filter;
                if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();

                const res = await api.get('/orders', { params });

                const apiOrders = Array.isArray(res.data?.data?.orders)
                    ? res.data.data.orders.map((ord) => {
                          let computedMargin = ord.resellerProfitMargin || 0;
                          if (
                              computedMargin === 0 &&
                              ord.endCustomerDetails &&
                              ord.items?.length > 0
                          ) {
                              const totalSelling = ord.items.reduce(
                                  (sum, item) => sum + (item.resellerSellingPrice || 0) * item.qty,
                                  0
                              );
                              if (totalSelling > 0)
                                  computedMargin = totalSelling - ord.totalPlatformCost;
                          }
                          return { ...ord, computedMargin };
                      })
                    : [];

                const pagination = res.data?.data?.pagination || {};
                const serverTotalPages = Math.max(1, Number(pagination.pages) || 1);

                if (page > serverTotalPages) {
                    setPage(serverTotalPages);
                    return;
                }

                setOrders(apiOrders);
                setTotalPages(serverTotalPages);
                setTotalCount(Number(pagination.total) || 0);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [navigate, page, filter, debouncedSearchTerm, sortOrder, refreshTrigger]);

    useEffect(() => {
        const next = new URLSearchParams();
        if (filter !== 'ALL') next.set('status', filter);
        if (searchTerm.trim()) next.set('search', searchTerm.trim());
        if (sortOrder !== 'latest') next.set('sort', sortOrder);
        if (page > 1) next.set('page', String(page));
        setSearchParams(next, { replace: true });
    }, [filter, page, searchTerm, setSearchParams, sortOrder]);

    useEffect(() => {
        const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);
        window.addEventListener('refreshHubData', handleRefresh);
        return () => window.removeEventListener('refreshHubData', handleRefresh);
    }, []);

    const pendingProfit = orders
        .filter(
            (ord) =>
                ['PENDING', 'PROCESSING', 'SHIPPED', 'NDR', 'DELIVERED'].includes(ord.status) &&
                ord.paymentMethod === 'COD'
        )
        .reduce((sum, ord) => sum + (ord.computedMargin || 0), 0);

    const ndrOrders = orders.filter((ord) => ord.status === 'NDR');
    const ndrCount = ndrOrders.length;

    const toggleExpand = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) newExpanded.delete(orderId);
        else newExpanded.add(orderId);
        setExpandedOrders(newExpanded);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING':
                return {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    border: 'border-amber-200',
                    icon: Clock,
                    timeline: 'bg-amber-400',
                    display: 'AWAITING APPROVAL',
                };
            case 'PROCESSING':
                return {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    icon: Package,
                    timeline: 'bg-blue-500',
                    display: 'PROCESSING',
                };
            case 'SHIPPED':
                return {
                    bg: 'bg-indigo-50',
                    text: 'text-indigo-700',
                    border: 'border-indigo-200',
                    icon: Truck,
                    timeline: 'bg-indigo-500',
                };
            case 'DELIVERED':
                return {
                    bg: 'bg-teal-50',
                    text: 'text-teal-700',
                    border: 'border-teal-200',
                    icon: Package,
                    timeline: 'bg-teal-500',
                };
            case 'PROFIT_CREDITED':
                return {
                    bg: 'bg-emerald-500',
                    text: 'text-white',
                    border: 'border-emerald-600',
                    icon: CheckCircle2,
                    timeline: 'bg-emerald-500',
                };
            case 'NDR':
                return {
                    bg: 'bg-amber-100',
                    text: 'text-amber-800',
                    border: 'border-amber-300',
                    icon: AlertOctagon,
                    timeline: 'bg-amber-500',
                };
            case 'RTO':
            case 'CANCELLED':
                return {
                    bg: 'bg-red-50',
                    text: 'text-red-700',
                    border: 'border-red-200',
                    icon: AlertCircle,
                    timeline: 'bg-red-500',
                };
            default:
                return {
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                    icon: Box,
                    timeline: 'bg-slate-400',
                };
        }
    };

    const getOrderItemImage = (item) => {
        if (item?.image) return item.image;
        const populatedProduct = item?.productId;
        if (populatedProduct && typeof populatedProduct === 'object')
            return populatedProduct.images?.[0]?.url || '';
        return '';
    };

    const getVisiblePages = () => {
        const windowSize = 5;
        let start = Math.max(1, page - Math.floor(windowSize / 2));
        let end = Math.min(totalPages, start + windowSize - 1);
        start = Math.max(1, end - windowSize + 1);
        return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
    };

    const showingStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const showingEnd = Math.min(page * PAGE_SIZE, totalCount);

    return (
        <div className="mx-auto mb-20 w-full max-w-7xl flex-1 px-4 py-8 font-sans text-slate-900 sm:px-6 md:mb-0 lg:px-8 lg:py-12">
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Orders & Payouts
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Track wholesale shipments, dropship deliveries, and pending profit margins.
                    </p>
                </div>
                <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-4 lg:pb-0">
                    <div className="flex min-w-[220px] shrink-0 items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <span className="mb-0.5 block text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase">
                                Incoming COD Margins
                            </span>
                            <div className="text-2xl font-black text-emerald-900">
                                ₹
                                {pendingProfit.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setFilter('NDR');
                            setPage(1);
                        }}
                        disabled={ndrCount === 0}
                        className={`flex min-w-[220px] shrink-0 items-center gap-4 rounded-2xl border p-5 text-left shadow-sm transition-all ${ndrCount > 0 ? 'cursor-pointer border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default border-slate-200 bg-white'}`}
                    >
                        <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${ndrCount > 0 ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-100 text-slate-400'}`}
                        >
                            <AlertOctagon size={24} />
                        </div>
                        <div>
                            <span
                                className={`mb-0.5 block text-[10px] font-extrabold tracking-widest uppercase ${ndrCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}
                            >
                                NDR Alerts
                            </span>
                            <div
                                className={`text-2xl font-black ${ndrCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}
                            >
                                {ndrCount}{' '}
                                <span className="text-sm font-bold opacity-70">Action Req.</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {ndrCount > 0 && (
                <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                            <AlertOctagon size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-extrabold text-amber-900">
                                Action Required: Failed Deliveries
                            </h4>
                            <p className="mt-0.5 text-xs font-bold text-amber-700">
                                You have {ndrCount} dropship orders facing delivery issues. Please
                                contact your customers to avoid RTO charges.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setFilter('NDR');
                            setPage(1);
                        }}
                        className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-extrabold tracking-widest whitespace-nowrap text-white uppercase shadow-sm transition-colors hover:bg-amber-700"
                    >
                        View NDR Orders
                    </button>
                </div>
            )}

            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="relative max-w-lg flex-1">
                    <Search
                        size={18}
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Search Order ID, Customer, or SKU..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-11 text-sm font-bold text-slate-900 transition-all outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => {
                            setFilter(e.target.value);
                            setPage(1);
                        }}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING_PROCESSING">Pending / Processing</option>
                        <option value="SHIPPED">Shipped / In Transit</option>
                        <option value="NDR">NDR (Failed Delivery)</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="PROFIT_CREDITED">Completed & Paid</option>
                        <option value="RTO">Returned (RTO)</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => {
                            setSortOrder(e.target.value);
                            setPage(1);
                        }}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    >
                        <option value="latest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            </div>

            <p className="mb-6 text-xs font-bold tracking-wide text-slate-500 uppercase">
                Showing {showingStart}-{showingEnd} of {totalCount} orders
            </p>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
                    <p className="text-xs font-bold tracking-widest uppercase">
                        Syncing Logistics...
                    </p>
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
                    <div className="mb-4 rounded-full bg-slate-50 p-6">
                        <Package size={48} className="text-slate-300" />
                    </div>
                    <h3 className="mb-2 text-xl font-extrabold text-slate-900">No Orders Found</h3>
                    <p className="font-medium text-slate-500">
                        Try adjusting your filters or head to the catalog to procure inventory.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((ord) => {
                        const isExpanded = expandedOrders.has(ord._id);
                        const isDropship = !!ord.endCustomerDetails;
                        const statusDef = getStatusStyle(ord.status);
                        const StatusIcon = statusDef.icon;

                        return (
                            <div
                                key={ord._id}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                            >
                                <div className="flex flex-col justify-between gap-6 border-b border-slate-100 p-5 md:p-6 lg:flex-row lg:items-center">
                                    <div className="flex-1">
                                        <div className="mb-3 flex flex-wrap items-center gap-3">
                                            <h3 className="text-xl font-black text-slate-900">
                                                {ord.orderId}
                                            </h3>
                                            <span
                                                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold tracking-widest uppercase ${statusDef.bg} ${statusDef.text} ${statusDef.border}`}
                                            >
                                                <StatusIcon size={12} />{' '}
                                                {statusDef.display || ord.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                                            <p className="flex items-center gap-1.5">
                                                <Clock size={14} />{' '}
                                                {new Date(ord.createdAt).toLocaleDateString(
                                                    'en-IN',
                                                    {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }
                                                )}
                                            </p>
                                            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                            {isDropship ? (
                                                <span className="flex items-center gap-1.5 text-amber-600">
                                                    <MapPin size={14} /> Dropship Dispatch
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-indigo-600">
                                                    <Box size={14} /> B2B Wholesale
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className={`flex shrink-0 gap-6 rounded-xl border p-4 ${isDropship ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}
                                    >
                                        <div>
                                            <p className="mb-1 flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                                <Wallet size={12} /> Platform Cost
                                            </p>
                                            <p className="text-lg font-black text-slate-900">
                                                ₹
                                                {ord.totalPlatformCost?.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>

                                        {isDropship && (
                                            <>
                                                <div className="my-1 w-px bg-emerald-200"></div>
                                                <div>
                                                    <p className="mb-1 flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase">
                                                        <TrendingUp size={12} /> Net Margin
                                                    </p>
                                                    <p
                                                        className={`text-lg font-black ${ord.computedMargin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                                                    >
                                                        {ord.computedMargin >= 0 ? '+' : '-'}₹
                                                        {Math.abs(
                                                            ord.computedMargin
                                                        ).toLocaleString('en-IN', {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 px-6 py-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        {ord.status === 'NDR' && (
                                            <span className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-100 px-3 py-1.5 font-bold text-amber-800 shadow-sm">
                                                <AlertOctagon size={16} /> Reason:{' '}
                                                {ord.ndrDetails?.reason || 'Customer Unavailable'}
                                            </span>
                                        )}
                                        {ord.tracking?.awbNumber && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                    {ord.tracking.courierName || 'Courier'} AWB
                                                </span>
                                                <span className="font-mono font-bold text-slate-800">
                                                    {ord.tracking.awbNumber}
                                                </span>
                                            </div>
                                        )}
                                        {ord.tracking?.trackingUrl && (
                                            <a
                                                href={ord.tracking.trackingUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 font-bold text-indigo-700 transition-colors hover:bg-indigo-100 hover:text-indigo-900"
                                            >
                                                <Truck size={16} /> Track
                                            </a>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleExpand(ord._id)}
                                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-extrabold tracking-widest text-slate-600 uppercase shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp size={16} /> Hide Details
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={16} /> View Order Data
                                            </>
                                        )}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="grid grid-cols-1 gap-8 border-t border-slate-200 bg-white p-6 lg:grid-cols-12">
                                        <div className="space-y-6 lg:col-span-7 xl:col-span-7">
                                            {ord.status === 'NDR' &&
                                                ord.ndrDetails?.resellerAction === 'PENDING' && (
                                                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
                                                        <h4 className="mb-2 flex items-center gap-2 text-sm font-black text-amber-900">
                                                            <AlertOctagon size={18} /> Resolve
                                                            Delivery Issue (SLA: 24hrs)
                                                        </h4>
                                                        <p className="mb-4 text-xs font-bold text-amber-700">
                                                            Courier reported: "
                                                            {ord.ndrDetails.reason}". Provide
                                                            updated details or request an RTO.
                                                        </p>
                                                        <div className="flex flex-col gap-4 sm:flex-row">
                                                            <div className="flex-1">
                                                                <label className="mb-1 block text-[10px] font-extrabold tracking-widest text-amber-800 uppercase">
                                                                    Alternate Phone
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. 9876543210"
                                                                    value={
                                                                        ndrForms[ord._id]?.phone ||
                                                                        ''
                                                                    }
                                                                    onChange={(e) =>
                                                                        setNdrForms({
                                                                            ...ndrForms,
                                                                            [ord._id]: {
                                                                                ...ndrForms[
                                                                                    ord._id
                                                                                ],
                                                                                phone: e.target.value.replace(
                                                                                    /\D/g,
                                                                                    ''
                                                                                ), // Clean non-numeric
                                                                            },
                                                                        })
                                                                    }
                                                                    className="w-full rounded-xl border border-amber-200 p-2.5 text-sm font-bold text-amber-900 outline-none focus:border-amber-500"
                                                                />
                                                            </div>
                                                            <div className="flex-2 sm:w-1/2">
                                                                <label className="mb-1 block text-[10px] font-extrabold tracking-widest text-amber-800 uppercase">
                                                                    Add Landmark / Detail
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. Next to HDFC Bank"
                                                                    value={
                                                                        ndrForms[ord._id]
                                                                            ?.address || ''
                                                                    }
                                                                    onChange={(e) =>
                                                                        setNdrForms({
                                                                            ...ndrForms,
                                                                            [ord._id]: {
                                                                                ...ndrForms[
                                                                                    ord._id
                                                                                ],
                                                                                address:
                                                                                    e.target.value,
                                                                            },
                                                                        })
                                                                    }
                                                                    className="w-full rounded-xl border border-amber-200 p-2.5 text-sm font-bold text-amber-900 outline-none focus:border-amber-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 flex gap-3">
                                                            <button
                                                                onClick={async () => {
                                                                    setSubmittingNdr(ord._id);
                                                                    try {
                                                                        await api.post(
                                                                            `/orders/${ord._id}/ndr-action`,
                                                                            {
                                                                                action: 'REATTEMPT',
                                                                                updatedPhone:
                                                                                    ndrForms[
                                                                                        ord._id
                                                                                    ]?.phone,
                                                                                updatedAddress:
                                                                                    ndrForms[
                                                                                        ord._id
                                                                                    ]?.address,
                                                                            }
                                                                        );
                                                                        toast.success(
                                                                            'Reattempt request sent to courier!'
                                                                        );
                                                                        setTimeout(
                                                                            () =>
                                                                                window.location.reload(),
                                                                            1500
                                                                        );
                                                                    } catch (e) {
                                                                        toast.error(
                                                                            e.response?.data
                                                                                ?.message ||
                                                                                'Failed to submit action'
                                                                        );
                                                                        setSubmittingNdr(null);
                                                                    }
                                                                }}
                                                                disabled={submittingNdr === ord._id}
                                                                className="rounded-xl bg-amber-600 px-6 py-2.5 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-50"
                                                            >
                                                                {submittingNdr === ord._id
                                                                    ? 'Submitting...'
                                                                    : 'Request Reattempt'}
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (
                                                                        !window.confirm(
                                                                            'Are you sure you want to cancel and return this item? You will lose the shipping fees.'
                                                                        )
                                                                    )
                                                                        return;
                                                                    setSubmittingNdr(ord._id);
                                                                    try {
                                                                        await api.post(
                                                                            `/orders/${ord._id}/ndr-action`,
                                                                            {
                                                                                action: 'RTO_REQUESTED',
                                                                            }
                                                                        );
                                                                        toast.success(
                                                                            'RTO request successful!'
                                                                        );
                                                                        setTimeout(
                                                                            () =>
                                                                                window.location.reload(),
                                                                            1500
                                                                        );
                                                                    } catch (e) {
                                                                        toast.error(
                                                                            e.response?.data
                                                                                ?.message ||
                                                                                'Failed to submit RTO'
                                                                        );
                                                                        setSubmittingNdr(null);
                                                                    }
                                                                }}
                                                                disabled={submittingNdr === ord._id}
                                                                className="rounded-xl border border-amber-300 bg-transparent px-6 py-2.5 text-xs font-black text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                                                            >
                                                                Return to Origin (RTO)
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                            <div>
                                                <h4 className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                                                    <Package size={16} /> Item Breakdown
                                                </h4>
                                                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                                                    {ord.items.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-start gap-4 bg-white p-5 transition-colors hover:bg-slate-50"
                                                        >
                                                            <div className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-slate-100">
                                                                {getOrderItemImage(item) && (
                                                                    <img
                                                                        src={getOrderItemImage(
                                                                            item
                                                                        )}
                                                                        alt=""
                                                                        className="h-full w-full rounded-xl object-cover"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="line-clamp-2 text-sm leading-tight font-bold text-slate-900">
                                                                    {item.title}
                                                                </p>
                                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                                                                        SKU: {item.sku}
                                                                    </span>
                                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                                                                        HSN: {item.hsnCode}
                                                                    </span>
                                                                    <span>Qty: {item.qty}</span>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 text-right">
                                                                <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                                    Base Rate
                                                                </p>
                                                                <p className="text-sm font-black text-slate-900">
                                                                    ₹
                                                                    {item.platformBasePrice?.toLocaleString(
                                                                        'en-IN'
                                                                    )}
                                                                </p>
                                                                <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                                                                    + ₹
                                                                    {item.taxAmountPerUnit?.toLocaleString(
                                                                        'en-IN'
                                                                    )}{' '}
                                                                    ({item.gstSlab}% GST)
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm">
                                                        <Scale size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                                            Logistics Weight
                                                        </p>
                                                        <p className="text-sm font-black text-slate-900">
                                                            {Number(
                                                                ord.totalBillableWeight
                                                            ).toFixed(3)}{' '}
                                                            kg{' '}
                                                            <span className="text-xs font-bold text-slate-400">
                                                                ({ord.weightType})
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right text-[10px] font-bold text-slate-500">
                                                    <p>
                                                        Actual:{' '}
                                                        {Number(ord.totalActualWeight).toFixed(3)}{' '}
                                                        kg
                                                    </p>
                                                    <p>
                                                        Volumetric:{' '}
                                                        {Number(ord.totalVolumetricWeight).toFixed(
                                                            3
                                                        )}{' '}
                                                        kg
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 lg:col-span-5 xl:col-span-5">
                                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                <h4 className="mb-4 flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                                                    <Clock size={16} /> Tracking Timeline
                                                </h4>
                                                <div className="relative ml-2 space-y-4 border-l-2 border-slate-100 pl-4">
                                                    {[...ord.statusHistory]
                                                        .reverse()
                                                        .map((h, i) => {
                                                            const hStyle = getStatusStyle(h.status);
                                                            return (
                                                                <div key={i} className="relative">
                                                                    <div
                                                                        className={`absolute top-1 -left-[21px] h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm ${hStyle.timeline}`}
                                                                    ></div>
                                                                    <p className="text-xs font-extrabold tracking-wide text-slate-800 uppercase">
                                                                        {h.status === 'PENDING'
                                                                            ? 'Order Placed (Awaiting Auth)'
                                                                            : h.status.replace(
                                                                                  /_/g,
                                                                                  ' '
                                                                              )}
                                                                    </p>
                                                                    {h.status === 'PENDING' &&
                                                                        !isDropship && (
                                                                            <p className="mt-0.5 text-[10px] font-bold text-amber-600">
                                                                                Wholesale orders are
                                                                                undergoing checks &
                                                                                e-way bill
                                                                                generation.
                                                                            </p>
                                                                        )}
                                                                    {h.comment && (
                                                                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                                            {h.comment}
                                                                        </p>
                                                                    )}
                                                                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                                                                        {new Date(
                                                                            h.date
                                                                        ).toLocaleString('en-IN', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                                <h4 className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                                                    <MapPin size={16} /> Routing & Payment
                                                </h4>
                                                {isDropship && ord.endCustomerDetails ? (
                                                    <div className="mb-4 text-sm text-slate-700">
                                                        <p className="font-black text-slate-900">
                                                            {ord.endCustomerDetails.name}
                                                        </p>
                                                        <p className="font-bold text-slate-600">
                                                            {ord.endCustomerDetails.phone}
                                                        </p>
                                                        <p className="mt-1 leading-tight font-medium">
                                                            {ord.endCustomerDetails.address.street},{' '}
                                                            {ord.endCustomerDetails.address.city},{' '}
                                                            {ord.endCustomerDetails.address.state}{' '}
                                                            {ord.endCustomerDetails.address.zip}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="mb-4 text-sm font-medium text-slate-700">
                                                        <p className="font-black text-slate-900">
                                                            Standard B2B Delivery
                                                        </p>
                                                        <p className="mt-1 text-slate-600">
                                                            Dispatched to your registered KYC
                                                            address.
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard
                                                            size={16}
                                                            className="text-slate-400"
                                                        />
                                                        <span className="text-xs font-black text-slate-900">
                                                            {ord.paymentMethod === 'COD'
                                                                ? 'Cash on Delivery'
                                                                : 'Prepaid (Wallet)'}
                                                        </span>
                                                    </div>
                                                    {ord.paymentMethod === 'COD' && (
                                                        <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-extrabold tracking-widest text-amber-800 uppercase">
                                                            Collect: ₹
                                                            {ord.amountToCollect?.toLocaleString(
                                                                'en-IN'
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                                <h4 className="mb-4 flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-500 uppercase">
                                                    <Receipt size={16} /> Financial Receipt
                                                </h4>
                                                <div className="flex flex-col space-y-3 text-sm text-slate-600">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">
                                                            Items Subtotal
                                                        </span>
                                                        <span className="font-bold text-slate-900">
                                                            ₹
                                                            {ord.subTotal?.toLocaleString('en-IN', {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">
                                                            Platform Tax (GST)
                                                        </span>
                                                        <span className="font-bold text-slate-900">
                                                            + ₹
                                                            {ord.taxTotal?.toLocaleString('en-IN', {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">
                                                            Freight Charge
                                                        </span>
                                                        <span className="font-bold text-slate-900">
                                                            + ₹
                                                            {(
                                                                ord.deliveryCharge ??
                                                                ord.shippingTotal ??
                                                                0
                                                            ).toLocaleString('en-IN', {
                                                                minimumFractionDigits: 2,
                                                            })}
                                                        </span>
                                                    </div>
                                                    {ord.packingCharge !== undefined && (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium">
                                                                Packing & Handling
                                                            </span>
                                                            <span className="font-bold text-slate-900">
                                                                + ₹
                                                                {(
                                                                    ord.packingCharge || 0
                                                                ).toLocaleString('en-IN', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {ord.codCharge > 0 && (
                                                        <div className="flex justify-between text-amber-700">
                                                            <span className="font-medium">
                                                                COD Collection Fee
                                                            </span>
                                                            <span className="font-bold">
                                                                + ₹
                                                                {ord.codCharge?.toLocaleString(
                                                                    'en-IN',
                                                                    { minimumFractionDigits: 2 }
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mt-2 flex justify-between border-t border-dashed border-slate-300 pt-3 text-base">
                                                        <span className="font-extrabold text-slate-900">
                                                            Platform Cost
                                                        </span>
                                                        <span className="font-black text-slate-900">
                                                            ₹
                                                            {ord.totalPlatformCost?.toLocaleString(
                                                                'en-IN',
                                                                { minimumFractionDigits: 2 }
                                                            )}
                                                        </span>
                                                    </div>
                                                    {isDropship && (
                                                        <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base">
                                                            <span className="font-extrabold text-emerald-700">
                                                                Net Profit Margin
                                                            </span>
                                                            <span
                                                                className={`font-black ${ord.computedMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                                                            >
                                                                {ord.computedMargin >= 0
                                                                    ? '+'
                                                                    : '-'}
                                                                ₹
                                                                {Math.abs(
                                                                    ord.computedMargin
                                                                ).toLocaleString('en-IN', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {totalPages > 1 && (
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <button
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page === 1 || loading}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-extrabold tracking-wide text-slate-700 uppercase hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Prev
                            </button>
                            {getVisiblePages().map((pageNo) => (
                                <button
                                    key={pageNo}
                                    onClick={() => setPage(pageNo)}
                                    disabled={loading}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-extrabold tracking-wide uppercase transition-colors ${pageNo === page ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {pageNo}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages || loading}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-extrabold tracking-wide text-slate-700 uppercase hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Orders;
