import React, { useState, useContext, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Landmark, Package, Smartphone, ShieldCheck, FileText, Building2 } from 'lucide-react';
import api from '../utils/api.js';
import { CartContext } from '../CartContext';
import Navbar from './Navbar';
import Footer from './Footer';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const items = location.state?.items;

    const { clearCart } = useContext(CartContext); 

    const [paymentMethod, setPaymentMethod] = useState('UPI'); 
    const [paymentTerms, setPaymentTerms] = useState('DUE_ON_RECEIPT');
    const [loading, setLoading] = useState(false);

    const [gstin, setGstin] = useState('');
    const [companyName, setCompanyName] = useState('');

    const financials = useMemo(() => {
        if (!items) return { subtotal: 0, totalGst: 0, totalAmount: 0 };

        let subtotal = 0;
        let totalGst = 0;

        items.forEach(item => {
            const price = item.product?.price || 0;
            const qty = item.qty || 1;
            const gstPercent = item.product?.gstPercent || 18; 

            const itemSubtotal = price * qty;
            const itemGst = itemSubtotal * (gstPercent / 100);

            subtotal += itemSubtotal;
            totalGst += itemGst;
        });

        return {
            subtotal,
            totalGst,
            totalAmount: subtotal + totalGst
        };
    }, [items]);

    if (!items || items?.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-primary/30">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center max-w-md w-full">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Package size={48} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Your Procurement Cart is Empty</h2>
                        <p className="text-slate-500 font-medium mb-8">Add wholesale items to your cart to proceed with checkout.</p>
                        <Link to="/" className="block w-full py-4 bg-primary text-white rounded-full font-bold tracking-wide hover:bg-primary-light transition-all duration-300 shadow-md">
                            Browse Catalog
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const rawItems = items.map(i => ({ productId: i.productId, qty: i.qty }));

            const backendPaymentMethod = ['UPI', 'CARD', 'NETBANKING'].includes(paymentMethod) 
                ? 'RAZORPAY' 
                : paymentMethod;

            const orderRes = await api.post('/orders', {
                items: rawItems,
                paymentMethod: backendPaymentMethod,
                paymentTerms,
                billingDetails: { gstin, companyName } 
            });

            const { order, invoice } = orderRes.data.data;

            if (backendPaymentMethod !== 'RAZORPAY') {
                clearCart();
                navigate('/orders', { state: { successMessage: `Order placed! ID: ${order.orderId}` } });
                return;
            }

            const res = await loadRazorpayScript();
            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                setLoading(false);
                return;
            }

            const rzpOrderRes = await api.post('/payments/create-order', { invoiceId: invoice._id });
            const rzpOrder = rzpOrderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy', 
                amount: rzpOrder.amount, 
                currency: "INR",
                name: "Sovely B2B",
                description: `B2B Order ${order.orderId}`,
                order_id: rzpOrder.id,
                handler: async function (response) {
                    try {
                        await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            invoiceId: invoice._id
                        });
                        clearCart();
                        navigate('/orders');
                    } catch (err) {
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: companyName || "B2B Customer", 
                    email: "procurement@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#1B4332" 
                }
            };

            const paymentObject = new window.Razorpay(options); 
            paymentObject.open();

        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process checkout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-primary/30">
            <Navbar />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

                <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Catalog
                </Link>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

                    {}
                    <div className="flex-1 w-full space-y-8">

                        {}
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-slate-100">
                             <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Billing Details</h2>
                                <Building2 className="text-slate-400" size={28} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                                    <input 
                                        type="text" 
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g. Acme Retail Solutions"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">GSTIN (Optional but recommended)</label>
                                    <input 
                                        type="text" 
                                        value={gstin}
                                        onChange={(e) => setGstin(e.target.value)}
                                        placeholder="e.g. 29ABCDE1234F1Z5"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Method</h2>
                                <ShieldCheck className="text-green-500" size={28} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {[
                                    { id: 'UPI', label: 'UPI (GPay, PhonePe, Paytm)', icon: Smartphone },
                                    { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                                    { id: 'NETBANKING', label: 'Net Banking', icon: Landmark },
                                    { id: 'BANK_TRANSFER', label: 'NEFT / RTGS (B2B)', icon: Landmark },
                                ].map(method => (
                                    <div
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${
                                            paymentMethod === method.id 
                                            ? 'border-primary bg-primary/5' 
                                            : 'border-slate-100 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <method.icon size={24} className={paymentMethod === method.id ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 transition-colors'} />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === method.id ? 'border-primary' : 'border-slate-300'}`}>
                                                {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${paymentMethod === method.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                            {method.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {paymentMethod === 'BANK_TRANSFER' && (
                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-300 mb-8">
                                    <h4 className="font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                                        <Landmark size={18} className="text-slate-500" />
                                        Manual Transfer Required
                                    </h4>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
                                        Please transfer exactly <span className="font-extrabold text-slate-900">₹{financials.totalAmount.toLocaleString('en-IN')}</span> to the following account:
                                    </p>
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">Bank:</span> <span className="font-bold text-slate-900">Sovely National Bank</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">Account:</span> <span className="font-bold text-slate-900 font-mono tracking-wider">1234 5678 9012 3456</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">IFSC:</span> <span className="font-bold text-slate-900 font-mono tracking-wider">SOVE0001234</span></div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary-light transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    `Authorize ₹${financials.totalAmount.toLocaleString('en-IN')}`
                                )}
                            </button>
                            <p className="text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1 mt-4">
                                <ShieldCheck size={14} /> Payments are secure and encrypted
                            </p>
                        </div>
                    </div>

                    {}
                    <div className="w-full lg:w-[400px] xl:w-[450px] lg:sticky lg:top-28">
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-6">Procurement Summary</h3>

                            {}
                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {items.map((item, idx) => {
                                    const product = item.product || item;
                                    const price = product.price || 0;
                                    let safeThumb = 'https://via.placeholder.com/64';
                                    if (product.image) safeThumb = typeof product.image === 'string' ? product.image : product.image.url;
                                    else if (product.images?.[0]) safeThumb = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;

                                    return (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                <img src={safeThumb} alt="Product" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 truncate">{product.name || 'Product Item'}</h4>
                                                <p className="text-xs font-medium text-slate-500">Qty: {item.qty} x ₹{price.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="text-sm font-extrabold text-slate-900 whitespace-nowrap">
                                                ₹{(price * item.qty).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {}
                            <div className="space-y-3 pb-6 border-b border-slate-100 text-sm font-medium text-slate-500">
                                <div className="flex justify-between">
                                    <span>Subtotal (Excl. GST)</span>
                                    <span className="text-slate-900 font-bold">₹{financials.subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-600">
                                    <span className="flex items-center gap-1"><FileText size={14}/> Total GST (ITC Claimable)</span>
                                    <span className="font-bold">+ ₹{financials.totalGst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pan-India Shipping</span>
                                    <span className="text-slate-900 font-bold">Free</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <div>
                                    <span className="block text-lg font-extrabold text-slate-900">Total Invoice</span>
                                    {gstin && <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">B2B INVOICE ELIGIBLE</span>}
                                </div>
                                <span className="text-2xl font-black text-primary tracking-tight">₹{financials.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Checkout;