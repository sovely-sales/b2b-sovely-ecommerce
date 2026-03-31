import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import {
    ArrowLeft,
    Package,
    MapPin,
    Wallet,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    ShoppingCart,
    Lock,
    Building2,
    Truck,
    Receipt,
    ChevronRight,
} from 'lucide-react';
import api from '../utils/api.js';
import { useCartStore } from '../store/cartStore';
import { AuthContext } from '../AuthContext';
import LoadingScreen from './LoadingScreen';

const dropshipCustomerSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'),
    street: z.string().trim().min(5, 'Please provide a complete street address'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().min(2, 'State is required'),
    zip: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
});

const Checkout = () => {
    const navigate = useNavigate();
    const { user, isKycApproved, refreshUser } = useContext(AuthContext);
    const { cart, fetchCart, clearCartState } = useCartStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [fieldErrors, setFieldErrors] = useState({});
    const [idempotencyKey] = useState(() => crypto.randomUUID());

    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
    });

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const handleInputChange = (field, value) => {
        setCustomer((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handlePinCodeChange = async (e) => {
        const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCustomer((prev) => ({ ...prev, zip: pin }));

        if (pin.length === 6) {
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
                const data = await response.json();

                if (data && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    setCustomer((prev) => ({
                        ...prev,
                        city: postOffice.District,
                        state: postOffice.State,
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch PIN code details', err);
            }
        }
    };

    
    const hasDropship = cart?.items?.some((item) => item.orderType === 'DROPSHIP') || false;
    const hasWholesale = cart?.items?.some((item) => item.orderType === 'WHOLESALE') || false;
    const codFee = hasDropship && paymentMethod === 'COD' ? 35 : 0;
    const finalGrandTotal = (cart?.grandTotalPlatformCost || 0) + codFee;
    const isWalletSufficient = (user?.walletBalance || 0) >= finalGrandTotal;
    const projectedBalance = (user?.walletBalance || 0) - finalGrandTotal;

    const handleJustInTimeTopUp = async (e) => {
        e.preventDefault();
        if (!projectedBalance || projectedBalance >= 0) return;

        setLoading(true);
        setError('');

        try {
            const topUpAmount = Math.abs(projectedBalance);
            const invoiceRes = await api.post('/wallet/topup', { amount: topUpAmount });
            const invoiceId = invoiceRes.data.data._id;

            const rzpOrderRes = await api.post('/payment/create-order', { invoiceId });
            const { razorpayOrder } = rzpOrderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy',
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Sovely B2B',
                description: 'Wallet Top-Up for Order',
                order_id: razorpayOrder.id,
                handler: async function (response) {
                    try {
                        await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            invoiceId: invoiceId,
                        });
                        await refreshUser();
                        handlePlaceOrder(e);
                    } catch (verifyErr) {
                        setError('Payment verification failed. Please check your wallet.');
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || '',
                },
                theme: { color: '#0f172a' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError(response.error.description);
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initialize payment gateway.');
            setLoading(false);
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setError('');

        if (!isWalletSufficient) {
            setError('Insufficient wallet balance. Please pay the difference to proceed.');
            return;
        }

        setFieldErrors({});

        if (hasDropship) {
            const validationResult = dropshipCustomerSchema.safeParse(customer);

            if (!validationResult.success) {
                const formattedErrors = validationResult.error.format();
                const extractedErrors = {};

                if (formattedErrors.name) extractedErrors.name = formattedErrors.name._errors[0];
                if (formattedErrors.phone) extractedErrors.phone = formattedErrors.phone._errors[0];
                if (formattedErrors.street)
                    extractedErrors.street = formattedErrors.street._errors[0];
                if (formattedErrors.city) extractedErrors.city = formattedErrors.city._errors[0];
                if (formattedErrors.state) extractedErrors.state = formattedErrors.state._errors[0];
                if (formattedErrors.zip) extractedErrors.zip = formattedErrors.zip._errors[0];

                setFieldErrors(extractedErrors);
                setError('Please fix the highlighted errors in the dispatch details.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        setLoading(true);

        try {
            const payload = {
                paymentMethod: hasDropship ? paymentMethod : 'PREPAID_WALLET',
                endCustomerDetails: hasDropship
                    ? {
                          name: customer.name,
                          phone: customer.phone,
                          address: {
                              street: customer.street,
                              city: customer.city,
                              state: customer.state,
                              zip: customer.zip,
                          },
                      }
                    : null,
            };

            const res = await api.post('/orders', payload, {
                headers: { 'x-idempotency-key': idempotencyKey },
            });

            clearCartState();
            refreshUser();

            const createdOrders = res.data.data;
            const generatedIds = createdOrders.map((order) => order.orderId).join(', ');

            navigate('/orders', {
                state: { successMessage: `Procurement successful! Ref IDs: ${generatedIds}` },
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    
    if (!cart) return <LoadingScreen />;

    if (user?.accountType === 'B2B' && !isKycApproved) {
        return (
            <main className="mx-auto w-full max-w-3xl px-4 py-20 font-sans sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xl shadow-slate-200/50">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="mb-3 text-3xl font-extrabold text-slate-900">Checkout Locked</h2>
                    <p className="mx-auto mb-8 max-w-md text-base text-slate-500">
                        Your business KYC is currently pending review. You cannot proceed to
                        checkout until our team verifies your account details.
                    </p>
                    <Link
                        to="/kyc"
                        className="rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-md transition-all hover:bg-slate-800"
                    >
                        Review KYC Status
                    </Link>
                </div>
            </main>
        );
    }

    if (cart.items?.length === 0) {
        return (
            <div className="flex min-h-[70vh] flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                        <Package size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="mb-2 text-2xl font-extrabold text-slate-900">Cart is Empty</h2>
                    <p className="mb-8 font-medium text-slate-500">
                        Add wholesale items or queue dropship products to proceed.
                    </p>
                    <Link
                        to="/"
                        className="block w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-md transition-all hover:bg-slate-800"
                    >
                        Browse Catalog
                    </Link>
                </div>
            </div>
        );
    }

    
    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 pb-24 font-sans text-slate-900 sm:px-6 lg:px-8">
            {}
            <div className="mb-8 sm:mb-10">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
                >
                    <ArrowLeft size={18} /> Back to Cart
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Secure Checkout
                    </h1>
                    <Lock className="text-emerald-500" size={24} />
                </div>
                <p className="mt-2 text-base text-slate-500">
                    Review your logistics, confirm payment details, and authorize procurement.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 xl:gap-12">
                {}
                <div className="space-y-6 lg:col-span-7 xl:col-span-8">
                    {error && (
                        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
                            <AlertCircle size={20} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {hasDropship && hasWholesale && (
                        <div className="flex items-start gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                            <div className="shrink-0 rounded-full bg-indigo-100 p-2 text-indigo-600">
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-indigo-900">Mixed Order Detected</h3>
                                <p className="mt-1 text-sm text-indigo-700">
                                    Wholesale items will ship to your registered HQ. Dropship items
                                    require the end-customer address below.
                                </p>
                            </div>
                        </div>
                    )}

                    {}
                    {hasWholesale && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Building2 size={20} className="text-slate-500" />
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Standard B2B Delivery
                                    </h2>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50 p-5">
                                    <div>
                                        <p className="font-bold text-slate-900">
                                            {user?.companyName || 'Verified Business Entity'}
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                            {user?.companyAddress ||
                                                'Address securely stored via KYC.'}
                                        </p>
                                        {user?.gstin && (
                                            <p className="mt-3 inline-block rounded border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-500 uppercase">
                                                GSTIN: {user.gstin}
                                            </p>
                                        )}
                                    </div>
                                    <div
                                        className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
                                        title="Locked via KYC"
                                    >
                                        <Lock size={14} /> Verified
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {}
                    {hasDropship && (
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Dropship Dispatch Details
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            Enter the end-customer's delivery address
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase">
                                            Customer Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={customer.name}
                                            placeholder="John Doe"
                                            onChange={(e) =>
                                                handleInputChange('name', e.target.value)
                                            }
                                            className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900 transition-all outline-none focus:ring-2 ${
                                                fieldErrors.name
                                                    ? 'border-red-300 bg-red-50 focus:ring-red-200'
                                                    : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-100'
                                            }`}
                                        />
                                        {fieldErrors.name && (
                                            <p className="text-xs font-semibold text-red-500">
                                                {fieldErrors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={customer.phone}
                                            placeholder="9876543210"
                                            onChange={(e) =>
                                                setCustomer({
                                                    ...customer,
                                                    phone: e.target.value.replace(/\D/g, ''),
                                                })
                                            }
                                            maxLength="10"
                                            className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900 transition-all outline-none focus:ring-2 ${
                                                fieldErrors.phone
                                                    ? 'border-red-300 bg-red-50 focus:ring-red-200'
                                                    : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-100'
                                            }`}
                                        />
                                        {fieldErrors.phone && (
                                            <p className="text-xs font-semibold text-red-500">
                                                {fieldErrors.phone}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase">
                                            Street Address *
                                        </label>
                                        <input
                                            type="text"
                                            value={customer.street}
                                            placeholder="House No, Building, Street Area"
                                            onChange={(e) =>
                                                handleInputChange('street', e.target.value)
                                            }
                                            className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900 transition-all outline-none focus:ring-2 ${
                                                fieldErrors.street
                                                    ? 'border-red-300 bg-red-50 focus:ring-red-200'
                                                    : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-100'
                                            }`}
                                        />
                                        {fieldErrors.street && (
                                            <p className="text-xs font-semibold text-red-500">
                                                {fieldErrors.street}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase">
                                            PIN Code *
                                        </label>
                                        <input
                                            type="text"
                                            value={customer.zip}
                                            placeholder="6-Digit PIN"
                                            onChange={handlePinCodeChange}
                                            maxLength="6"
                                            className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900 transition-all outline-none focus:ring-2 ${
                                                fieldErrors.zip
                                                    ? 'border-red-300 bg-red-50 focus:ring-red-200'
                                                    : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-100'
                                            }`}
                                        />
                                        {fieldErrors.zip && (
                                            <p className="text-xs font-semibold text-red-500">
                                                {fieldErrors.zip}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600 uppercase">
                                                City *
                                            </label>
                                            <input
                                                type="text"
                                                value={customer.city}
                                                onChange={(e) =>
                                                    handleInputChange('city', e.target.value)
                                                }
                                                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900 transition-all outline-none focus:ring-2 ${
                                                    fieldErrors.city
                                                        ? 'border-red-300 bg-red-50 focus:ring-red-200'
                                                        : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-100'
                                                }`}
                                            />
                                            {fieldErrors.city && (
                                                <p className="text-xs font-semibold text-red-500">
                                                    {fieldErrors.city}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-600 uppercase">
                                                State *
                                            </label>
                                            <input
                                                type="text"
                                                value={customer.state}
                                                onChange={(e) =>
                                                    handleInputChange('state', e.target.value)
                                                }
                                                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900 transition-all outline-none focus:ring-2 ${
                                                    fieldErrors.state
                                                        ? 'border-red-300 bg-red-50 focus:ring-red-200'
                                                        : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-100'
                                                }`}
                                            />
                                            {fieldErrors.state && (
                                                <p className="text-xs font-semibold text-red-500">
                                                    {fieldErrors.state}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-slate-100 pt-8">
                                    <h3 className="mb-4 text-sm font-bold text-slate-900">
                                        Payment Collection Method
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <button
                                            onClick={() => setPaymentMethod('COD')}
                                            className={`relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
                                                paymentMethod === 'COD'
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="mb-2 flex w-full items-center justify-between">
                                                <span
                                                    className={`font-bold ${paymentMethod === 'COD' ? 'text-amber-900' : 'text-slate-700'}`}
                                                >
                                                    Cash on Delivery
                                                </span>
                                                <div
                                                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === 'COD' ? 'border-amber-500' : 'border-slate-300'}`}
                                                >
                                                    {paymentMethod === 'COD' && (
                                                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                Courier collects total selling price from customer.
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => setPaymentMethod('PREPAID_GATEWAY')}
                                            className={`relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
                                                paymentMethod === 'PREPAID_GATEWAY'
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="mb-2 flex w-full items-center justify-between">
                                                <span
                                                    className={`font-bold ${paymentMethod === 'PREPAID_GATEWAY' ? 'text-amber-900' : 'text-slate-700'}`}
                                                >
                                                    Prepaid Order
                                                </span>
                                                <div
                                                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === 'PREPAID_GATEWAY' ? 'border-amber-500' : 'border-slate-300'}`}
                                                >
                                                    {paymentMethod === 'PREPAID_GATEWAY' && (
                                                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                You collected payment directly. Dispatch item only.
                                            </span>
                                        </button>
                                    </div>

                                    {paymentMethod === 'COD' && (
                                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                                            <CheckCircle2
                                                size={18}
                                                className="mt-0.5 shrink-0 text-emerald-600"
                                            />
                                            <p>
                                                Profit margins will be credited to your wallet 48
                                                hours post-delivery.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Summary & Payment */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <div className="sticky top-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
                        {/* Summary Header */}
                        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                            <h3 className="flex items-center justify-between text-lg font-extrabold text-slate-900">
                                <span className="flex items-center gap-2">
                                    <Receipt size={20} className="text-slate-400" /> Order Summary
                                </span>
                                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                                    {cart.items.length} Items
                                </span>
                            </h3>
                        </div>

                        <div className="p-6">
                            {/* ITEM LIST */}
                            <div className="custom-scrollbar mb-6 max-h-[300px] space-y-4 overflow-y-auto pr-2">
                                {cart.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                                    >
                                        <div className="relative shrink-0">
                                            <img
                                                src={
                                                    item.productId?.images?.[0]?.url ||
                                                    'https://via.placeholder.com/64'
                                                }
                                                alt=""
                                                className="h-16 w-16 rounded-lg border border-slate-100 bg-slate-50 object-cover"
                                            />
                                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white shadow-sm">
                                                {item.qty}
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                                            <div className="mb-1 flex items-start gap-2">
                                                <h4 className="line-clamp-2 text-sm leading-tight font-bold text-slate-900">
                                                    {item.productId?.title}
                                                </h4>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase shadow-sm ${item.orderType === 'DROPSHIP' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}
                                                >
                                                    {item.orderType === 'DROPSHIP'
                                                        ? 'Dropship'
                                                        : 'B2B Bulk'}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-500">
                                                    ₹
                                                    {item.platformUnitCost?.toLocaleString('en-IN')}{' '}
                                                    /ea
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-xs text-slate-500">
                                                    {item.shippingCost > 0
                                                        ? `+ ₹${item.shippingCost?.toLocaleString('en-IN')} Freight`
                                                        : 'Free Freight'}
                                                </span>
                                                <span className="text-sm font-extrabold text-slate-900">
                                                    ₹
                                                    {item.totalItemPlatformCost?.toLocaleString(
                                                        'en-IN'
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {}
                            <div className="mb-6 space-y-3 rounded-xl bg-slate-50 p-5 text-sm">
                                <div className="flex justify-between font-medium text-slate-600">
                                    <span>Platform Subtotal</span>
                                    <span className="text-slate-900">
                                        ₹
                                        {cart.subTotalPlatformCost?.toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                {}
                                {cart.totalShippingCost > 0 ? (
                                    <>
                                        <div className="flex justify-between font-medium text-slate-600">
                                            <span>Delivery Charge</span>
                                            <span className="text-slate-900">
                                                + ₹
                                                {cart.totalDeliveryCharge?.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                }) || '0.00'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-medium text-slate-600">
                                            <span>Packing & Handling</span>
                                            <span className="text-slate-900">
                                                + ₹
                                                {cart.totalPackingCharge?.toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                }) || '0.00'}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between font-medium text-emerald-600">
                                        <span>Delivery & Packing</span>
                                        <span>₹0.00 (Free)</span>
                                    </div>
                                )}

                                {codFee > 0 && (
                                    <div className="flex justify-between font-medium text-amber-600">
                                        <span>COD Collection Fee</span>
                                        <span>
                                            + ₹
                                            {codFee.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between font-medium text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        GST (ITC Claimable)
                                    </span>
                                    <span className="text-slate-900">
                                        + ₹
                                        {cart.totalTax?.toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-300 pt-3">
                                    <span className="font-extrabold text-slate-900">
                                        Total Payable
                                    </span>
                                    <span className="text-2xl font-black tracking-tight text-slate-900">
                                        ₹
                                        {finalGrandTotal?.toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>

                            {}
                            {cart.totalShippingCost > 0 && (
                                <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                                    <h4 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-indigo-900 uppercase">
                                        <Truck size={16} /> Freight Calculation
                                    </h4>
                                    <div className="space-y-1.5 text-xs font-medium text-indigo-700/80">
                                        <div className="flex justify-between">
                                            <span>Actual Weight:</span>
                                            <span>{cart.totalActualWeight || 0} kg</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Volumetric Weight:</span>
                                            <span>
                                                {(cart.totalVolumetricWeight || 0).toFixed(2)} kg
                                            </span>
                                        </div>
                                        <div className="mt-1.5 flex justify-between border-t border-indigo-200/60 pt-1.5 font-bold text-indigo-900">
                                            <span>Billable ({cart.weightType}):</span>
                                            <span>{cart.totalBillableWeight || 0} kg</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {}
                            {cart.totalExpectedProfit > 0 && paymentMethod === 'COD' && (
                                <div className="mb-6 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-md">
                                    <span className="flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                                        <TrendingUp size={18} /> Expected Margin
                                    </span>
                                    <span className="text-xl font-black">
                                        + ₹
                                        {cart.totalExpectedProfit?.toLocaleString('en-IN', {
                                            minimumFractionDigits: 0,
                                        })}
                                    </span>
                                </div>
                            )}

                            {}
                            <div className="mb-6">
                                <div
                                    className={`rounded-xl border-2 p-4 transition-colors ${isWalletSufficient ? 'border-emerald-100 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wallet
                                                size={18}
                                                className={
                                                    isWalletSufficient
                                                        ? 'text-emerald-600'
                                                        : 'text-amber-600'
                                                }
                                            />
                                            <span
                                                className={`font-bold ${isWalletSufficient ? 'text-emerald-900' : 'text-amber-900'}`}
                                            >
                                                Wallet Balance
                                            </span>
                                        </div>
                                        <span
                                            className={`font-black ${isWalletSufficient ? 'text-emerald-700' : 'text-amber-700'}`}
                                        >
                                            ₹{user?.walletBalance?.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    {!isWalletSufficient && (
                                        <div className="mt-1 border-t border-amber-200/60 pt-3">
                                            <div className="flex justify-between text-sm font-bold text-amber-800">
                                                <span>Required Top-up:</span>
                                                <span>
                                                    ₹
                                                    {Math.abs(projectedBalance).toLocaleString(
                                                        'en-IN',
                                                        { minimumFractionDigits: 2 }
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={
                                    isWalletSufficient ? handlePlaceOrder : handleJustInTimeTopUp
                                }
                                disabled={loading || isKycApproved === false}
                                className={`group flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-extrabold tracking-widest text-white uppercase shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                    isWalletSufficient
                                        ? 'bg-slate-900 hover:-translate-y-0.5 hover:bg-slate-800'
                                        : 'bg-indigo-600 hover:-translate-y-0.5 hover:bg-indigo-700'
                                }`}
                            >
                                {loading ? (
                                    'Processing...'
                                ) : isWalletSufficient ? (
                                    <>
                                        Authorize Order{' '}
                                        <ChevronRight
                                            size={18}
                                            className="transition-transform group-hover:translate-x-1"
                                        />
                                    </>
                                ) : (
                                    'Top-Up & Place Order'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Checkout;
