import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Landmark,
    Filter,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle2,
    AlertCircle,
    Building2,
    Clock,
    XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminWithdrawals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [filterStatus, setFilterStatus] = useState('PENDING');

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState('APPROVE');
    const [utrNumber, setUtrNumber] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [page, filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/wallet/withdrawals', {
                params: { page, limit: 15, status: filterStatus },
            });
            setRequests(res.data.data.requests || []);
            setTotalPages(res.data.data.pagination.pages || 1);
            setTotalCount(res.data.data.pagination.total || 0);
        } catch (err) {
            console.error('Failed to fetch withdrawals:', err);
            toast.error('Failed to load withdrawal requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRequest = async (e) => {
        e.preventDefault();
        if (actionType === 'APPROVE' && !utrNumber.trim()) {
            return toast.error('Bank UTR Number is required for approval.');
        }
        if (actionType === 'REJECT' && !rejectionReason.trim()) {
            return toast.error('A reason is required to reject a payout.');
        }

        setIsProcessing(true);
        try {
            await api.put(`/wallet/withdrawals/${selectedRequest._id}/process`, {
                action: actionType,
                utrNumber: actionType === 'APPROVE' ? utrNumber.trim() : undefined,
                rejectionReason: actionType === 'REJECT' ? rejectionReason.trim() : undefined,
            });

            toast.success(
                `Withdrawal ${actionType === 'APPROVE' ? 'Approved' : 'Rejected'} successfully!`
            );
            setSelectedRequest(null);
            setUtrNumber('');
            setRejectionReason('');
            fetchRequests(); // Refresh list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-[10px] font-black tracking-widest text-amber-800 uppercase">
                        <Clock size={12} /> Pending
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-[10px] font-black tracking-widest text-emerald-800 uppercase">
                        <CheckCircle2 size={12} /> Paid
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-[10px] font-black tracking-widest text-red-800 uppercase">
                        <XCircle size={12} /> Rejected
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 lg:w-64">
                    <Filter size={18} className="mr-2 shrink-0 text-slate-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setPage(1);
                        }}
                        className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                    >
                        <option value="ALL">All Requests</option>
                        <option value="PENDING">Pending Action</option>
                        <option value="COMPLETED">Completed (Paid)</option>
                        <option value="FAILED">Rejected (Refunded)</option>
                    </select>
                </div>
                <div className="text-sm font-bold text-slate-500">
                    Total Requests: <span className="text-slate-900">{totalCount}</span>
                </div>
            </div>

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
                                <th className="px-6 py-4">Request Info</th>
                                <th className="px-6 py-4">Reseller Details</th>
                                <th className="px-6 py-4">Bank Information</th>
                                <th className="px-6 py-4 text-right">Payout Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && requests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400">
                                        <Landmark size={40} className="mx-auto mb-3 opacity-20" />
                                        <span className="font-bold">
                                            No withdrawal requests found.
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr
                                        key={req._id}
                                        className="transition-colors hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs font-black text-slate-900">
                                                {req.referenceId}
                                            </div>
                                            <div className="mt-1 text-[10px] font-bold text-slate-400">
                                                {new Date(req.createdAt).toLocaleDateString(
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
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-extrabold text-slate-900">
                                                {req.resellerId?.companyName || 'N/A'}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500">
                                                {req.resellerId?.name} |{' '}
                                                {req.resellerId?.phoneNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.resellerId?.bankDetails?.accountNumber ? (
                                                <>
                                                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                                                        <Building2
                                                            size={14}
                                                            className="text-slate-400"
                                                        />
                                                        {req.resellerId.bankDetails.bankName}
                                                    </div>
                                                    <div className="mt-1 font-mono text-[10px] font-bold text-slate-500">
                                                        A/C:{' '}
                                                        {req.resellerId.bankDetails.accountNumber}{' '}
                                                        <br />
                                                        IFSC: {req.resellerId.bankDetails.ifscCode}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-red-500">
                                                    Bank Details Missing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-black text-blue-600">
                                                ₹
                                                {req.amount.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setActionType('APPROVE');
                                                    setUtrNumber('');
                                                    setRejectionReason('');
                                                }}
                                                className={`rounded px-4 py-2 text-[10px] font-extrabold tracking-widest uppercase transition-colors ${
                                                    req.status === 'PENDING'
                                                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {req.status === 'PENDING' ? 'PROCESS' : 'VIEW'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="text-sm font-bold text-slate-500">
                        Page <span className="text-slate-900">{page}</span> of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Process Modal */}
            {createPortal(
                <AnimatePresence>
                    {selectedRequest && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !isProcessing && setSelectedRequest(null)}
                                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] bg-white shadow-2xl"
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
                                    <h3 className="flex items-center gap-2 text-sm font-black tracking-widest text-slate-900 uppercase">
                                        <Landmark
                                            size={18}
                                            className={
                                                selectedRequest.status === 'PENDING'
                                                    ? 'text-blue-600'
                                                    : 'text-slate-600'
                                            }
                                        />
                                        {selectedRequest.status === 'PENDING'
                                            ? 'Process Payout'
                                            : 'Payout Details'}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedRequest(null)}
                                        disabled={isProcessing}
                                        className="rounded-full bg-slate-200/50 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                Payout Amount
                                            </span>
                                            <span className="text-xl font-black text-blue-600">
                                                ₹
                                                {selectedRequest.amount.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                        <div className="mb-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                            Bank Details
                                        </div>
                                        <div className="text-sm font-black text-slate-900">
                                            {selectedRequest.resellerId?.bankDetails?.accountName ||
                                                'N/A'}
                                        </div>
                                        <div className="mt-1 font-mono text-xs font-bold text-slate-600">
                                            A/C:{' '}
                                            {selectedRequest.resellerId?.bankDetails
                                                ?.accountNumber || 'N/A'}{' '}
                                            <br />
                                            IFSC:{' '}
                                            {selectedRequest.resellerId?.bankDetails?.ifscCode ||
                                                'N/A'}{' '}
                                            <br />
                                            Bank:{' '}
                                            {selectedRequest.resellerId?.bankDetails?.bankName ||
                                                'N/A'}
                                        </div>
                                    </div>

                                    {selectedRequest.status === 'PENDING' ? (
                                        <form onSubmit={handleProcessRequest}>
                                            <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setActionType('APPROVE')}
                                                    className={`flex-1 rounded-lg py-2 text-xs font-extrabold transition-all ${actionType === 'APPROVE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                                >
                                                    Approve & Pay
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActionType('REJECT')}
                                                    className={`flex-1 rounded-lg py-2 text-xs font-extrabold transition-all ${actionType === 'REJECT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                                >
                                                    Reject & Refund
                                                </button>
                                            </div>

                                            {actionType === 'APPROVE' ? (
                                                <div className="mb-6">
                                                    <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase">
                                                        Bank UTR / Reference Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Enter NEFT/IMPS UTR"
                                                        value={utrNumber}
                                                        onChange={(e) =>
                                                            setUtrNumber(e.target.value)
                                                        }
                                                        className="w-full rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="mb-6">
                                                    <label className="mb-2 block text-[10px] font-extrabold tracking-widest text-red-700 uppercase">
                                                        Rejection Reason
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. Invalid IFSC Code"
                                                        value={rejectionReason}
                                                        onChange={(e) =>
                                                            setRejectionReason(e.target.value)
                                                        }
                                                        className="w-full rounded-xl border border-red-200 bg-red-50/30 p-3 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isProcessing}
                                                className={`w-full rounded-xl py-3.5 text-sm font-black text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 ${actionType === 'APPROVE' ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700' : 'bg-red-600 shadow-red-600/20 hover:bg-red-700'}`}
                                            >
                                                {isProcessing
                                                    ? 'Processing...'
                                                    : actionType === 'APPROVE'
                                                      ? 'Confirm Payment'
                                                      : 'Confirm Rejection'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                System Log
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-700">
                                                {selectedRequest.description}
                                            </p>
                                        </div>
                                    )}
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

export default AdminWithdrawals;
