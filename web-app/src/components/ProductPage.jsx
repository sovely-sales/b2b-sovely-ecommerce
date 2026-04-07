import StructuredDescription from './StructuredDescription';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart,
    Package,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Minus,
    Plus,
    ArrowLeft,
    Tag,
    Fingerprint,
    Scale,
    Maximize,
    ReceiptText,
} from 'lucide-react';
import api from '../utils/api';
import { calculateItemWeights, calculateSlabCharge } from '../utils/shippingMath';
import { useCartStore } from '../store/cartStore';
import AssignCustomerModal from './AssignCustomerModal';
import LoadingScreen from './LoadingScreen';

const MAX_DROPSHIP_SELLING_PRICE = 999999;

const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const sanitizeSellingPriceInput = (rawValue) => {
    const normalized = String(rawValue ?? '').trim();
    if (normalized.startsWith('-')) return '';
    const digitsOnly = normalized.replace(/\D/g, '');
    if (digitsOnly === '') return '';
    return String(Math.min(Number(digitsOnly), MAX_DROPSHIP_SELLING_PRICE));
};

const parseSellingPrice = (value) => {
    if (value === '' || value === undefined || value === null) return 0;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(Math.floor(parsed), MAX_DROPSHIP_SELLING_PRICE);
};

const ProductPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart, isLoading: isCartLoading } = useCartStore();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addToCartSuccess, setAddToCartSuccess] = useState(false);

    const [orderType, setOrderType] = useState('WHOLESALE');
    const [quantity, setQuantity] = useState(1);
    const [customSellingPriceInput, setCustomSellingPriceInput] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${productId}`);
                const data = res.data.data;
                setProduct(data);
                setQuantity(1);
                setCustomSellingPriceInput(
                    sanitizeSellingPriceInput(data.suggestedRetailPrice || 0)
                );
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load product');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    if (isLoading) return <LoadingScreen />;
    if (error)
        return (
            <div className="flex h-screen items-center justify-center font-bold text-red-500">
                {error}
            </div>
        );
    if (!product)
        return (
            <div className="flex h-screen items-center justify-center font-medium text-slate-500">
                Product not found.
            </div>
        );

    const currentUnitCost = product.dropshipBasePrice || 0;
    const customSellingPrice = parseSellingPrice(customSellingPriceInput);
    const estimatedTaxPerUnit = (currentUnitCost * (product.gstSlab || 0)) / 100;

    const weights = calculateItemWeights(product, quantity);
    const baseShipping = calculateSlabCharge(weights.billableWeight);
    const shippingGst = baseShipping * 0.18;
    const totalShipping = baseShipping + shippingGst;

    const totalCodFee = 41.3;

    const totalDropshipCost =
        (currentUnitCost + estimatedTaxPerUnit) * quantity + totalShipping + totalCodFee;
    const estimatedProfit =
        orderType === 'DROPSHIP' ? customSellingPrice * quantity - totalDropshipCost : 0;

    const updateQuantity = (newQty) => {
        setAddToCartSuccess(false);
        if (newQty === '') return setQuantity('');
        const parsed = Number(newQty);
        const maxQty = product.inventory?.stock || 9999;

        if (parsed > maxQty) setQuantity(maxQty);
        else if (parsed < 1) setQuantity(1);
        else setQuantity(parsed);
    };

    const handleAddToCartClick = () => {
        if (orderType === 'DROPSHIP') setIsAssignModalOpen(true);
        else executeAddToCart();
    };

    const executeAddToCart = async (customerDetails = null, saveToAddressBook = false) => {
        setAddToCartSuccess(false);
        const finalQty = quantity === '' ? 1 : quantity;

        const res = await addToCart(
            product._id,
            finalQty,
            orderType,
            orderType === 'DROPSHIP' ? customSellingPrice : 0,
            customerDetails,
            saveToAddressBook
        );

        if (res.success) {
            setAddToCartSuccess(true);
            setTimeout(() => setAddToCartSuccess(false), 3000);
            setIsAssignModalOpen(false);
        }
    };

    return (
        <div className="mx-auto mb-20 max-w-7xl px-4 py-8 font-sans md:mb-0 md:py-12">
            <button
                onClick={() => navigate(-1)}
                className="group mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-indigo-600"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-indigo-50">
                    <ArrowLeft size={16} />
                </span>
                Back to Catalog
            </button>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="grid grid-cols-1 gap-12 lg:grid-cols-12"
            >
                <div className="lg:col-span-5">
                    <motion.div
                        variants={fadeUp}
                        className="relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                    >
                        <img
                            src={
                                product.images?.[selectedImageIndex]?.url ||
                                'https://via.placeholder.com/600'
                            }
                            alt={product.title}
                            className="h-full w-full transform-gpu object-cover mix-blend-multiply"
                        />
                    </motion.div>

                    {product.images?.length > 1 && (
                        <motion.div variants={fadeUp} className="mt-4 flex flex-wrap gap-3">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                                        selectedImageIndex === idx
                                            ? 'border-indigo-600 p-0.5'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <div className="h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                        <img
                                            src={img.url}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="h-full w-full object-cover mix-blend-multiply"
                                        />
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>

                <div className="flex flex-col space-y-10 lg:col-span-7">
                    <motion.div variants={fadeUp}>
                        <div className="mb-4 flex items-center gap-3">
                            <span
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tracking-widest uppercase ring-1 ${
                                    product.inventory?.stock > 0
                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                        : 'bg-rose-50 text-rose-700 ring-rose-600/20'
                                }`}
                            >
                                {product.inventory?.stock > 0 ? (
                                    <>
                                        <CheckCircle2 size={14} /> In Stock (
                                        {product.inventory.stock})
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={14} /> Out of Stock
                                    </>
                                )}
                            </span>
                        </div>

                        <h1 className="mb-8 text-3xl leading-tight font-black text-slate-900 md:text-4xl">
                            {product.title}
                        </h1>

                        <div className="flex flex-wrap gap-2">
                            {product.vendor && product.vendor.toLowerCase() !== 'your brand' && (
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
                                    <Tag size={16} className="text-slate-400" />
                                    <span className="font-semibold text-slate-500">Brand:</span>
                                    <span className="font-black text-slate-900">
                                        {product.vendor}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
                                <Fingerprint size={16} className="text-slate-400" />
                                <span className="font-semibold text-slate-500">SKU:</span>
                                <span className="font-black text-slate-900">{product.sku}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
                                <Scale size={16} className="text-slate-400" />
                                <span className="font-semibold text-slate-500">Weight:</span>
                                <span className="font-black text-slate-900">
                                    {(product.weightGrams / 1000).toFixed(2)} kg
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
                                <Maximize size={16} className="text-slate-400" />
                                <span className="font-semibold text-slate-500">Dim:</span>
                                <span className="font-black text-slate-900">
                                    {product.dimensions
                                        ? `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height}cm`
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
                                <ReceiptText size={16} className="text-slate-400" />
                                <span className="font-semibold text-slate-500">HSN:</span>
                                <span className="font-black text-slate-900">
                                    {product.hsnCode || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8"
                    >
                        <div className="mb-8 flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tight text-slate-900">
                                ₹{currentUnitCost.toLocaleString('en-IN')}
                            </span>
                            <span className="text-sm font-bold text-slate-500">
                                / unit (+{product.gstSlab}% GST)
                            </span>
                        </div>

                        <div className="mb-8 flex rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                            <button
                                onClick={() => {
                                    setOrderType('WHOLESALE');
                                    setQuantity(1);
                                    setAddToCartSuccess(false);
                                }}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${orderType === 'WHOLESALE' ? 'bg-slate-100 text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Package size={16} /> Direct Wholesale
                            </button>
                            <button
                                onClick={() => {
                                    setOrderType('DROPSHIP');
                                    setQuantity(1);
                                    setCustomSellingPriceInput(
                                        sanitizeSellingPriceInput(product.suggestedRetailPrice || 0)
                                    );
                                    setAddToCartSuccess(false);
                                }}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${orderType === 'DROPSHIP' ? 'bg-slate-100 text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <TrendingUp size={16} /> Dropship Order
                            </button>
                        </div>

                        {orderType === 'WHOLESALE' && (
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm transition-shadow focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                                        <button
                                            onClick={() => updateQuantity((quantity || 1) - 1)}
                                            className="rounded-lg p-3 text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => updateQuantity(e.target.value)}
                                            onBlur={() => {
                                                if (quantity === '') updateQuantity(1);
                                            }}
                                            className="w-16 bg-transparent text-center text-xl font-black text-slate-900 outline-none"
                                        />
                                        <button
                                            onClick={() => updateQuantity((quantity || 1) + 1)}
                                            className="rounded-lg p-3 text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    {quantity > 1 && (
                                        <AnimatePresence>
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-right"
                                            >
                                                <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                    Total (Excl. GST)
                                                </div>
                                                <div className="text-2xl font-black text-slate-900">
                                                    ₹
                                                    {(currentUnitCost * quantity).toLocaleString(
                                                        'en-IN'
                                                    )}
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>
                                    )}
                                </div>

                                <button
                                    onClick={handleAddToCartClick}
                                    disabled={
                                        isCartLoading ||
                                        product.inventory?.stock <= 0 ||
                                        quantity < 1
                                    }
                                    className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-black text-white transition-all ${
                                        addToCartSuccess
                                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                                            : 'bg-indigo-600 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none'
                                    }`}
                                >
                                    {addToCartSuccess ? (
                                        <>
                                            <CheckCircle2 size={22} /> Added to Cart
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart size={22} /> Add to Cart
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {orderType === 'DROPSHIP' && (
                            <div className="flex flex-col gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">
                                        Number of Items
                                    </span>
                                    <div className="flex w-fit items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm transition-shadow focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                                        <button
                                            onClick={() => updateQuantity((quantity || 1) - 1)}
                                            className="rounded-lg p-3 text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => updateQuantity(e.target.value)}
                                            onBlur={() => {
                                                if (quantity === '') updateQuantity(1);
                                            }}
                                            className="w-16 bg-transparent text-center text-xl font-black text-slate-900 outline-none"
                                        />
                                        <button
                                            onClick={() => updateQuantity((quantity || 1) + 1)}
                                            className="rounded-lg p-3 text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-8 border-t border-slate-200/60 pt-6 sm:grid-cols-2">
                                    <div>
                                        <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            Your Buying Price (Total)
                                        </p>
                                        <p className="text-3xl font-black text-slate-900">
                                            ₹
                                            {totalDropshipCost.toLocaleString('en-IN', {
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                        <p className="mt-1 text-[11px] font-bold text-slate-400">
                                            Includes GST, Slab Freight & COD
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                            Customer Selling Price (Per Unit)
                                        </p>
                                        <div className="relative">
                                            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold text-slate-400">
                                                ₹
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={customSellingPriceInput}
                                                onChange={(e) => {
                                                    setAddToCartSuccess(false);
                                                    setCustomSellingPriceInput(
                                                        sanitizeSellingPriceInput(e.target.value)
                                                    );
                                                }}
                                                onBlur={() =>
                                                    setCustomSellingPriceInput((prev) =>
                                                        prev === ''
                                                            ? '0'
                                                            : sanitizeSellingPriceInput(prev)
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (['-', '+', 'e', 'E', '.'].includes(e.key))
                                                        e.preventDefault();
                                                }}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-4 pl-10 text-2xl font-black text-slate-900 shadow-sm transition-all outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6 border-t border-slate-200/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold tracking-wider text-slate-500 uppercase">
                                            Estimated Net Profit
                                        </span>
                                        <span
                                            className={`mt-1 text-4xl font-black break-all ${estimatedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                                        >
                                            {estimatedProfit >= 0 ? '+' : '-'}₹
                                            {Math.abs(estimatedProfit).toLocaleString('en-IN', {
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleAddToCartClick}
                                        disabled={
                                            isCartLoading ||
                                            product.inventory?.stock <= 0 ||
                                            quantity < 1
                                        }
                                        className={`w-full rounded-2xl px-8 py-5 text-lg font-black text-white shadow-md transition-all sm:w-auto ${
                                            addToCartSuccess
                                                ? 'bg-emerald-500 shadow-emerald-500/30'
                                                : 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none'
                                        }`}
                                    >
                                        {addToCartSuccess
                                            ? 'Added to Dropship Cart'
                                            : 'Confirm Dropship Order'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="flex border-b border-slate-200 bg-slate-50 p-2">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`rounded-xl px-6 py-2.5 text-sm font-black transition-colors ${activeTab === 'description' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Product Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('policies')}
                                className={`rounded-xl px-6 py-2.5 text-sm font-black transition-colors ${activeTab === 'policies' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Policies
                            </button>
                        </div>
                        <div className="p-6 sm:p-8">
                            {activeTab === 'description' && (
                                <StructuredDescription htmlContent={product.descriptionHTML} />
                            )}
                            {activeTab === 'policies' && (
                                <div className="space-y-8 text-sm text-slate-600">
                                    <div>
                                        <h4 className="mb-2 flex items-center gap-2 font-black text-slate-900">
                                            <CheckCircle2 size={18} className="text-emerald-500" />{' '}
                                            Return Policy
                                        </h4>
                                        <p className="leading-relaxed">
                                            {product.returnPolicy === 'NO_RETURNS' &&
                                                'This item is strictly non-returnable unless damaged upon arrival.'}
                                            {product.returnPolicy === '7_DAYS_REPLACEMENT' &&
                                                '7-day replacement guarantee available for defective or damaged items.'}
                                            {product.returnPolicy === '7_DAYS_RETURN' &&
                                                'Eligible for returns within 7 days of delivery.'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 flex items-center gap-2 font-black text-slate-900">
                                            <Package size={18} className="text-indigo-500" /> Order
                                            Information
                                        </h4>
                                        <p className="leading-relaxed">
                                            There is no minimum order quantity (MOQ) for this
                                            product. You may purchase individual units for both
                                            wholesale and dropship orders.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isAssignModalOpen && (
                    <AssignCustomerModal
                        isOpen={true}
                        onClose={() => setIsAssignModalOpen(false)}
                        onAssign={async (customerData, saveToAddressBook) => {
                            await executeAddToCart(customerData, saveToAddressBook);
                            return true;
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductPage;
