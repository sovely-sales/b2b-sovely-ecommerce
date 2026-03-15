import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CreditCard, Wallet, Landmark, Package, Smartphone } from 'lucide-react';
import axios from 'axios';
import './Auth.css';
import Navbar from './Navbar';
import Footer from './Footer';

// CRITICAL FIX: Use relative path for Vite Proxy
const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true
});

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

    const [paymentMethod, setPaymentMethod] = useState('UPI'); 
    const [paymentTerms, setPaymentTerms] = useState('DUE_ON_RECEIPT');
    const [loading, setLoading] = useState(false);

    // ... (Keep the empty cart UI check here) ...
    if (!items || items.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fafafa' }}>
                <Navbar />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <Package size={48} color="#94a3b8" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '8px' }}>Your Cart is Empty</h2>
                        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', borderRadius: '8px', background: '#1b4332', color: '#fff' }}>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const totalAmount = items.reduce((acc, item) => {
        const priceRaw = item.product?.price;
        const priceStr = typeof priceRaw === 'number' ? priceRaw.toString() : (priceRaw || "0");
        const numeric = parseFloat(priceStr.replace(/[^0-9.-]+/g, "")) || 0;
        return acc + (numeric * item.qty);
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
                navigate('/orders', { state: { successMessage: `Order placed! ID: ${order.orderId}` } });
                return;
            }

            const res = await loadRazorpayScript();
            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                setLoading(false);
                return;
            }

            const rzpOrderRes = await api.post('/payments/create-order', { amount: totalAmount });
            const rzpOrder = rzpOrderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy', 
                // CRITICAL FIX: Ensure the amount passed to Razorpay is what the backend generated (in paise)
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
                    color: "#1b4332"
                }
            };

            const paymentObject = new window.Razorpay(options); // Fixed missing instantiation
            paymentObject.open();

        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process checkout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fafafa' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#64748b', marginBottom: '32px', fontWeight: '500' }}>
                    <ArrowLeft size={18} /> Back to Shopping
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '40px', alignItems: 'start' }}>

                    {/* Left Column: Form Settings */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '24px', fontWeight: '600' }}>Payment Method</h2>

                        <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                                border: `1px solid ${paymentMethod === method.id ? '#1b4332' : '#e2e8f0'}`,
                                                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease',
                                                backgroundColor: paymentMethod === method.id ? '#f0fdf4' : '#fff'
                                            }}
                                        >
                                            <method.icon size={20} color={paymentMethod === method.id ? '#1b4332' : '#64748b'} />
                                            <span style={{ fontWeight: '500', color: paymentMethod === method.id ? '#1b4332' : '#0f172a' }}>{method.label}</span>
                                            {paymentMethod === method.id && <CheckCircle size={18} color="#1b4332" style={{ marginLeft: 'auto' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {paymentMethod === 'BANK_TRANSFER' && (
                                <div style={{ padding: '20px', background: '#f8fafc', borderLeft: '4px solid #1b4332', borderRadius: '4px 8px 8px 4px', fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
                                    <strong style={{ color: '#0f172a', display: 'block', marginBottom: '8px' }}>Manual Transfer Required</strong>
                                    Please transfer exactly <b style={{ color: '#1b4332' }}>₹{totalAmount.toLocaleString('en-IN')}</b> to the following account:<br /><br />
                                    Bank: <b>Sovely National Bank</b><br />
                                    Account: <b>1234 5678 9012 3456</b><br />
                                    IFSC: <b>SOVE0001234</b>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: '#1b4332', color: '#fff', padding: '16px', borderRadius: '8px',
                                    fontSize: '1rem', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.8 : 1, marginTop: '16px'
                                }}
                            >
                                {loading ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Order Summary (Simplified for brevity, keeps your old logic) */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '24px', fontWeight: '600' }}>Order Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #cbd5e1', fontSize: '1.25rem', fontWeight: '700', color: '#1b4332' }}>
                            <span>Total Due</span>
                            <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default Checkout;