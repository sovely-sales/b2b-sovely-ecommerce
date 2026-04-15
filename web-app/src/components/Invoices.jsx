import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Download,
    Search,
    ShieldCheck,
    Loader2,
    Wallet,
    ShoppingBag,
    Calendar,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [downloadingId, setDownloadingId] = useState(null);

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const [listStartDate, setListStartDate] = useState('');
    const [listEndDate, setListEndDate] = useState('');

    const handleExportMyInvoices = async () => {
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
            const res = await api.get('/invoices/export', {
                params: { startDate: exportStartDate, endDate: exportEndDate },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `my_invoices_export_${exportStartDate}_to_${exportEndDate}.csv`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Invoices exported successfully!');
            setShowExportModal(false);
        } catch (err) {
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const json = JSON.parse(text);
                    toast.error(json.message || 'Export failed.');
                } catch {
                    toast.error('Failed to export invoices. Please try again.');
                }
            } else {
                toast.error(err.response?.data?.message || 'Failed to export invoices. Please try again.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setIsLoading(true);
                const params = {};
                if (listStartDate) params.startDate = listStartDate;
                if (listEndDate) params.endDate = listEndDate;

                const res = await api.get('/invoices/me', { params });
                setInvoices(res.data.data);
            } catch (error) {
                console.error('Failed to fetch invoices', error);
                toast.error('Could not load invoices from the server.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvoices();
    }, [listStartDate, listEndDate]);

    const filteredInvoices = invoices.filter(
        (inv) =>
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownload = async (invoiceId, invoiceNumber) => {
        try {
            setDownloadingId(invoiceId);
            const res = await api.get(`/invoices/${invoiceId}/pdf`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(
                new Blob([res.data], { type: 'application/pdf' })
            );
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Tax_Invoice_${invoiceNumber.replace(/\//g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Invoice downloaded successfully', { position: 'bottom-right' });
        } catch (error) {
            console.error('Failed to download PDF', error);
            toast.error('Failed to generate PDF. Please try again.', { position: 'bottom-right' });
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Financial & Tax Records
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Download your legally compliant B2B GST invoices for Input Tax Credit (ITC)
                        filing.
                    </p>
                </div>

                <div className="flex w-full sm:w-auto items-center gap-3">
                    <div className="relative w-full sm:w-60">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                            <Search size={16} strokeWidth={2.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Invoice or Order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-11 text-sm font-bold text-slate-900 shadow-sm transition-all outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-50"
                        />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        <div className="flex items-center rounded-lg bg-slate-50 px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                            <Calendar size={14} className="mr-2 text-slate-400" />
                            <input
                                type="date"
                                value={listStartDate}
                                onChange={(e) => setListStartDate(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                                title="List Start Date"
                            />
                        </div>
                        <div className="flex items-center rounded-lg bg-slate-50 px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                            <Calendar size={14} className="mr-2 text-slate-400" />
                            <input
                                type="date"
                                value={listEndDate}
                                onChange={(e) => setListEndDate(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                                title="List End Date"
                            />
                        </div>
                        {(listStartDate || listEndDate) && (
                            <button
                                onClick={() => {
                                    setListStartDate('');
                                    setListEndDate('');
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="Clear Dates"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white transition-all hover:bg-slate-800"
                    >
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                {isLoading ? (
                    <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                        <Loader2 size={32} className="mb-4 animate-spin text-indigo-600" />
                        <p className="text-xs font-bold tracking-widest uppercase">
                            Compiling Records...
                        </p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                            <FileText size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">No Invoices Found</h3>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                            Completed wholesale orders and wallet top-ups will automatically
                            generate GST invoices here.
                        </p>
                    </div>
                ) : (
                    <div className="custom-scrollbar overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Document Details</th>
                                    <th className="px-6 py-4">Transaction Date</th>
                                    <th className="px-6 py-4 text-right">Taxable Base</th>
                                    <th className="px-6 py-4 text-right">GST Config</th>
                                    <th className="px-6 py-4 text-right">Grand Total</th>
                                    <th className="px-6 py-4 text-center">Export</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvoices.map((inv) => {
                                    const isWallet = inv.invoiceType === 'WALLET_TOPUP';
                                    return (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={inv._id}
                                            className="group transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isWallet ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}
                                                    >
                                                        {isWallet ? (
                                                            <Wallet size={16} />
                                                        ) : (
                                                            <ShoppingBag size={16} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900">
                                                            {inv.invoiceNumber}
                                                        </div>
                                                        <div className="mt-1 font-mono text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                            Ref: {inv.orderId}
                                                        </div>
                                                        {inv.isItcEligible && (
                                                            <div className="mt-2 flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase">
                                                                <ShieldCheck size={12} /> B2B ITC
                                                                Eligible
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-700">
                                                    {new Date(inv.date).toLocaleDateString(
                                                        'en-IN',
                                                        {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }
                                                    )}
                                                </div>
                                                <div className="mt-1 text-xs font-medium text-slate-400">
                                                    {new Date(inv.date).toLocaleTimeString(
                                                        'en-IN',
                                                        { hour: '2-digit', minute: '2-digit' }
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-bold text-slate-600">
                                                ₹
                                                {inv.taxableAmount.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="font-bold text-slate-600">
                                                    + ₹
                                                    {inv.gstAmount.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </div>
                                                {!isWallet && (
                                                    <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">
                                                        Tax Included
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="text-base font-black text-slate-900">
                                                    ₹
                                                    {inv.totalAmount.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </div>
                                                <div
                                                    className={`mt-1 text-[10px] font-extrabold tracking-widest uppercase ${inv.status === 'PAID' ? 'text-emerald-600' : inv.status === 'FAILED' ? 'text-red-600' : 'text-red-500'}`}
                                                >
                                                    {inv.status === 'FAILED'
                                                        ? 'FAILED PAYMENT'
                                                        : inv.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={() =>
                                                        handleDownload(inv._id, inv.invoiceNumber)
                                                    }
                                                    disabled={downloadingId === inv._id}
                                                    className="inline-flex min-w-[90px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:transform-none disabled:opacity-50"
                                                >
                                                    {downloadingId === inv._id ? (
                                                        <Loader2
                                                            size={14}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <>
                                                            <Download size={14} /> PDF
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
        {showExportModal && (
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false); }}
            >
                <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', width: '100%', maxWidth: '28rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                                <FileText size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Export Invoices</h2>
                                <p className="text-xs font-medium text-slate-500">Download as CSV file</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowExportModal(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">From Date</label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <Calendar size={16} className="text-slate-400" />
                                <input
                                    type="date"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                    className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">To Date</label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <Calendar size={16} className="text-slate-400" />
                                <input
                                    type="date"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                    className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                        GST invoices in this range will export as CSV with Sovely GSTIN details.
                    </p>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => setShowExportModal(false)}
                            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExportMyInvoices}
                            disabled={isExporting}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {isExporting
                                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> Exporting...</>
                                : <><Download size={16} /> Download CSV</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        )}
        </main>
    );
};

export default Invoices;
