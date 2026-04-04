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
} from 'lucide-react';
import api from '../utils/api.js';
import { useDebounce } from '../hooks/useDebounce.js';

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
    const debouncedSearchTerm = useDebounce(searchTerm, 350);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);

                const params = {
                    page,
                    limit: PAGE_SIZE,
                    sort: sortOrder,
                };

                if (filter !== 'ALL') params.status = filter;
                if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();

                const res = await api.get('/orders', { params });

                const apiOrders = Array.isArray(res.data?.data?.orders) ? res.data.data.orders.map(ord => {
                    let computedMargin = ord.resellerProfitMargin || 0;
                    if (computedMargin === 0 && ord.endCustomerDetails && ord.items?.length > 0) {
                        const totalSelling = ord.items.reduce((sum, item) => sum + ((item.resellerSellingPrice || 0) * item.qty), 0);
                        if (totalSelling > 0) {
                            computedMargin = totalSelling - ord.totalPlatformCost;
                        }
                    }
                    return { ...ord, computedMargin };
                }) : [];

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
    }, [navigate, page, filter, debouncedSearchTerm, sortOrder]);

    useEffect(() => {
        const next = new URLSearchParams();
        if (filter !== 'ALL') next.set('status', filter);
        if (searchTerm.trim()) next.set('search', searchTerm.trim());
        if (sortOrder !== 'latest') next.set('sort', sortOrder);
        if (page > 1) next.set('page', String(page));
        setSearchParams(next, { replace: true });
    }, [filter, page, searchTerm, setSearchParams, sortOrder]);

    // FIX: Include PENDING, PROCESSING, and NDR orders in the incoming profit calculator
    const pendingProfit = orders
        .filter((ord) =>
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
            case 'PROCESSING':
                return {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    icon: Clock,
                };
            case 'SHIPPED':
                return {
                    bg: 'bg-indigo-50',
                    text: 'text-indigo-700',
                    border: 'border-indigo-200',
                    icon: Truck,
                };
            case 'DELIVERED':
                return {
                    bg: 'bg-teal-50',
                    text: 'text-teal-700',
                    border: 'border-teal-200',
                    icon: Package,
                };
            case 'PROFIT_CREDITED':
                return {
                    bg: 'bg-emerald-500',
                    text: 'text-white',
                    border: 'border-emerald-600',
                    icon: CheckCircle2,
                };
            case 'NDR':
                return {
                    bg: 'bg-amber-100',
                    text: 'text-amber-800',
                    border: 'border-amber-300',
                    icon: AlertOctagon,
                };
            case 'RTO':
            case 'CANCELLED':
                return {
                    bg: 'bg-red-50',
                    text: 'text-red-700',
                    border: 'border-red-200',
                    icon: AlertCircle,
                };
            default:
                return {
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                    icon: Box,
                };
        }
    };

    const getOrderItemImage = (item) => {
        if (item?.image) return item.image;

        const populatedProduct = item?.productId;
        if (populatedProduct && typeof populatedProduct === 'object') {
            return populatedProduct.images?.[0]?.url || '';
        }

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
                    <Link
                        to="/my-account"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
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

                    <div
                        className={`flex min-w-[220px] shrink-0 items-center gap-4 rounded-2xl border p-5 shadow-sm transition-all ${ndrCount > 0 ? 'animate-[pulse_3s_ease-in-out_infinite] border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-slate-200 bg-white'}`}
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
                    </div>
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
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 transition-all outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
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
                        className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700 transition-all outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
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
                                                {ord.status.replace(/_/g, ' ')}
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
                                                    <p className={`text-lg font-black ${ord.computedMargin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {ord.computedMargin >= 0 ? '+' : '-'}₹
                                                        {(
                                                            Math.abs(ord.computedMargin)
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
                                        {ord.tracking?.trackingUrl && (
                                            <a
                                                href={ord.tracking.trackingUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 font-bold text-indigo-700 transition-colors hover:bg-indigo-100 hover:text-indigo-900"
                                            >
                                                <Truck size={16} /> Track Shipment
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
                                        <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                                            <h4 className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                                                <Package size={16} /> Order Contents
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
                                                                    src={getOrderItemImage(item)}
                                                                    alt=""
                                                                    className="h-full w-full rounded-xl object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="line-clamp-2 text-sm leading-tight font-bold text-slate-900">
                                                                {item.title}
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] uppercase">
                                                                    SKU: {item.sku}
                                                                </span>
                                                                <span>Qty: {item.qty}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
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
                                                                Tax
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                                <h4 className="mb-4 flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-500 uppercase">
                                                    <Receipt size={16} /> Financial Breakdown
                                                </h4>
                                                <div className="flex flex-col space-y-2.5 text-sm text-slate-600">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">
                                                            Platform Subtotal
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
                                                            Tax (GST)
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
                                                            Delivery Charge
                                                        </span>
                                                        <span className="font-bold text-slate-900">
                                                            + ₹
                                                            {(
                                                                ord.deliveryCharge ||
                                                                ord.shippingTotal ||
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
                                                                COD Fee
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
                                                            Total Deducted
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
                                                            <span className={`font-black ${ord.computedMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {ord.computedMargin >= 0 ? '+' : '-'}₹
                                                                {Math.abs(ord.computedMargin).toLocaleString(
                                                                    'en-IN',
                                                                    { minimumFractionDigits: 2 }
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
                                            {isDropship && ord.endCustomerDetails ? (
                                                <div>
                                                    <h4 className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                                                        <MapPin size={16} /> Dispatch Address
                                                    </h4>
                                                    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 text-sm text-slate-700">
                                                        <p className="text-base font-black text-slate-900">
                                                            {ord.endCustomerDetails.name}
                                                        </p>
                                                        <p className="mt-1 font-bold text-slate-600">
                                                            {ord.endCustomerDetails.phone}
                                                        </p>
                                                        <div className="mt-3 border-t border-amber-200/50 pt-3 font-medium">
                                                            <p>
                                                                {
                                                                    ord.endCustomerDetails.address
                                                                        .street
                                                                }
                                                            </p>
                                                            <p>
                                                                {
                                                                    ord.endCustomerDetails.address
                                                                        .city
                                                                }
                                                                ,{' '}
                                                                {
                                                                    ord.endCustomerDetails.address
                                                                        .state
                                                                }
                                                            </p>
                                                            <p className="mt-1 font-bold text-slate-900">
                                                                {ord.endCustomerDetails.address.zip}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <h4 className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                                                        <Box size={16} /> Delivery Destination
                                                    </h4>
                                                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-sm font-medium text-slate-700">
                                                        <p className="font-black text-slate-900">
                                                            Standard B2B Delivery
                                                        </p>
                                                        <p className="mt-1 text-slate-600">
                                                            Items dispatched to your registered HQ
                                                            address based on KYC.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <h4 className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-widest text-slate-400 uppercase">
                                                    <CreditCard size={16} /> Customer Payment
                                                </h4>
                                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                                    <span className="text-sm font-black text-slate-900">
                                                        {ord.paymentMethod === 'COD'
                                                            ? 'Cash on Delivery'
                                                            : 'Prepaid (Wallet)'}
                                                    </span>
                                                    {ord.paymentMethod === 'COD' && (
                                                        <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-amber-800 uppercase">
                                                            To Collect: ₹
                                                            {ord.amountToCollect?.toLocaleString(
                                                                'en-IN'
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <Link
                                                    to={`/orders/${ord._id}/track`}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                                                >
                                                    <Package size={18} /> Full Tracking & Invoices
                                                </Link>
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
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-extrabold tracking-wide uppercase transition-colors ${pageNo === page
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
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