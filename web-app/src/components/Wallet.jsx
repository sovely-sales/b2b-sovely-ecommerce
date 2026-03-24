import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Wallet as WalletIcon,
    ArrowLeft,
    Plus,
    History,
    ArrowDownRight,
    ArrowUpRight,
    ShieldCheck,
    AlertCircle,
    Building2,
    TrendingUp,
    ShoppingCart,
    Download,
} from 'lucide-react';
import api from '../utils/api.js';
import { AuthContext } from '../AuthContext';
import LoadingScreen from './LoadingScreen';

// Helper to load Razorpay SDK dynamically
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Wallet = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Recharge State
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    // Scaled up for B2B procurement
    const quickAmounts = [5000, 10000, 50000];

    const fetchWalletData = async () => {
        try {
            const [balanceRes, txRes] = await Promise.all([
                api.get('/wallet/balance'),
                api.get('/wallet/transactions'),
            ]);

            setBalance(balanceRes.data.data.balance || 0);
            setTransactions(txRes.data.data || []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, [navigate]);

    const handleRecharge = async (e) => {
        e.preventDefault();
        setError('');

        const amount = Number(rechargeAmount);
        if (!amount || amount < 100) {
            setError('Minimum working capital addition is ₹100');
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Call your specific addMoney controller
            const orderRes = await api.post('/wallet/add-money', { amount });

            // Match the response shape from your addMoney backend controller
            const { razorpayOrderId, amount: rzpAmount, keyId, invoiceId } = orderRes.data.data;

            // 2. Load Razorpay SDK
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setError('Payment gateway failed to load. Please check your connection.');
                setIsProcessing(false);
                return;
            }

            // 3. Open Razorpay Modal
            const options = {
                key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: rzpAmount, // Backend already multiplied by 100
                currency: 'INR',
                name: 'Sovely B2B Network',
                description: 'Working Capital Recharge',
                order_id: razorpayOrderId, // Fixed: Using proper backend key
                handler: async function (response) {
                    try {
                        // 4. Verify Payment on Backend
                        await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            invoiceId: invoiceId,
                            purpose: 'WALLET_RECHARGE',
                        });

                        setRechargeAmount('');
                        fetchWalletData(); // Refresh balance and ledger
                    } catch (err) {
                        const backendError = err.response?.data?.message || err.message;
                        console.error('Verification Error:', backendError);
                        alert(`Verification Failed: ${backendError}`);
                    }
                },
                prefill: {
                    name: user?.companyName || user?.name || 'Reseller',
                    email: user?.email || '',
                    contact: user?.phoneNumber || '',
                },
                theme: { color: '#0f172a' },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', function (response) {
                setError(`Transaction Failed: ${response.error.description}`);
            });
            paymentObject.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate recharge');
        } finally {
            setIsProcessing(false);
        }
    };

    // Calculate metrics for the dashboard
    const totalMarginsEarned = transactions
        .filter((t) => t.type === 'CREDIT' && t.purpose.includes('MARGIN'))
        .reduce((sum, t) => sum + t.amount, 0);

    // Helper to style ledger items dynamically
    const getTransactionStyling = (purpose, type) => {
        const p = purpose.toUpperCase();
        if (p.includes('RECHARGE') || p.includes('ADD'))
            return { icon: Download, color: 'text-indigo-600', bg: 'bg-indigo-100' };
        if (p.includes('MARGIN') || p.includes('PROFIT'))
            return { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' };
        if (p.includes('ORDER') || p.includes('PURCHASE'))
            return { icon: ShoppingCart, color: 'text-slate-600', bg: 'bg-slate-100' };
        if (p.includes('REFUND'))
            return { icon: ArrowDownRight, color: 'text-amber-600', bg: 'bg-amber-100' };

        return type === 'CREDIT'
            ? { icon: ArrowDownRight, color: 'text-emerald-600', bg: 'bg-emerald-100' }
            : { icon: ArrowUpRight, color: 'text-slate-600', bg: 'bg-slate-100' };
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="mx-auto mb-20 w-full max-w-6xl flex-1 px-4 py-8 font-sans text-slate-900 sm:px-6 md:mb-0 lg:px-8 lg:py-12">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <Link
                        to="/my-account"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Corporate Wallet
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Manage your working capital for bulk procurement and dropship margins.
                    </p>
                </div>

                {/* Lifetime Margin Stat */}
                {totalMarginsEarned > 0 && (
                    <div className="flex min-w-[200px] items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase">
                                Lifetime Margins
                            </p>
                            <p className="text-xl font-black text-emerald-800">
                                ₹{totalMarginsEarned.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Left Column: Recharge Station */}
                <div className="space-y-6 lg:col-span-5">
                    {/* Current Balance Card - Premium Fintech Look */}
                    <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20">
                        <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
                            <Building2 size={240} />
                        </div>
                        <div className="relative z-10">
                            <div className="mb-6 flex items-center justify-between">
                                <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                    <WalletIcon size={16} /> Working Capital
                                </p>
                                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                                    <ShieldCheck size={12} /> Auto-Pay Active
                                </span>
                            </div>
                            <h2 className="mb-8 text-5xl font-black tracking-tight">
                                <span className="mr-1 text-4xl text-slate-400">₹</span>
                                {balance.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </h2>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-300">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                                Securely linked to Sovely B2B Checkout
                            </div>
                        </div>
                    </div>

                    {/* Add Funds Form */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <h3 className="mb-6 flex items-center gap-2 text-lg font-extrabold text-slate-900">
                            <Plus size={20} className="text-indigo-600" /> Add Capital
                        </h3>

                        {error && (
                            <div className="animate-in fade-in slide-in-from-top-2 mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
                                <AlertCircle size={18} className="shrink-0" /> <p>{error}</p>
                            </div>
                        )}

                        <div className="mb-6 grid grid-cols-3 gap-3">
                            {quickAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setRechargeAmount(amt.toString())}
                                    className={`rounded-xl border py-3 text-sm font-bold transition-all ${Number(rechargeAmount) === amt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleRecharge} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                                    Custom Amount (₹)
                                </label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold text-slate-400">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        min="100"
                                        placeholder="0.00"
                                        value={rechargeAmount}
                                        onChange={(e) => setRechargeAmount(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-10 text-xl font-black text-slate-900 transition-all outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing || !rechargeAmount}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-extrabold tracking-widest text-white uppercase shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-white"></div>{' '}
                                        Gateway...
                                    </>
                                ) : (
                                    'Authorize Recharge'
                                )}
                            </button>
                            <p className="mt-4 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Secured by Razorpay
                            </p>
                        </form>
                    </div>
                </div>

                {/* Right Column: Transaction Ledger */}
                <div className="lg:col-span-7">
                    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                            <h3 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                                <History size={22} className="text-slate-400" /> Financial Ledger
                            </h3>
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                                {transactions.length} Records
                            </span>
                        </div>

                        {transactions.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-slate-400">
                                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
                                    <History size={40} className="text-slate-300" />
                                </div>
                                <p className="text-lg font-extrabold text-slate-900">
                                    No Financial History
                                </p>
                                <p className="mt-2 max-w-xs text-sm leading-relaxed font-medium">
                                    Recharge your wallet to start sourcing inventory or earning
                                    dropship margins.
                                </p>
                            </div>
                        ) : (
                            <div className="custom-scrollbar max-h-[600px] space-y-4 overflow-y-auto pr-2">
                                {transactions.map((txn, idx) => {
                                    const isCredit = txn.type === 'CREDIT';
                                    const style = getTransactionStyling(txn.purpose, txn.type);
                                    const Icon = style.icon;

                                    return (
                                        <div
                                            key={idx}
                                            className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 p-5 transition-all hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center"
                                        >
                                            <div className="flex items-start gap-4 sm:items-center">
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.color}`}
                                                >
                                                    <Icon size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {txn.purpose.replace(/_/g, ' ')}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                            {new Date(
                                                                txn.createdAt
                                                            ).toLocaleDateString('en-IN', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                        <span className="text-slate-300">•</span>
                                                        <p className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                                                            Ref: {txn.referenceId}
                                                        </p>
                                                    </div>
                                                    {txn.description && (
                                                        <p className="mt-1 text-sm font-medium text-slate-500">
                                                            {txn.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 border-t border-slate-100 pt-3 pl-16 sm:border-t-0 sm:pt-0 sm:pl-0 sm:text-right">
                                                <p
                                                    className={`text-xl font-black ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}
                                                >
                                                    {isCredit ? '+' : '-'}₹
                                                    {txn.amount.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </p>
                                                <p className="mt-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                    Bal: ₹
                                                    {txn.closingBalance?.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                    }) || '0.00'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Wallet;
