import React, { useState, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CreditCard, Wallet, Landmark, Package, Smartphone, ShieldCheck } from 'lucide-react';
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

    // Empty Cart State
    if (!items || items?.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-accent/30">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-white/80 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center max-w-md w-full">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Package size={48} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Your Cart is Empty</h2>
                        <p className="text-slate-500 font-medium mb-8">Add some items to your cart to proceed with checkout.</p>
                        <Link to="/" className="block w-full py-4 bg-slate-900 text-white rounded-full font-bold tracking-wide hover:bg-accent transition-all duration-300 shadow-md hover:shadow-accent/30">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const totalAmount = items.reduce((acc, item) => {
        return acc + ((item.product?.price || 0) * item.qty);
    }, 0);

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
                paymentTerms
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
                name: "Sovely Store",
                description: `Payment for Order ${order.orderId}`,
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
                    name: "Customer", 
                    email: "customer@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#8b5cf6" // Updated to match the new accent color
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
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-accent/30">
            <Navbar />
            
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Shopping
                </Link>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    
                    {/* Left Column: Form Settings */}
                    <div className="flex-1 w-full">
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Method</h2>
                                <ShieldCheck className="text-green-500" size={28} />
                            </div>

                            <form onSubmit={handlePlaceOrder} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { id: 'UPI', label: 'UPI (GPay, PhonePe, Paytm)', icon: Smartphone },
                                        { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                                        { id: 'NETBANKING', label: 'Net Banking', icon: Landmark },
                                        { id: 'WALLET', label: 'Sovely Wallet', icon: Wallet },
                                        { id: 'BANK_TRANSFER', label: 'NEFT / RTGS (B2B)', icon: Landmark },
                                    ].map(method => (
                                        <div
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id)}
                                            className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${
                                                paymentMethod === method.id 
                                                ? 'border-accent bg-accent/5' 
                                                : 'border-slate-100 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <method.icon size={24} className={paymentMethod === method.id ? 'text-accent' : 'text-slate-400 group-hover:text-slate-600 transition-colors'} />
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === method.id ? 'border-accent' : 'border-slate-300'}`}>
                                                    {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-accent rounded-full" />}
                                                </div>
                                            </div>
                                            <span className={`font-bold text-sm ${paymentMethod === method.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {method.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {paymentMethod === 'BANK_TRANSFER' && (
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-[fadeIn_0.3s_ease-out]">
                                        <h4 className="font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                                            <Landmark size={18} className="text-slate-500" />
                                            Manual Transfer Required
                                        </h4>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
                                            Please transfer exactly <span className="font-extrabold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span> to the following account:
                                        </p>
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
                                            <div className="flex justify-between"><span className="text-slate-400 font-bold">Bank:</span> <span className="font-bold text-slate-900">Sovely National Bank</span></div>
                                            <div className="flex justify-between"><span className="text-slate-400 font-bold">Account:</span> <span className="font-bold text-slate-900 font-mono tracking-wider">1234 5678 9012 3456</span></div>
                                            <div className="flex justify-between"><span className="text-slate-400 font-bold">IFSC:</span> <span className="font-bold text-slate-900 font-mono tracking-wider">SOVE0001234</span></div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-slate-900 text-white rounded-full font-bold tracking-wide hover:bg-accent hover:shadow-lg hover:shadow-accent/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg mt-4"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay ₹${totalAmount.toLocaleString('en-IN')}`
                                    )}
                                </button>
                                <p className="text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1">
                                    <ShieldCheck size={14} /> Payments are secure and encrypted
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="w-full lg:w-[400px] xl:w-[450px] lg:sticky lg:top-28">
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-6">Order Summary</h3>
                            
                            {/* Items List */}
                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {items.map((item, idx) => {
                                    // Handle image fallback
                                    let safeThumb = 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=200&q=80';
                                    if (item.product?.image) safeThumb = typeof item.product.image === 'string' ? item.product.image : item.product.image.url;
                                    else if (item.product?.images?.[0]) safeThumb = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;

                                    return (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                <img src={safeThumb} alt="Product" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 truncate">{item.product?.name || 'Product Item'}</h4>
                                                <p className="text-xs font-medium text-slate-500">Qty: {item.qty}</p>
                                            </div>
                                            <div className="text-sm font-extrabold text-slate-900 whitespace-nowrap">
                                                ₹{((item.product?.price || 0) * item.qty).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-3 pb-6 border-b border-slate-100 text-sm font-medium text-slate-500">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-slate-900 font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="text-green-500 font-bold">Free</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Taxes</span>
                                    <span className="text-slate-900 font-bold">Calculated at payment</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <span className="text-lg font-extrabold text-slate-900">Total Due</span>
                                <span className="text-2xl font-black text-accent tracking-tight">₹{totalAmount.toLocaleString('en-IN')}</span>
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