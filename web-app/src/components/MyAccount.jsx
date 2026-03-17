import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Calendar, LogOut, Wallet, Plus, Package, ArrowLeft } from 'lucide-react';
import api from '../utils/api.js';
import { AuthContext } from '../AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';

const MyAccount = () => {
    const { user, loading, logout } = useContext(AuthContext);
    const [walletBalance, setWalletBalance] = useState(0);
    const [amountToAdd, setAmountToAdd] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
            return;
        }
        if (user) {
            fetchWalletBalance();
        }
    }, [user, loading, navigate]);

    const fetchWalletBalance = async () => {
        try {
            const res = await api.get('/wallet/balance');
            setWalletBalance(res.data.data.balance || 0);
        } catch (error) {
            console.error("Failed to fetch wallet balance", error);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleAddMoney = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amountToAdd);
        if (!amt || amt <= 0) return alert("Enter a valid amount");

        const res = await loadRazorpayScript();
        if (!res) {
            alert("Razorpay SDK failed to load");
            return;
        }

        try {
            const orderRes = await api.post('/wallet/add-money', { amount: amt });
            const { razorpayOrderId, amount, currency, keyId, invoiceId } = orderRes.data.data;

            if (keyId === 'rzp_test_dummy') {
                console.warn("[MOCK MODE] Simulating successful user payment in Razorpay window");
                await api.post('/payments/verify', {
                    razorpay_order_id: razorpayOrderId,
                    razorpay_payment_id: "pay_mock_" + Date.now(),
                    razorpay_signature: "mock_signature_bypass",
                    invoiceId: invoiceId
                });
                alert("Wallet topped up successfully! (MOCK MODE)");
                setAmountToAdd('');
                fetchWalletBalance();
                return;
            }

            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "Sovely E-Commerce",
                description: "Wallet Top-up",
                order_id: razorpayOrderId,
                handler: async function (response) {
                    try {
                        await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            invoiceId: invoiceId
                        });
                        alert("Wallet topped up successfully!");
                        setAmountToAdd('');
                        fetchWalletBalance();
                    } catch (err) {
                        alert("Payment verification failed.");
                    }
                },
                theme: { color: "#8b5cf6" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Unknown error";
            alert("Failed to initialize top-up: " + errorMessage);
            console.error("Top-up failed", error.response?.data || error);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-accent rounded-full animate-spin"></div>
        </div>
    );
    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-accent/30">
            <Navbar />

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 mb-8 transition-colors">
                    <ArrowLeft size={16} /> Return to Store
                </Link>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    {}
                    <div className="bg-slate-900 px-8 py-10 relative overflow-hidden">
                        <div className="absolute -top-24 -right-12 w-64 h-64 bg-accent/20 rounded-full blur-3xl mix-blend-screen"></div>
                        <div className="absolute -bottom-24 left-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl mix-blend-screen"></div>

                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-white text-slate-900 flex items-center justify-center text-4xl font-black shadow-xl border-4 border-white/20">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.name?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="text-white">
                                <h1 className="text-3xl font-extrabold tracking-tight mb-1">Hello, {user.name}</h1>
                                <p className="flex items-center gap-2 text-slate-300 font-medium"><Mail size={16} /> {user.email}</p>
                            </div>
                        </div>
                    </div>

                    {}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {}
                        <div className="space-y-6">
                            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                                <User size={24} className="text-accent" /> My Profile
                            </h3>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm"><Shield size={20} /></div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Role Access</span>
                                    <span className="font-bold text-slate-900">{user.role || 'Customer'}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm"><Calendar size={20} /></div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Member Since</span>
                                    <span className="font-bold text-slate-900">{new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                                </div>
                            </div>

                            <Link to="/orders" className="flex items-center justify-center gap-2 w-full py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-bold tracking-wide hover:bg-slate-900 hover:text-white transition-all">
                                <Package size={18} /> View My Orders
                            </Link>
                        </div>

                        {}
                        <div className="space-y-6">
                            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                                <Wallet size={24} className="text-accent" /> Sovely Wallet
                            </h3>

                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl shadow-lg text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-300 block mb-2 relative z-10">Available Balance</span>
                                <div className="text-4xl font-black text-white relative z-10">
                                    ₹{walletBalance.toLocaleString('en-IN')}
                                </div>
                            </div>

                            <form onSubmit={handleAddMoney} className="space-y-4">
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Enter amount to add"
                                        value={amountToAdd}
                                        onChange={e => setAmountToAdd(e.target.value)}
                                        min="1"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-400 placeholder:font-medium"
                                    />
                                </div>
                                <button type="submit" className="w-full py-4 bg-accent text-white rounded-2xl font-bold tracking-wide hover:bg-accent-glow hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-2">
                                    <Plus size={18} strokeWidth={3} /> Add Money
                                </button>
                            </form>
                        </div>
                    </div>

                    {}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                        <button onClick={handleLogout} className="flex items-center gap-2 text-danger hover:text-white bg-white border border-danger/20 hover:bg-danger px-8 py-3 rounded-full font-bold transition-all shadow-sm">
                            <LogOut size={16} /> Log Out
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MyAccount;