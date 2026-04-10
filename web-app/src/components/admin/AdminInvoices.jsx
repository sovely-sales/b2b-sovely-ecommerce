import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Download,
    CheckCircle,
    Loader2,
    Wallet,
    Package,
    Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api.js';

const AdminInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterOption, setFilterOption] = useState('ALL');
    const [downloadingId, setDownloadingId] = useState(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const searchInputRef = useRef(null);

    // Global Keypress Listener for Search Autofocus
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

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/invoices/admin/all', {
                params: {
                    page,
                    limit: 10,
                    search: debouncedSearch,
                    status: filterOption === 'ALL' ? '' : filterOption,
                    startDate,
                    endDate,
                },
            });

            // Explicitly extract the array.
            // Depending on ApiResponse structure, it's usually res.data.data.data or res.data.data
            const invoiceData = res.data?.data?.data || res.data?.data || [];

            setInvoices(Array.isArray(invoiceData) ? invoiceData : []);

            setTotalPages(
                res.data?.data?.pagination?.pages || res.data?.data?.pagination?.totalPages || 1
            );
        } catch (err) {
            console.error('Fetch error:', err);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [page, debouncedSearch, filterOption, startDate, endDate]);

    const markAsPaid = async (id) => {
        if (
            !window.confirm(
                'Mark this invoice as PAID? This will also update the associated Order status to COMPLETED.'
            )
        )
            return;
        try {
            await api.put(`/invoices/${id}/manual-payment`);
            fetchInvoices();
        } catch (err) {
            alert('Failed to update invoice status');
        }
    };

    const downloadPDF = async (id, invoiceNumber) => {
        setDownloadingId(id);
        try {
            const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Tax_Invoice_${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download PDF. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <>
            {}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 md:col-span-2 lg:col-span-2">
                    <Search size={18} className="text-slate-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Start typing to search Invoice #, Company, GSTIN..."
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
                        <option value="ALL">All Ledger Entries</option>
                        <option value="UNPAID">Unpaid / Outstanding</option>
                        <option value="PAID">Paid / Settled</option>
                        <option value="OVERDUE">Overdue (Net-30 etc.)</option>
                    </select>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <Calendar size={16} className="mr-2 shrink-0 text-slate-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                        title="Start Date"
                    />
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                    <Calendar size={16} className="mr-2 shrink-0 text-slate-400" />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full cursor-pointer border-none bg-transparent py-2.5 text-sm font-bold text-slate-700 outline-none"
                        title="End Date"
                    />
                </div>
            </div>

            {}
            <div className="mb-6 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                <div className="relative min-h-[300px] overflow-x-auto">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 text-slate-400 backdrop-blur-sm">
                            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                        </div>
                    )}
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Invoice & Type
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    B2B Client
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Amount
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Terms & Due Date
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Status
                                </th>
                                <th className="p-4 text-xs font-bold tracking-wider whitespace-nowrap text-slate-400 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && invoices.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="p-8 text-center font-medium text-slate-500"
                                    >
                                        No invoices found matching your criteria.
                                    </td>
                                </tr>
                            ) : null}
                            {invoices.map((inv, index) => {
                                const isOverdue =
                                    new Date(inv.dueDate) < new Date() &&
                                    inv.paymentStatus === 'UNPAID';
                                const isWallet = inv.invoiceType === 'WALLET_TOPUP';

                                return (
                                    <motion.tr
                                        key={inv._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`rounded-lg p-2 ${isWallet ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}
                                                >
                                                    {isWallet ? (
                                                        <Wallet size={16} />
                                                    ) : (
                                                        <Package size={16} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-mono font-bold text-slate-900">
                                                        {inv.invoiceNumber}
                                                    </div>
                                                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                        {new Date(inv.createdAt).toLocaleDateString(
                                                            'en-IN'
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="line-clamp-1 font-bold text-slate-800">
                                                {inv.billedTo?.companyName || 
                                                 inv.resellerId?.companyName || 
                                                 inv.resellerId?.name || 
                                                 'Unknown Entity'}
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-500">
                                                GSTIN:{' '}
                                                <span className="font-mono text-slate-600">
                                                    {inv.billedTo?.gstin || 
                                                     inv.resellerId?.gstin || 
                                                     'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="font-black text-slate-900">
                                                ₹
                                                {(
                                                    inv.grandTotal || inv.totalAmount
                                                )?.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="text-xs font-bold text-slate-700">
                                                {(inv.paymentTerms || 'DUE_ON_RECEIPT').replace(
                                                    /_/g,
                                                    ' '
                                                )}
                                            </div>
                                            <div
                                                className={`mt-0.5 text-[10px] font-bold ${isOverdue ? 'text-red-600' : 'text-slate-400'}`}
                                            >
                                                Due:{' '}
                                                {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-widest uppercase ${
                                                    inv.paymentStatus === 'PAID'
                                                        ? 'bg-green-100 text-green-700'
                                                        : inv.paymentStatus === 'CANCELLED' ||
                                                            inv.status === 'CANCELLED'
                                                          ? 'bg-red-100 text-red-700'
                                                          : inv.paymentStatus === 'FAILED'
                                                            ? 'bg-red-100 text-red-700'
                                                            : isOverdue
                                                              ? 'bg-red-100 text-red-700 ring-1 ring-red-400'
                                                              : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {inv.paymentStatus === 'CANCELLED' ||
                                                inv.status === 'CANCELLED'
                                                    ? 'CANCELLED'
                                                    : inv.paymentStatus === 'FAILED'
                                                      ? 'FAILED PAYMENT'
                                                      : isOverdue
                                                        ? 'OVERDUE'
                                                        : inv.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        downloadPDF(inv._id, inv.invoiceNumber)
                                                    }
                                                    disabled={downloadingId === inv._id}
                                                    title="Download Tax Invoice PDF"
                                                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                                                >
                                                    {downloadingId === inv._id ? (
                                                        <Loader2
                                                            size={14}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Download size={14} />
                                                    )}
                                                    PDF
                                                </button>

                                                {inv.paymentStatus === 'UNPAID' && (
                                                    <button
                                                        onClick={() => markAsPaid(inv._id)}
                                                        title="Mark as Paid (Bank Transfer/Offline Settlement)"
                                                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                                    >
                                                        <CheckCircle size={14} /> Settle
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
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
        </>
    );
};

export default AdminInvoices;
