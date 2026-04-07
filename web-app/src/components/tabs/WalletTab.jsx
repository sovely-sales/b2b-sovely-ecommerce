import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    ArrowDownRight,
    ArrowUpRight,
    AlertCircle,
    TrendingUp,
    ShoppingCart,
    Download,
    X,
    Landmark,
    Loader2,
    Wallet,
    CreditCard,
    ArrowRightLeft,
    RefreshCcw,
} from 'lucide-react';
import api from '../../utils/api';
import { AuthContext } from '../../AuthContext';
import toast from 'react-hot-toast';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function WalletTab() {
    const { user, refreshUser } = useContext(AuthContext);

    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [loadingMore, setLoadingMore] = useState(false);

    const [rechargeAmount, setRechargeAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawError, setWithdrawError] = useState('');

    const quickAmounts = [5000, 10000, 50000];

    const fetchWalletData = async (pageToLoad = 1) => {
        const isInitial = pageToLoad === 1;
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        try {
            const balanceRes = await api.get('/wallet/balance');
            setBalance(balanceRes.data.data.balance || 0);

            const txRes = await api.get(`/wallet/transactions?page=${pageToLoad}&limit=50`);
            const { transactions: newTransactions, pagination: pd } = txRes.data.data;

            if (isInitial) setTransactions(newTransactions || []);
            else setTransactions((prev) => [...prev, ...newTransactions]);

            setPagination(pd || { page: 1, pages: 1 });
        } catch (err) {
            console.error('Failed to fetch wallet', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const analytics = useMemo(() => {
        let totalProfit = 0;
        let totalSpent = 0;
        transactions.forEach((tx) => {
            if (tx.type === 'CREDIT' && tx.purpose.includes('PROFIT')) totalProfit += tx.amount;
            if (tx.type === 'DEBIT') totalSpent += tx.amount;
        });
        return { totalProfit, totalSpent };
    }, [transactions]);

    const ledgerTransactions = useMemo(() => {
        return transactions;
    }, [transactions]);

    const handleRecharge = async (e) => {
        e.preventDefault();
        setError('');
        const amount = Number(rechargeAmount);

        if (!amount || amount < 100) return setError('Minimum capital addition is ₹100');

        setIsProcessing(true);
        try {
            const orderRes = await api.post('/wallet/topup', { amount });
            const invoiceId = orderRes.data.data._id;

            const rzpOrderRes = await api.post('/payments/create-order', { invoiceId });
            const { razorpayOrder, key_id } = rzpOrderRes.data.data;

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) throw new Error('Payment gateway failed to load.');

            const options = {
                key: key_id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Sovely B2B Network',
                description: 'Working Capital Recharge',
                order_id: razorpayOrder.id,
                handler: async function (response) {
                    try {
                        await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            invoiceId: invoiceId,
                        });
                        setRechargeAmount('');
                        fetchWalletData();
                        refreshUser();
                        toast.success('Capital added successfully!');
                    } catch (err) {
                        toast.error('Payment verification failed.');
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
            setError(err.response?.data?.message || err.message || 'Failed to initiate recharge');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        setWithdrawError('');
        const amount = Number(withdrawAmount);

        if (!amount || amount < 500) return setWithdrawError('Minimum withdrawal is ₹500');
        if (amount > balance) return setWithdrawError('Insufficient funds available.');

        setIsProcessing(true);
        try {
            await api.post('/wallet/withdraw', {
                amount,
                bankDetails: { accountNumber: user?.bankDetails?.accountNumber || 'XXXX1234' },
            });
            setIsWithdrawModalOpen(false);
            setWithdrawAmount('');
            fetchWalletData();
            refreshUser();
            toast.success('Withdrawal processing. Funds arrive in 1-2 business days.');
        } catch (err) {
            setWithdrawError(err.response?.data?.message || 'Withdrawal failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const getTransactionStyling = (purpose, type) => {
        const p = purpose.toUpperCase();

        if (p.includes('RECHARGE') || p.includes('ADD') || p.includes('TOPUP'))
            return {
                icon: Download,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                border: 'border-indigo-100',
            };

        if (p.includes('WITHDRAWAL'))
            return {
                icon: Landmark,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
            };

        if (p.includes('REFUND'))
            return {
                icon: RefreshCcw,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                border: 'border-amber-100',
            };

        if (p.includes('PROFIT'))
            return {
                icon: TrendingUp,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
            };

        if (p.includes('ORDER') || p.includes('PAYMENT'))
            return {
                icon: ShoppingCart,
                color: 'text-rose-600',
                bg: 'bg-rose-50',
                border: 'border-rose-100',
            };

        return type === 'CREDIT'
            ? {
                  icon: ArrowDownRight,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                  border: 'border-emerald-100',
              }
            : {
                  icon: ArrowUpRight,
                  color: 'text-slate-600',
                  bg: 'bg-slate-100',
                  border: 'border-slate-200',
              };
    };

    return (
        <div className="animate-in fade-in space-y-6 duration-300">
            {}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {}
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl lg:col-span-8">
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
                    <div className="absolute -bottom-32 -left-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"></div>

                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                <Wallet size={16} /> Available Capital
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-slate-300">
                                ACTIVE
                            </div>
                        </div>

                        <div className="mt-8 mb-6">
                            <h2 className="flex items-center text-5xl font-black tracking-tighter sm:text-6xl">
                                <span className="mr-1 font-medium text-slate-500">₹</span>
                                {loading ? (
                                    <Loader2
                                        className="ml-2 animate-spin text-indigo-400"
                                        size={40}
                                    />
                                ) : (
                                    balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                                )}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
                            <button
                                onClick={() => document.getElementById('recharge-input').focus()}
                                className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-slate-900 transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10"
                            >
                                <Plus size={16} /> Add Funds
                            </button>
                            {balance >= 500 && (
                                <button
                                    onClick={() => setIsWithdrawModalOpen(true)}
                                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
                                >
                                    <Landmark size={16} /> Withdraw
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {}
                <div className="flex flex-col gap-6 lg:col-span-4">
                    <div className="flex flex-1 items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                Profit Realized
                            </p>
                            <p className="text-xl font-black text-slate-900">
                                ₹{loading ? '...' : analytics.totalProfit.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-1 items-center gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <ShoppingCart size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                Sourcing Spend
                            </p>
                            <p className="text-xl font-black text-slate-900">
                                ₹{loading ? '...' : analytics.totalSpent.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {}
                <div className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
                    <h3 className="mb-5 flex items-center gap-2 text-xs font-black tracking-widest text-slate-900 uppercase">
                        <CreditCard size={16} className="text-indigo-600" /> Capital Injection
                    </h3>

                    {error && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-[11px] font-bold text-red-700">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" /> <p>{error}</p>
                        </div>
                    )}

                    <div className="mb-5 grid grid-cols-3 gap-2">
                        {quickAmounts.map((amt) => (
                            <button
                                key={amt}
                                type="button"
                                onClick={() => setRechargeAmount(amt.toString())}
                                className={`rounded-xl border py-2.5 text-[11px] font-extrabold transition-all ${Number(rechargeAmount) === amt ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleRecharge} className="mt-auto space-y-4">
                        <div>
                            <label className="mb-1.5 block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                Custom Amount (₹)
                            </label>
                            <input
                                id="recharge-input"
                                type="number"
                                min="100"
                                placeholder="0.00"
                                value={rechargeAmount}
                                onChange={(e) => setRechargeAmount(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xl font-black text-slate-900 transition-all outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isProcessing || !rechargeAmount}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-black text-white transition-all hover:bg-slate-800 hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none"
                        >
                            {isProcessing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                'Proceed to Payment'
                            )}
                        </button>
                    </form>
                </div>

                {}
                <div className="flex h-[450px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:col-span-8">
                    <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white p-6">
                        <h3 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-900 uppercase">
                            <ArrowRightLeft size={16} className="text-slate-400" /> Capital Ledger
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Injections & Withdrawals
                        </span>
                    </div>

                    <div className="custom-scrollbar flex-1 overflow-y-auto bg-white p-2">
                        {loading && transactions.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-500" size={24} />
                            </div>
                        ) : ledgerTransactions.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                                <div className="mb-4 rounded-full bg-slate-50 p-5">
                                    <Landmark size={24} className="text-slate-300" />
                                </div>
                                <p className="font-bold text-slate-900">No Capital Movements</p>
                                <p className="mt-1 text-xs">
                                    Add capital to start procuring inventory.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full border-separate border-spacing-y-2 px-4 text-left text-sm">
                                <tbody>
                                    {ledgerTransactions.map((txn, idx) => {
                                        const isCredit = txn.type === 'CREDIT';
                                        const style = getTransactionStyling(txn.purpose, txn.type);
                                        const Icon = style.icon;

                                        return (
                                            <tr key={idx} className="group transition-colors">
                                                <td className="w-12 py-2">
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${style.bg} ${style.color} ${style.border}`}
                                                    >
                                                        <Icon size={16} />
                                                    </div>
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <p className="font-bold text-slate-900">
                                                        {txn.purpose.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                        {new Date(txn.createdAt).toLocaleDateString(
                                                            'en-IN',
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            }
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="hidden py-2 sm:table-cell">
                                                    <p className="font-mono text-[10px] font-bold text-slate-400">
                                                        {}
                                                        Ref:{' '}
                                                        {txn.referenceId.length > 15
                                                            ? `${txn.referenceId.slice(0, 8)}...${txn.referenceId.slice(-4)}`
                                                            : txn.referenceId}
                                                    </p>
                                                </td>
                                                <td className="py-2 text-right">
                                                    <p
                                                        className={`text-base font-black ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}
                                                    >
                                                        {isCredit ? '+' : '-'}₹
                                                        {txn.amount.toLocaleString('en-IN', {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                                                        Bal: ₹
                                                        {txn.closingBalance?.toLocaleString(
                                                            'en-IN'
                                                        )}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        {pagination.page < pagination.pages && (
                            <div className="p-4 pt-2">
                                <button
                                    onClick={() => fetchWalletData(pagination.page + 1)}
                                    disabled={loadingMore}
                                    className="w-full rounded-xl bg-slate-50 py-3 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-colors hover:bg-slate-100 hover:text-slate-900"
                                >
                                    {loadingMore ? 'Loading...' : 'Load Older Transactions'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {}
            <AnimatePresence>
                {isWithdrawModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isProcessing && setIsWithdrawModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
                                <h3 className="flex items-center gap-2 text-sm font-black tracking-widest text-slate-900 uppercase">
                                    <Landmark size={18} className="text-blue-600" /> Withdraw Funds
                                </h3>
                                <button
                                    onClick={() => setIsWithdrawModalOpen(false)}
                                    disabled={isProcessing}
                                    className="rounded-full bg-slate-200/50 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-6">
                                {withdrawError && (
                                    <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
                                        {withdrawError}
                                    </div>
                                )}
                                <form onSubmit={handleWithdrawal}>
                                    <div className="mb-6">
                                        <div className="mb-2 flex items-end justify-between">
                                            <label className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
                                                Amount (₹)
                                            </label>
                                            <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-extrabold text-blue-600 uppercase">
                                                Max: ₹{balance.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <input
                                            type="number"
                                            min="500"
                                            max={balance}
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-2xl font-black transition-all outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
                                        <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                            Transferring to:
                                        </p>
                                        <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                                            <Landmark size={14} className="text-slate-400" /> Acct
                                            ending in{' '}
                                            {user?.bankDetails?.accountNumber?.slice(-4) || 'XXXX'}
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={
                                            isProcessing || !withdrawAmount || withdrawAmount < 500
                                        }
                                        className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none"
                                    >
                                        {isProcessing ? (
                                            <Loader2 size={18} className="mx-auto animate-spin" />
                                        ) : (
                                            'Confirm Withdrawal'
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
