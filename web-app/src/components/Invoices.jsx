import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Download, ArrowLeft, Search, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [downloadingId, setDownloadingId] = useState(null); // Track which button is spinning

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                // REAL API CALL
                const res = await api.get('/invoices/me');
                setInvoices(res.data.data);
            } catch (error) {
                console.error('Failed to fetch invoices', error);
                toast.error('Could not load invoices from the server.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvoices();
    }, []);

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
            link.setAttribute('download', `Tax_Invoice_${invoiceNumber}.pdf`);
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
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <Link
                to="/my-account"
                className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        Tax & Invoices
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Download your B2B GST invoices for Input Tax Credit (ITC) filing.
                    </p>
                </div>

                <div className="relative w-full sm:w-72">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Invoice or Order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm font-semibold text-slate-900 shadow-sm transition-all outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900">No Invoices Found</h3>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Completed wholesale orders and wallet top-ups will automatically
                            generate invoices here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs tracking-wider text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Invoice Details</th>
                                    <th className="px-6 py-4 font-bold">Date</th>
                                    <th className="px-6 py-4 text-right font-bold">Taxable</th>
                                    <th className="px-6 py-4 text-right font-bold">GST</th>
                                    <th className="px-6 py-4 text-right font-bold">Total</th>
                                    <th className="px-6 py-4 text-center font-bold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvoices.map((inv) => (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={inv._id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-indigo-600">
                                                {inv.invoiceNumber}
                                            </div>
                                            <div className="mt-0.5 text-xs font-medium text-slate-500">
                                                Order: {inv.orderId}
                                            </div>
                                            {inv.isItcEligible && (
                                                <div className="mt-1 flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 uppercase">
                                                    <ShieldCheck size={12} /> ITC Eligible
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {new Date(inv.date).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                                            ₹
                                            {inv.taxableAmount.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                                            ₹
                                            {inv.gstAmount.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900">
                                            ₹
                                            {inv.totalAmount.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() =>
                                                    handleDownload(inv._id, inv.invoiceNumber)
                                                }
                                                disabled={downloadingId === inv._id}
                                                className="inline-flex min-w-[70px] items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition-all ring-inset hover:bg-indigo-50 hover:ring-indigo-200 disabled:opacity-50"
                                            >
                                                {downloadingId === inv._id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <Download size={14} /> PDF
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Invoices;
