import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Download, Clock, CheckCircle2, ArrowLeft, Box } from 'lucide-react';
import api from '../utils/api.js';
import Navbar from './Navbar';
import Footer from './Footer';

const Orders = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/invoices');
                setInvoices(res.data.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-accent/30">
            <Navbar />
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Orders & Invoices</h1>
                    <Link to="/my-account" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={16} /> Back to Account
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-accent rounded-full animate-spin mb-4"></div>
                        <p className="font-medium">Loading your history...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm border border-slate-100 flex flex-col items-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                            <Box size={48} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">No Orders Found</h3>
                        <p className="text-slate-500 font-medium mb-8">You haven't placed any orders or topped up your wallet yet.</p>
                        <Link to="/" className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold tracking-wide hover:bg-accent transition-all shadow-md hover:shadow-accent/30">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {invoices.map(inv => {
                            const isPaid = inv.status === 'PAID';
                            const isOrder = inv.invoiceType === 'ORDER_BILL';
                            const orderStatus = inv.orderId?.status;
                            const isPendingTransfer = inv.status === 'UNPAID' && inv.paymentMethod === 'BANK_TRANSFER';

                            return (
                                <div key={inv._id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow">

                                    <div className="flex-1 w-full">
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <h3 className="text-xl font-extrabold text-slate-900">
                                                {isOrder ? `Order #${inv.orderId?.orderId || 'N/A'}` : 'Wallet Top-up'}
                                            </h3>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />} {inv.status}
                                            </span>
                                            {isOrder && orderStatus && (
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                                                    {orderStatus}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</span>
                                                <strong className="text-lg font-extrabold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</strong>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Issued</span>
                                                <span className="font-semibold text-slate-700">{new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Terms</span>
                                                <span className="font-semibold text-slate-700">{inv.paymentTerms.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end w-full md:w-auto gap-3">
                                        <a
                                            href={`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/invoices/${inv._id}/pdf`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                                        >
                                            <Download size={16} /> Download PDF
                                        </a>

                                        {isOrder && (
                                            <Link 
                                                to={`/orders/${inv.orderId._id}/track`}
                                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-accent transition-colors shadow-sm"
                                            >
                                                <Package size={16} /> Track Order
                                            </Link>
                                        )}

                                        {isPendingTransfer && (
                                            <div className="text-xs font-bold text-danger flex items-center justify-center md:justify-end gap-1.5 mt-2 bg-danger/10 px-3 py-2 rounded-lg">
                                                <Clock size={14} /> Action Required: Transfer Funds
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Orders;