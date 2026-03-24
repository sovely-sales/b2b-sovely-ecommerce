import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShoppingCart,
    Package,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    Truck,
    Minus,
    Plus,
    FileText,
    Ruler,
    Scale,
    Building2,
    ArrowLeft,
    Calculator,
    Receipt,
} from 'lucide-react';
import api from '../utils/api';
import { useCartStore } from '../store/cartStore';
import LoadingScreen from './LoadingScreen';

// --- ANIMATION VARIANTS ---
const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const ProductPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { addToCart, isLoading: isCartLoading } = useCartStore();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addToCartSuccess, setAddToCartSuccess] = useState(false);

    // B2B Order Intent State
    const [orderType, setOrderType] = useState('WHOLESALE');
    const [quantity, setQuantity] = useState(1);
    const [customSellingPrice, setCustomSellingPrice] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${productId}`);
                const data = res.data.data;
                setProduct(data);
                setQuantity(data.moq || 10);
                setCustomSellingPrice(data.suggestedRetailPrice || 0);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load product');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    if (isLoading) return <LoadingScreen />;
    if (error) return <div className="p-10 text-center font-bold text-red-500">{error}</div>;
    if (!product)
        return (
            <div className="p-10 text-center font-medium text-slate-500">Product not found.</div>
        );

    // --- Dynamic Pricing Logic ---
    let currentUnitCost = product.dropshipBasePrice;

    if (orderType === 'WHOLESALE' && product.tieredPricing?.length > 0) {
        const applicableTier = [...product.tieredPricing]
            .sort((a, b) => b.minQty - a.minQty)
            .find((tier) => quantity >= tier.minQty);
        if (applicableTier) currentUnitCost = applicableTier.pricePerUnit;
    }

    const estimatedTax = (currentUnitCost * product.gstSlab) / 100;
    const estimatedProfit =
        orderType === 'DROPSHIP'
            ? (customSellingPrice - (currentUnitCost + estimatedTax)) * quantity
            : 0;

    // --- Handlers ---
    const updateQuantity = (newQty) => {
        setAddToCartSuccess(false);
        if (newQty === '') {
            setQuantity('');
            return;
        }
        const parsed = Number(newQty);
        const minQty = product.moq || 1;
        const maxQty = product.inventory?.stock || 9999;

        if (parsed > maxQty) setQuantity(maxQty);
        else if (parsed < minQty) setQuantity(minQty);
        else setQuantity(parsed);
    };

    const handleAddToCart = async () => {
        setAddToCartSuccess(false);
        const finalQty = quantity === '' ? product.moq || 1 : quantity;

        const res = await addToCart(
            product._id,
            finalQty,
            orderType,
            orderType === 'DROPSHIP' ? customSellingPrice : 0
        );

        if (res.success) {
            setAddToCartSuccess(true);
            setTimeout(() => setAddToCartSuccess(false), 3000);
        }
    };

    return (
        <div className="mx-auto mb-20 max-w-7xl px-4 py-8 font-sans md:mb-0 md:py-10">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
                <ArrowLeft size={18} /> Back to Catalog
            </button>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12"
            >
                {/* LEFT COLUMN: Image & Specs */}
                <div className="space-y-6 lg:col-span-5">
                    {/* Main Image Frame */}
                    <motion.div
                        variants={fadeUp}
                        className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                        <img
                            src={product.images?.[0]?.url || 'https://via.placeholder.com/600'}
                            alt={product.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.isVerifiedSupplier !== false && (
                                <span className="flex items-center gap-1 rounded-md border border-blue-100 bg-white/90 px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm backdrop-blur-sm">
                                    <ShieldCheck size={14} /> Verified Vendor
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Hard Data / Spec Table */}
                    <motion.div
                        variants={fadeUp}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5">
                            <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Logistics & Specifications
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 px-5 py-2 text-sm">
                            <div className="flex justify-between py-3">
                                <span className="flex items-center gap-2 font-medium text-slate-500">
                                    <FileText size={16} /> HSN Code
                                </span>
                                <span className="font-bold text-slate-900">
                                    {product.hsnCode || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="flex items-center gap-2 font-medium text-slate-500">
                                    <Scale size={16} /> Weight
                                </span>
                                <span className="font-bold text-slate-900">
                                    {(product.weightGrams / 1000).toFixed(2)} kg
                                </span>
                            </div>
                            {product.dimensions && (
                                <div className="flex justify-between py-3">
                                    <span className="flex items-center gap-2 font-medium text-slate-500">
                                        <Ruler size={16} /> Dimensions
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {product.dimensions.length}x{product.dimensions.width}x
                                        {product.dimensions.height} cm
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between py-3">
                                <span className="flex items-center gap-2 font-medium text-slate-500">
                                    <Building2 size={16} /> Vendor
                                </span>
                                <span className="font-bold text-slate-900">{product.vendor}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: Action Center */}
                <div className="flex flex-col space-y-8 lg:col-span-7">
                    {/* Header & Badges */}
                    <motion.div variants={fadeUp} className="border-b border-slate-200 pb-6">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                SKU: {product.sku}
                            </span>
                            <span className="flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                                <Receipt size={14} /> GST: {product.gstSlab}% (ITC Active)
                            </span>
                            <span className="flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                <Truck size={14} /> Dispatch: {product.shippingDays} Days
                            </span>
                        </div>

                        <h1 className="text-3xl leading-tight font-extrabold text-slate-900 md:text-4xl">
                            {product.title}
                        </h1>

                        <div className="mt-4 flex items-center gap-4">
                            {product.inventory?.stock > 0 ? (
                                <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                                    <CheckCircle2 size={18} /> {product.inventory.stock} Units in
                                    Stock
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-sm font-bold text-red-600">
                                    <AlertCircle size={18} /> Out of Stock
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Order Intent Segmented Control */}
                    <motion.div
                        variants={fadeUp}
                        className="flex rounded-xl bg-slate-100 p-1.5 shadow-inner"
                    >
                        <button
                            onClick={() => {
                                setOrderType('WHOLESALE');
                                setQuantity(Math.max(10, product.moq || 10));
                                setAddToCartSuccess(false);
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${orderType === 'WHOLESALE' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Package size={18} /> Bulk Wholesale
                        </button>
                        <button
                            onClick={() => {
                                setOrderType('DROPSHIP');
                                setQuantity(1);
                                setAddToCartSuccess(false);
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${orderType === 'DROPSHIP' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <TrendingUp size={18} /> Direct Dropship
                        </button>
                    </motion.div>

                    {/* WHOLESALE COMMAND CENTER */}
                    {orderType === 'WHOLESALE' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6"
                        >
                            {/* Tiered Pricing Matrix */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold tracking-wider text-indigo-900/60 uppercase">
                                    Volume Pricing
                                </h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {product.tieredPricing?.length > 0 ? (
                                        product.tieredPricing.map((tier, idx) => {
                                            const isApplicable =
                                                quantity >= tier.minQty &&
                                                (!tier.maxQty || quantity <= tier.maxQty);
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex flex-col justify-center rounded-xl border p-4 transition-all ${isApplicable ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'border-indigo-100 bg-white text-slate-600'}`}
                                                >
                                                    <span className="mb-1 text-xs font-bold opacity-90">
                                                        {tier.minQty}
                                                        {tier.maxQty
                                                            ? ` - ${tier.maxQty}`
                                                            : '+'}{' '}
                                                        Units
                                                    </span>
                                                    <span className="text-xl font-extrabold">
                                                        ₹{tier.pricePerUnit.toLocaleString('en-IN')}{' '}
                                                        <span className="text-xs font-medium opacity-75">
                                                            / ea
                                                        </span>
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col rounded-xl border border-indigo-100 bg-white p-4 text-slate-600 sm:col-span-3">
                                            <span className="mb-1 text-xs font-bold opacity-80">
                                                Standard Wholesale Price
                                            </span>
                                            <span className="text-2xl font-extrabold text-slate-900">
                                                ₹
                                                {product.dropshipBasePrice?.toLocaleString('en-IN')}{' '}
                                                <span className="text-sm font-medium opacity-75">
                                                    / ea
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Execution Console */}
                            <div className="flex flex-col gap-6 rounded-xl border border-indigo-100 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
                                <div className="w-full lg:w-auto">
                                    <label className="mb-3 flex items-center justify-between text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        <span>Quantity (MOQ: {product.moq})</span>
                                    </label>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex w-fit items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        (quantity || 0) - (product.moq || 1)
                                                    )
                                                }
                                                className="rounded-md bg-white p-2 text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => updateQuantity(e.target.value)}
                                                onBlur={() => {
                                                    if (quantity === '')
                                                        updateQuantity(product.moq || 1);
                                                }}
                                                className="hide-arrows w-16 bg-transparent text-center text-lg font-extrabold text-slate-900 outline-none"
                                            />
                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        (quantity || 0) + (product.moq || 1)
                                                    )
                                                }
                                                className="rounded-md bg-white p-2 text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                product.moq || 10,
                                                (product.moq || 10) * 5,
                                                (product.moq || 10) * 10,
                                                (product.moq || 10) * 20,
                                            ].map((presetQty, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => updateQuantity(presetQty)}
                                                    className={`rounded border px-3 py-1 text-xs font-bold transition-all ${quantity === presetQty ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50'}`}
                                                >
                                                    {presetQty}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col items-start gap-4 border-t border-slate-100 pt-5 lg:w-auto lg:items-end lg:border-t-0 lg:pt-0">
                                    <div className="text-left lg:text-right">
                                        <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
                                            Subtotal (Excl. GST)
                                        </span>
                                        <span className="text-3xl font-black text-slate-900">
                                            ₹
                                            {(currentUnitCost * (quantity || 0)).toLocaleString(
                                                'en-IN'
                                            )}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={
                                            isCartLoading ||
                                            product.inventory?.stock <= 0 ||
                                            quantity < product.moq
                                        }
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold transition-all lg:w-auto ${addToCartSuccess ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-900 text-white shadow-md hover:bg-slate-800 disabled:opacity-50 disabled:shadow-none'}`}
                                    >
                                        {addToCartSuccess ? (
                                            <>
                                                <CheckCircle2 size={18} /> Added to Cart
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart size={18} /> Add to Bulk Cart
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* DROPSHIP COMMAND CENTER */}
                    {orderType === 'DROPSHIP' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6 rounded-2xl border border-amber-100 bg-amber-50/40 p-6"
                        >
                            <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900">
                                <Calculator size={18} /> Margin Configurator
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Your Cost (Inc. GST)
                                    </p>
                                    <p className="mt-1 text-xl font-extrabold text-slate-900">
                                        ₹
                                        {(product.dropshipBasePrice + estimatedTax).toLocaleString(
                                            'en-IN',
                                            { maximumFractionDigits: 0 }
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Market Retail Price
                                    </p>
                                    <p className="mt-1 text-xl font-extrabold text-slate-400 line-through">
                                        ₹{product.suggestedRetailPrice?.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                                <div className="w-full sm:w-1/2">
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-slate-600 uppercase">
                                        Customer Selling Price (₹)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold text-slate-400">
                                            ₹
                                        </span>
                                        <input
                                            type="number"
                                            value={customSellingPrice}
                                            onChange={(e) =>
                                                setCustomSellingPrice(Number(e.target.value))
                                            }
                                            className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-4 pl-10 text-xl font-bold shadow-sm transition-all outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                                <div
                                    className={`flex w-full flex-col justify-center rounded-xl p-4 shadow-sm transition-colors sm:w-1/2 ${estimatedProfit > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                                >
                                    <span className="text-xs font-bold tracking-wider uppercase opacity-90">
                                        Estimated Net Profit
                                    </span>
                                    <span className="text-3xl font-black">
                                        {estimatedProfit > 0 ? '+' : ''}₹
                                        {estimatedProfit.toLocaleString('en-IN', {
                                            maximumFractionDigits: 0,
                                        })}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={
                                    isCartLoading ||
                                    product.inventory?.stock <= 0 ||
                                    estimatedProfit < 0
                                }
                                className={`w-full rounded-xl py-4 text-sm font-bold text-white shadow-md transition-all ${addToCartSuccess ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:shadow-none'}`}
                            >
                                {addToCartSuccess
                                    ? 'Added to Dropship Cart'
                                    : 'Add to Dropship Cart'}
                            </button>
                        </motion.div>
                    )}

                    {/* PRODUCT DESCRIPTION */}
                    <motion.div
                        variants={fadeUp}
                        className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <h2 className="mb-4 border-b border-slate-100 pb-4 text-lg font-extrabold text-slate-900">
                            Supplier Overview & Specifications
                        </h2>
                        <div
                            className="b2b-description text-sm leading-relaxed text-slate-600 [&>h1]:mt-6 [&>h1]:mb-3 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-slate-900 [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-slate-900 [&>h3]:mt-5 [&>h3]:mb-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-slate-900 [&>h4]:mt-4 [&>h4]:mb-2 [&>h4]:text-sm [&>h4]:font-bold [&>h4]:text-slate-900 [&>p]:mb-4 [&>strong]:font-bold [&>strong]:text-slate-900 [&>ul]:mb-4 [&>ul]:ml-5 [&>ul]:list-outside [&>ul]:list-disc [&>ul>li]:mb-1.5 [&>ul>li]:pl-1"
                            dangerouslySetInnerHTML={{
                                __html:
                                    product.descriptionHTML ||
                                    '<p>No specific details provided by the manufacturer.</p>',
                            }}
                        />
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProductPage;
