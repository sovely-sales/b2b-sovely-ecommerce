import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Package,
    Truck,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Phone,
    MapPin,
    ExternalLink,
    IndianRupee,
    Wallet,
    Loader2,
} from 'lucide-react';
import api from '../utils/api.js';
import LoadingScreen from './LoadingScreen';

const OrderTracking = () => {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [ndrAction, setNdrAction] = useState('REATTEMPT');
    const [updatedPhone, setUpdatedPhone] = useState('');
    const [submittingNdr, setSubmittingNdr] = useState(false);

    // NEW: Track invoice download state for better UX
    const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

    useEffect(() => {
        const fetchOrder = async (silent = false) => {
            try {
                const res = await api.get(`/orders/${id}`);
                setOrder(res.data.data);
                if (res.data.data?.endCustomerDetails?.phone && !silent) {
                    setUpdatedPhone(res.data.data.endCustomerDetails.phone);
                }
            } catch (err) {
                if (!silent)
                    setError(err.response?.data?.message || 'Failed to load order details');
            } finally {
                if (!silent) setLoading(false);
            }
        };
        fetchOrder();

        const interval = setInterval(() => fetchOrder(true), 15000);
        return () => clearInterval(interval);
    }, [id]);

    const handleNdrSubmit = async (e) => {
        e.preventDefault();
        setSubmittingNdr(true);
        try {
            const res = await api.post(`/orders/${id}/ndr-action`, {
                action: ndrAction,
                updatedPhone: ndrAction === 'REATTEMPT' ? updatedPhone : undefined,
            });
            setOrder(res.data.data);
            alert('Action submitted successfully to courier.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit action');
        } finally {
            setSubmittingNdr(false);
        }
    };

    const handleDownloadInvoice = async () => {
        setIsDownloadingInvoice(true);
        try {
            const response = await api.get(`/invoices/order/${order._id}/pdf`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(
                new Blob([response.data], { type: 'application/pdf' })
            );
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${order.orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download PDF', err);
            alert('Failed to generate PDF. Make sure the order has an invoice generated.');
        } finally {
            setIsDownloadingInvoice(false);
        }
    };

    if (loading) return <LoadingScreen />;
    if (error) return <div className="p-8 text-center font-bold text-red-500">{error}</div>;
    if (!order) return null;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
            case 'PROCESSING':
                return <Package size={20} />;
            case 'SHIPPED':
                return <Truck size={20} />;
            case 'DELIVERED':
            case 'PROFIT_CREDITED':
                return <CheckCircle size={20} />;
            case 'NDR':
                return <AlertTriangle size={20} />;
            case 'CANCELLED':
            case 'RTO':
                return <XCircle size={20} />;
            default:
                return <CheckCircle size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DELIVERED':
            case 'PROFIT_CREDITED':
                return 'bg-emerald-500 text-white border-emerald-500';
            case 'NDR':
                return 'bg-amber-500 text-white border-amber-500';
            case 'CANCELLED':
            case 'RTO':
                return 'bg-red-500 text-white border-red-500';
            case 'SHIPPED':
                return 'bg-indigo-500 text-white border-indigo-500';
            default:
                return 'bg-slate-200 text-slate-500 border-slate-300';
        }
    };

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-8 pb-24 font-sans text-slate-900">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">{order.orderId}</h1>
                    <p className="mt-1 text-sm font-medium text-slate-400">
                        Placed on{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </p>
                </div>
                {order.resellerProfitMargin > 0 && order.paymentMethod === 'COD' && (
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
                        <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                            Expected Profit
                        </p>
                        <p className="flex items-center gap-1 text-xl font-black">
                            <IndianRupee size={18} />{' '}
                            {order.resellerProfitMargin?.toLocaleString('en-IN')}
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="space-y-6 md:col-span-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="mb-6 text-xl font-extrabold text-slate-900">
                            Tracking History
                        </h2>
                        <div className="relative space-y-8 border-l-2 border-slate-100 pl-4">
                            {(() => {
                                const history =
                                    order.statusHistory && order.statusHistory.length > 0
                                        ? [...order.statusHistory].reverse()
                                        : [
                                              {
                                                  status: order.status,
                                                  comment: 'Current order status',
                                                  date: order.updatedAt || order.createdAt,
                                              },
                                          ];
                                return history.map((entry, idx) => (
                                    <div key={idx} className="relative">
                                        <div
                                            className={`absolute -left-[27px] flex h-8 w-8 items-center justify-center rounded-full border-4 border-white ${getStatusColor(entry.status)} shadow-sm`}
                                        >
                                            {getStatusIcon(entry.status)}
                                        </div>
                                        <div className="pl-6">
                                            <h3 className="text-sm font-black tracking-wider text-slate-900 uppercase">
                                                {entry.status.replace(/_/g, ' ')}
                                            </h3>
                                            <p className="mt-1 text-sm font-medium text-slate-500">
                                                {entry.comment}
                                            </p>
                                            <p className="mt-1 text-xs font-bold text-slate-400">
                                                {new Date(entry.date).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {order.status === 'NDR' && order.ndrDetails?.resellerAction === 'PENDING' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 rounded-3xl border-2 border-amber-200 bg-amber-50 p-6 sm:p-8">
                            <div className="mb-4 flex items-center gap-3 text-amber-600">
                                <AlertTriangle size={28} />
                                <div>
                                    <h2 className="text-lg font-extrabold text-amber-900">
                                        Action Required: Delivery Failed
                                    </h2>
                                    <p className="text-sm font-medium text-amber-800">
                                        Attempt {order.ndrDetails.attemptCount}:{' '}
                                        {order.ndrDetails.reason}
                                    </p>
                                </div>
                            </div>
                            <form onSubmit={handleNdrSubmit} className="mt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setNdrAction('REATTEMPT')}
                                        className={`rounded-xl border-2 p-3 text-sm font-bold transition-all ${ndrAction === 'REATTEMPT' ? 'border-amber-500 bg-white text-amber-700 shadow-sm' : 'border-amber-200/50 text-amber-600 hover:bg-amber-100'}`}
                                    >
                                        Request Reattempt
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNdrAction('RTO_REQUESTED')}
                                        className={`rounded-xl border-2 p-3 text-sm font-bold transition-all ${ndrAction === 'RTO_REQUESTED' ? 'border-red-500 bg-white text-red-700 shadow-sm' : 'border-amber-200/50 text-amber-600 hover:bg-amber-100'}`}
                                    >
                                        Return to Origin
                                    </button>
                                </div>
                                {ndrAction === 'REATTEMPT' && (
                                    <div className="space-y-1 pt-2">
                                        <label className="text-xs font-bold tracking-wider text-amber-800 uppercase">
                                            Confirm/Update Customer Phone
                                        </label>
                                        <div className="relative">
                                            <Phone
                                                size={16}
                                                className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                                            />
                                            <input
                                                type="tel"
                                                value={updatedPhone}
                                                onChange={(e) =>
                                                    setUpdatedPhone(
                                                        e.target.value.replace(/\D/g, '')
                                                    )
                                                }
                                                maxLength="10"
                                                required
                                                className="w-full rounded-xl border border-amber-200 bg-white py-3 pr-4 pl-10 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                                            />
                                        </div>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={submittingNdr}
                                    className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-extrabold tracking-widest text-white uppercase shadow-lg transition-all hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {submittingNdr ? 'Submitting...' : 'Confirm Action'}
                                </button>
                            </form>
                        </div>
                    )}
                    {order.status === 'NDR' && order.ndrDetails?.resellerAction !== 'PENDING' && (
                        <div className="rounded-3xl border-2 border-indigo-200 bg-indigo-50 p-6 sm:p-8">
                            <div className="flex items-center gap-3 text-indigo-600">
                                <Truck size={28} />
                                <div>
                                    <h2 className="text-lg font-extrabold text-indigo-900">
                                        Action Submitted
                                    </h2>
                                    <p className="text-sm font-medium text-indigo-800">
                                        You requested:{' '}
                                        <span className="font-bold">
                                            {order.ndrDetails.resellerAction.replace(/_/g, ' ')}
                                        </span>
                                        . We have forwarded this to the courier. Awaiting next
                                        update.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-black tracking-wider text-slate-500 uppercase">
                            <Wallet size={16} /> Financial Summary
                        </h3>
                        <div className="space-y-2 text-sm font-medium text-slate-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-900">
                                    ₹{order.subTotal?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (GST)</span>
                                <span className="font-bold text-slate-900">
                                    + ₹{order.taxTotal?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-3">
                                <span>Shipping</span>
                                <span className="font-bold text-slate-900">
                                    + ₹{order.shippingTotal?.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between pt-3 text-base font-black text-slate-900">
                                <span>Platform Paid</span>
                                <span>₹{order.totalPlatformCost?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {order.tracking?.awbNumber && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-black tracking-wider text-slate-500 uppercase">
                                <Truck size={16} /> Courier Info
                            </h3>
                            <p className="text-sm font-bold text-slate-900">
                                {order.tracking.courierName || 'Standard Partner'}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-400">
                                AWB: {order.tracking.awbNumber}
                            </p>
                            {order.tracking.trackingUrl && (
                                <a
                                    href={order.tracking.trackingUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
                                >
                                    Live Tracking <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    )}

                    {order.endCustomerDetails && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-black tracking-wider text-slate-500 uppercase">
                                <MapPin size={16} /> Shipping To
                            </h3>
                            <p className="font-bold text-slate-900">
                                {order.endCustomerDetails.name}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                {order.endCustomerDetails.phone}
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                {order.endCustomerDetails.address.street},<br />
                                {order.endCustomerDetails.address.city},{' '}
                                {order.endCustomerDetails.address.state}
                                <br />
                                {order.endCustomerDetails.address.zip}
                            </p>
                        </div>
                    )}

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-black tracking-wider text-slate-500 uppercase">
                            <Package size={16} /> Tax Invoice
                        </h3>
                        <p className="mb-4 text-sm font-medium text-slate-500">
                            Download the GST compliant invoice for this transaction.
                        </p>
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={isDownloadingInvoice}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isDownloadingInvoice ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                'Download PDF'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default OrderTracking;
