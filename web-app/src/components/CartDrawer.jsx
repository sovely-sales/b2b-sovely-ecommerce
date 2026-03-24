import React, { useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Trash2,
    Package,
    ShoppingCart,
    TrendingUp,
    AlertCircle,
    Minus,
    Plus,
    ShieldCheck,
    CheckCircle,
    Lock,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { AuthContext } from '../AuthContext';

// --- ANIMATION VARIANTS ---
const drawerVariants = {
    hidden: { x: '100%', transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' } },
    visible: { x: 0, transition: { type: 'tween', duration: 0.3, ease: 'easeInOut' } },
};

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const staggerList = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
};

// Helper to determine if adding more units unlocks a better price
const getTierNudge = (currentQty, tieredPricing) => {
    if (!tieredPricing || tieredPricing.length === 0) return null;
    const sortedTiers = [...tieredPricing].sort((a, b) => a.minQty - b.minQty);
    const nextTier = sortedTiers.find((tier) => tier.minQty > currentQty);
    if (nextTier) {
        return {
            unitsNeeded: nextTier.minQty - currentQty,
            newPrice: nextTier.pricePerUnit,
            targetQty: nextTier.minQty,
        };
    }
    return null;
};

const CartDrawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { cart, isLoading, fetchCart, updateCartItem, removeFromCart, getCartCount } =
        useCartStore();
    const { user, isKycApproved } = useContext(AuthContext);

    useEffect(() => {
        if (isOpen) fetchCart();
    }, [isOpen, fetchCart]);

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    const hasDropshipItems = cart?.items?.some((i) => i.orderType === 'DROPSHIP');
    const hasWholesaleItems = cart?.items?.some((i) => i.orderType === 'WHOLESALE');
    const isB2BPending = user?.accountType === 'B2B' && !isKycApproved;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end font-sans">
                    {/* Dark Overlay */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* The Drawer */}
                    <motion.div
                        variants={drawerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="relative flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                    <ShoppingCart size={20} className="text-slate-700" />{' '}
                                    Procurement Cart
                                </h2>
                                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                    {getCartCount()} {getCartCount() === 1 ? 'Item' : 'Items'}{' '}
                                    Selected
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full bg-slate-50 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* CART ITEMS LIST */}
                        <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50 p-4">
                            {isLoading && !cart ? (
                                <div className="flex h-full flex-col items-center justify-center space-y-3 text-slate-400">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600"></div>
                                    <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Loading Data...
                                    </p>
                                </div>
                            ) : cart?.items?.length > 0 ? (
                                <motion.div
                                    variants={staggerList}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-3"
                                >
                                    <AnimatePresence>
                                        {cart.items.map((item) => {
                                            const nudge = getTierNudge(
                                                item.qty,
                                                item.productId?.tieredPricing
                                            );
                                            const isDropship = item.orderType === 'DROPSHIP';

                                            return (
                                                <motion.div
                                                    layout
                                                    variants={itemVariants}
                                                    key={item.productId?._id}
                                                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                                                >
                                                    {/* Top Row: Identifiers */}
                                                    <div className="flex gap-3 p-3">
                                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                                            <img
                                                                src={
                                                                    item.productId?.images?.[0]
                                                                        ?.url ||
                                                                    'https://via.placeholder.com/80'
                                                                }
                                                                alt={item.productId?.title}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex flex-1 flex-col justify-between">
                                                            <div className="flex items-start justify-between">
                                                                <div className="pr-2">
                                                                    <Link
                                                                        to={`/product/${item.productId?._id}`}
                                                                        onClick={onClose}
                                                                        className="line-clamp-1 text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600"
                                                                    >
                                                                        {item.productId?.title ||
                                                                            'Unknown Product'}
                                                                    </Link>
                                                                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                                        SKU: {item.productId?.sku}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() =>
                                                                        removeFromCart(
                                                                            item.productId?._id
                                                                        )
                                                                    }
                                                                    className="text-slate-400 transition-colors hover:text-red-500"
                                                                    title="Remove Item"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                {isDropship ? (
                                                                    <span className="flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                                                        <Package size={12} />{' '}
                                                                        Dropship
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                                                        <ShoppingCart size={12} />{' '}
                                                                        Wholesale
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Middle Row: Financials & Quantity */}
                                                    <div className="flex items-end justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                                                        <div className="flex flex-col gap-2">
                                                            <span className="text-xs font-semibold text-slate-600">
                                                                ₹
                                                                {item.platformUnitCost?.toLocaleString(
                                                                    'en-IN'
                                                                )}{' '}
                                                                <span className="opacity-75">
                                                                    / unit
                                                                </span>
                                                            </span>

                                                            {/* Quantity Adjuster */}
                                                            <div className="flex w-fit items-center rounded-md border border-slate-300 bg-white">
                                                                <button
                                                                    onClick={() =>
                                                                        updateCartItem(
                                                                            item.productId?._id,
                                                                            item.qty -
                                                                                (isDropship
                                                                                    ? 1
                                                                                    : item.productId
                                                                                          ?.moq)
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        item.qty <=
                                                                            (isDropship
                                                                                ? 1
                                                                                : item.productId
                                                                                      ?.moq) ||
                                                                        isLoading
                                                                    }
                                                                    className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <span className="flex min-w-[2rem] items-center justify-center border-x border-slate-200 px-2 text-xs font-bold text-slate-900">
                                                                    {item.qty}
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        updateCartItem(
                                                                            item.productId?._id,
                                                                            item.qty +
                                                                                (isDropship
                                                                                    ? 1
                                                                                    : item.productId
                                                                                          ?.moq)
                                                                        )
                                                                    }
                                                                    disabled={isLoading}
                                                                    className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            {isDropship ? (
                                                                <div className="flex flex-col items-end gap-0.5">
                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                        Est. Margin
                                                                    </span>
                                                                    <span className="text-sm font-bold text-emerald-600">
                                                                        +₹
                                                                        {item.expectedProfit?.toLocaleString(
                                                                            'en-IN'
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-end gap-0.5">
                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                        Subtotal
                                                                    </span>
                                                                    <span className="text-sm font-bold text-slate-900">
                                                                        ₹
                                                                        {(
                                                                            item.platformUnitCost *
                                                                            item.qty
                                                                        ).toLocaleString('en-IN')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Bottom Row: Nudges */}
                                                    {!isDropship && nudge && (
                                                        <div className="flex items-center justify-between border-t border-emerald-100 bg-emerald-50 px-4 py-2">
                                                            <p className="text-[10px] font-semibold text-emerald-800">
                                                                Add{' '}
                                                                <span className="font-bold">
                                                                    {nudge.unitsNeeded}
                                                                </span>{' '}
                                                                more for{' '}
                                                                <span className="font-bold">
                                                                    ₹{nudge.newPrice}/ea
                                                                </span>
                                                            </p>
                                                            <button
                                                                onClick={() =>
                                                                    updateCartItem(
                                                                        item.productId?._id,
                                                                        nudge.targetQty
                                                                    )
                                                                }
                                                                className="text-[10px] font-bold text-emerald-600 transition-colors hover:text-emerald-800"
                                                            >
                                                                Upgrade qty &rarr;
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!isDropship &&
                                                        !nudge &&
                                                        item.productId?.tieredPricing?.length >
                                                            0 && (
                                                            <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-semibold text-slate-500">
                                                                <CheckCircle
                                                                    size={12}
                                                                    className="text-slate-400"
                                                                />{' '}
                                                                Max volume discount applied
                                                            </div>
                                                        )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </motion.div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                        <Package size={28} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Your cart is empty
                                    </h3>
                                    <p className="mt-1 max-w-[220px] text-xs font-medium text-slate-500">
                                        Add wholesale inventory or queue dropship orders to get
                                        started.
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="mt-6 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        Browse Catalog
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* FOOTER - Financial Breakdown */}
                        {cart?.items?.length > 0 && (
                            <div className="shrink-0 border-t border-slate-200 bg-white p-5 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
                                {/* Guardrails */}
                                {isB2BPending && (
                                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
                                        <Lock size={14} className="mt-0.5 shrink-0" />
                                        <p>
                                            Checkout locked.{' '}
                                            <Link
                                                to="/kyc"
                                                onClick={onClose}
                                                className="font-bold underline hover:text-amber-900"
                                            >
                                                Complete KYC
                                            </Link>{' '}
                                            to procure.
                                        </p>
                                    </div>
                                )}
                                {hasDropshipItems && hasWholesaleItems && !isB2BPending && (
                                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-xs font-medium text-indigo-800">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <p>
                                            Mixed order: Dropship items require separate addresses
                                            at checkout.
                                        </p>
                                    </div>
                                )}

                                {/* Summary Breakdown */}
                                <div className="mb-5 space-y-2.5">
                                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                                        <span>Taxable Subtotal</span>
                                        <span>
                                            ₹
                                            {cart.subTotalPlatformCost?.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                                        <span className="flex items-center gap-1.5">
                                            <ShieldCheck size={14} /> Est. GST (ITC Claimable)
                                        </span>
                                        <span>
                                            + ₹
                                            {cart.totalTax?.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    <div className="my-3 border-t border-dashed border-slate-200" />
                                    <div className="flex items-end justify-between">
                                        <span className="text-sm font-bold text-slate-900">
                                            Total Payable
                                        </span>
                                        <span className="text-2xl font-black text-slate-900">
                                            ₹
                                            {cart.grandTotalPlatformCost?.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Margin Banner */}
                                {cart.totalExpectedProfit > 0 && (
                                    <div className="mb-5 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-emerald-800">
                                        <div className="flex items-center gap-1.5 text-xs font-bold">
                                            <TrendingUp size={16} /> Total Dropship Margin
                                        </div>
                                        <span className="text-sm font-bold">
                                            +₹{cart.totalExpectedProfit?.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}

                                {/* Checkout Button */}
                                <button
                                    onClick={handleCheckout}
                                    disabled={isLoading || isB2BPending}
                                    className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {isB2BPending ? 'KYC Required' : 'Proceed to Checkout'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
