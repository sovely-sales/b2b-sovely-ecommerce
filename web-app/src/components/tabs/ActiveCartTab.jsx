import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart,
    Trash2,
    Loader2,
    Wallet,
    AlertCircle,
    MapPin,
    User as UserIcon,
    AlertTriangle,
    IndianRupee,
    TrendingUp,
    TrendingDown,
    Box,
    Scale,
    Receipt,
    Calculator,
    Truck,
    Package,
} from 'lucide-react';
import { AuthContext } from '../../AuthContext';
import { useCartStore } from '../../store/cartStore';
import AssignCustomerModal from '../AssignCustomerModal';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const EditableInput = ({
    value,
    label,
    type = 'number',
    onUpdate,
    prefix,
    min,
    textCenter = false,
}) => {
    const [localVal, setLocalVal] = useState(value);

    useEffect(() => {
        setLocalVal(value);
    }, [value]);

    const handleBlur = () => {
        if (Number(localVal) !== Number(value)) {
            onUpdate(Number(localVal));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <div className="relative flex items-center">
            {prefix && (
                <span className="absolute left-3 text-sm font-bold text-slate-400">{prefix}</span>
            )}
            <input
                type={type}
                min={min}
                value={localVal}
                onChange={(e) => setLocalVal(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full rounded-xl border border-slate-300 bg-white py-2 ${prefix ? 'pr-3 pl-8' : 'px-2'} ${textCenter ? 'text-center' : ''} [appearance:textfield] text-sm font-black text-slate-900 transition-all outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                placeholder={label}
            />
        </div>
    );
};

export default function ActiveCartTab({ setActiveTab }) {
    const { user, refreshUser } = useContext(AuthContext);

    const cart = useCartStore((state) => state.cart);
    const fetchCart = useCartStore((state) => state.fetchCart);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const clearCartState = useCartStore((state) => state.clearCartState);
    const updateCartItem = useCartStore((state) => state.updateCartItem);
    const assignCustomerToItem = useCartStore((state) => state.assignCustomerToItem);

    const navigate = useNavigate();

    const [paymentMethods, setPaymentMethods] = useState({});
    const [platformOrderNos, setPlatformOrderNos] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [activeAssignItemId, setActiveAssignItemId] = useState(null);

    const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));
    const getDropshipGroupEconomics = (group, paymentMethod) => {
        const itemSubTotal = (group.items || []).reduce(
            (sum, item) => sum + (Number(item.platformUnitCost) || 0) * (Number(item.qty) || 0),
            0
        );
        const itemTaxTotal = (group.items || []).reduce(
            (sum, item) => sum + (Number(item.taxAmountPerUnit) || 0) * (Number(item.qty) || 0),
            0
        );
        const shippingTotal = (group.items || []).reduce(
            (sum, item) => sum + (Number(item.shippingCost) || 0),
            0
        );
        const shippingTax = roundMoney(shippingTotal * 0.18);
        const codFee = paymentMethod === 'COD' ? 41.3 : 0;
        const totalCost = roundMoney(
            itemSubTotal + itemTaxTotal + shippingTotal + shippingTax + codFee
        );
        const customerPaymentTotal = roundMoney(
            (group.items || []).reduce(
                (sum, item) =>
                    sum + (Number(item.resellerSellingPrice) || 0) * (Number(item.qty) || 0),
                0
            )
        );

        return {
            totalCost,
            customerPaymentTotal,
            netMargin: roundMoney(customerPaymentTotal - totalCost),
        };
    };

    useEffect(() => {
        if (!cart) {
            fetchCart();
        }
    }, [cart, fetchCart]);

    const groupedCart = useMemo(() => {
        if (!cart?.items) return [];

        const groups = {};

        cart.items.forEach((item) => {
            let groupKey = 'WHOLESALE';
            let groupTitle = 'B2B Wholesale Procurement';
            let icon = 'bulk';
            let isWarning = false;
            let details = null;

            if (item.orderType === 'DROPSHIP') {
                if (item.endCustomerDetails?.phone && item.endCustomerDetails?.address?.zip) {
                    groupKey = `DROPSHIP_${item.endCustomerDetails.phone}_${item.endCustomerDetails.address.zip}`;
                    groupTitle = `Dropship Destination: ${item.endCustomerDetails.name}`;
                    details = item.endCustomerDetails;
                    icon = 'dropship';
                } else {
                    groupKey = `DROPSHIP_UNASSIGNED_${item._id}`;
                    groupTitle = 'Action Required: Destination Missing';
                    isWarning = true;
                    icon = 'warning';
                }
            }

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    key: groupKey,
                    title: groupTitle,
                    icon,
                    isWarning,
                    details,
                    items: [],
                };
            }
            groups[groupKey].items.push(item);
        });

        return Object.values(groups).sort((a, b) => {
            if (a.isWarning) return -1;
            if (a.key === 'WHOLESALE') return 1;
            return 0;
        });
    }, [cart?.items]);

    if (!cart?.items?.length) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                <div className="mb-6 rounded-full bg-slate-50 p-6">
                    <ShoppingCart size={48} className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Operations Cart is Empty</h3>
                <p className="mt-2 font-medium text-slate-500">
                    Source inventory or dispatch dropship orders.
                </p>
                <button
                    onClick={() => navigate('/catalog')}
                    className="mt-6 rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                >
                    Browse Catalog
                </button>
            </div>
        );
    }

    const hasUnassignedDropship = groupedCart.some((g) => g.isWarning);
    const codGroupCount = groupedCart.filter(
        (g) => g.icon === 'dropship' && (paymentMethods[g.key] ?? 'COD') === 'COD'
    ).length;

    const totalCodFee = codGroupCount * 41.3;
    const finalGrandTotal = (cart.grandTotalPlatformCost || 0) + totalCodFee;
    const isWalletSufficient = (user?.walletBalance || 0) >= finalGrandTotal;

    const handleSetPaymentMethod = (groupKey, method) => {
        setPaymentMethods((prev) => ({ ...prev, [groupKey]: method }));
    };

    const handlePlaceOrder = async () => {
        setError('');
        if (hasUnassignedDropship)
            return setError(
                'Please assign destinations for all dropship items before checking out.'
            );

        const negativeMarginGroup = groupedCart.find((group) => {
            if (group.icon !== 'dropship') return false;
            const paymentMethod = paymentMethods[group.key] ?? 'COD';
            const { netMargin } = getDropshipGroupEconomics(group, paymentMethod);
            return netMargin < 0;
        });

        if (negativeMarginGroup) {
            const paymentMethod = paymentMethods[negativeMarginGroup.key] ?? 'COD';
            const { totalCost, customerPaymentTotal, netMargin } = getDropshipGroupEconomics(
                negativeMarginGroup,
                paymentMethod
            );
            const pincode = negativeMarginGroup.details?.address?.zip || 'unknown destination';
            return setError(
                `Selling price for destination ${pincode} is too low by ₹${Math.abs(
                    netMargin
                ).toFixed(2)}. Minimum customer total required is ₹${totalCost.toFixed(
                    2
                )}, current is ₹${customerPaymentTotal.toFixed(2)}.`
            );
        }

        if (!isWalletSufficient)
            return setError('Insufficient wallet balance. Please add capital to your wallet.');

        setLoading(true);
        try {
            const idempotencyKey =
                window.crypto && window.crypto.randomUUID
                    ? window.crypto.randomUUID()
                    : `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

            const res = await api.post(
                '/orders',
                { paymentMethods, platformOrderNos },
                { headers: { 'x-idempotency-key': idempotencyKey } }
            );

            clearCartState();
            await refreshUser();

            toast.success(`Procurement successful! Dispatched ${res.data.data.length} order(s).`, {
                duration: 5000,
            });
            window.dispatchEvent(new Event('refreshHubData'));

            if (setActiveTab) {
                setActiveTab('HISTORY');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssignModal = (itemId) => {
        setActiveAssignItemId(itemId);
        setIsAssignModalOpen(true);
    };

    const handleAssignDestination = async (customerDetails, saveToAddressBook) => {
        if (!activeAssignItemId) return false;
        const success = await assignCustomerToItem(
            activeAssignItemId,
            customerDetails,
            saveToAddressBook
        );
        return success;
    };

    return (
        <div className="flex flex-col items-start gap-6 xl:flex-row">
            <div className="w-full space-y-6 xl:w-[70%]">
                {groupedCart.map((group) => {
                    const currentPaymentMethod = paymentMethods[group.key] ?? 'COD';
                    const groupEconomics =
                        group.icon === 'dropship'
                            ? getDropshipGroupEconomics(group, currentPaymentMethod)
                            : null;

                    return (
                        <div
                            key={group.key}
                            className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${group.isWarning ? 'border-amber-300' : 'border-slate-200'}`}
                        >
                            <div
                                className={`flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${group.isWarning ? 'bg-amber-50' : 'bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${group.icon === 'bulk' ? 'bg-indigo-100 text-indigo-600' : group.icon === 'dropship' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}
                                    >
                                        {group.icon === 'bulk' && <Box size={24} />}
                                        {group.icon === 'dropship' && <UserIcon size={24} />}
                                        {group.icon === 'warning' && <AlertTriangle size={24} />}
                                    </div>
                                    <div>
                                        <h4
                                            className={`text-base font-black ${group.isWarning ? 'text-amber-900' : 'text-slate-900'}`}
                                        >
                                            {group.title}
                                        </h4>
                                        {group.details && (
                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <MapPin size={14} />
                                                {group.details.address.street},{' '}
                                                {group.details.address.city},{' '}
                                                {group.details.address.state}{' '}
                                                {group.details.address.zip} • {group.details.phone}
                                            </p>
                                        )}
                                        {group.icon === 'dropship' && group.details && (
                                            <div className="mt-3 max-w-xs">
                                                <input
                                                    type="text"
                                                    placeholder="Platform ID (Amazon/Flipkart Order No)"
                                                    value={platformOrderNos[group.key] || ''}
                                                    onChange={(e) =>
                                                        setPlatformOrderNos((prev) => ({
                                                            ...prev,
                                                            [group.key]: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 transition-all outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {group.icon === 'dropship' && (
                                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                                        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                                            <button
                                                onClick={() =>
                                                    handleSetPaymentMethod(group.key, 'COD')
                                                }
                                                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-black transition-all ${currentPaymentMethod === 'COD' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                            >
                                                <IndianRupee size={14} /> Collect COD
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleSetPaymentMethod(
                                                        group.key,
                                                        'PREPAID_WALLET'
                                                    )
                                                }
                                                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-black transition-all ${currentPaymentMethod === 'PREPAID_WALLET' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                                            >
                                                <Wallet size={14} /> Prepaid
                                            </button>
                                        </div>
                                        {!!groupEconomics && (
                                            <div
                                                className={`text-[10px] font-extrabold ${groupEconomics.netMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                                            >
                                                Destination Net Margin:{' '}
                                                {groupEconomics.netMargin >= 0 ? '+' : '-'}₹
                                                {Math.abs(groupEconomics.netMargin).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {group.isWarning && (
                                    <button
                                        onClick={() => handleOpenAssignModal(group.items[0]._id)}
                                        className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-black text-white shadow-md transition-colors hover:bg-amber-600"
                                    >
                                        Assign Address
                                    </button>
                                )}
                            </div>

                            <div className="divide-y divide-slate-100">
                                {group.items.map((item) => {
                                    const itemId = item._id || item.productId;
                                    const unitPlatformCost = Number(
                                        (
                                            (item.platformUnitCost || 0) +
                                            (item.taxAmountPerUnit || 0)
                                        ).toFixed(2)
                                    );

                                    const displayedProfit = item.expectedProfit;

                                    return (
                                        <div
                                            key={itemId}
                                            className="flex flex-col gap-6 bg-white p-6 transition-colors hover:bg-slate-50 lg:flex-row lg:items-start"
                                        >
                                            <div className="flex flex-1 gap-4">
                                                <Link
                                                    to={`/product/${item.productId?._id || item.productId}`}
                                                    className="shrink-0"
                                                >
                                                    <img
                                                        src={
                                                            item.image ||
                                                            item.productId?.images?.[0]?.url ||
                                                            'https://via.placeholder.com/60'
                                                        }
                                                        alt=""
                                                        className="h-20 w-20 rounded-2xl border border-slate-200 object-cover shadow-sm transition-opacity hover:opacity-80"
                                                        onError={(e) => {
                                                            e.target.src =
                                                                'https://via.placeholder.com/60?text=No+Image';
                                                        }}
                                                    />
                                                </Link>
                                                <div className="flex flex-col justify-between">
                                                    <div>
                                                        <Link
                                                            to={`/product/${item.productId?._id || item.productId}`}
                                                            className="line-clamp-2 text-sm font-black text-slate-900 hover:text-indigo-600"
                                                        >
                                                            {item.title || item.productId?.title}
                                                        </Link>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                                                                SKU: {item.productId?.sku || 'N/A'}
                                                            </span>
                                                            <span
                                                                className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${item.productId?.inventory?.stock > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                                                            >
                                                                Stock:{' '}
                                                                {item.productId?.inventory?.stock ||
                                                                    0}
                                                            </span>
                                                            {item.orderType === 'WHOLESALE' && (
                                                                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-600">
                                                                    MOQ: {item.productId?.moq || 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                                        <div
                                                            className="flex items-center gap-1"
                                                            title="Actual vs Volumetric"
                                                        >
                                                            <Scale size={12} /> Billable:{' '}
                                                            {item.billableWeight?.toFixed(2)} kg
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 lg:w-48">
                                                <p className="mb-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                                    Unit Cost Setup
                                                </p>
                                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                                    <span>Base:</span>{' '}
                                                    <span>
                                                        ₹
                                                        {item.platformUnitCost?.toLocaleString(
                                                            'en-IN'
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                                    <span>GST ({item.gstSlab}%):</span>{' '}
                                                    <span>
                                                        +₹
                                                        {item.taxAmountPerUnit?.toLocaleString(
                                                            'en-IN'
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-sm font-black text-slate-900">
                                                    <span>Total/Unit:</span>{' '}
                                                    <span>
                                                        ₹{unitPlatformCost.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-col gap-4 lg:w-48 lg:items-end">
                                                <div className="w-full">
                                                    <label className="mb-1 block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase lg:text-center">
                                                        Quantity
                                                    </label>
                                                    <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-white p-1">
                                                        <button
                                                            onClick={() =>
                                                                updateCartItem(
                                                                    itemId,
                                                                    item.qty - 1,
                                                                    item.resellerSellingPrice
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                        >
                                                            -
                                                        </button>
                                                        <div className="w-14">
                                                            <EditableInput
                                                                value={item.qty}
                                                                min={
                                                                    item.orderType === 'WHOLESALE'
                                                                        ? item.productId?.moq || 1
                                                                        : 1
                                                                }
                                                                onUpdate={(newQty) =>
                                                                    updateCartItem(
                                                                        itemId,
                                                                        newQty,
                                                                        item.resellerSellingPrice
                                                                    )
                                                                }
                                                                type="number"
                                                                textCenter={true}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                updateCartItem(
                                                                    itemId,
                                                                    item.qty + 1,
                                                                    item.resellerSellingPrice
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                {group.icon === 'dropship' && (
                                                    <div className="w-full">
                                                        <label className="mb-1 block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase lg:text-right">
                                                            Customer Pays
                                                        </label>
                                                        <EditableInput
                                                            prefix="₹"
                                                            value={item.resellerSellingPrice}
                                                            onUpdate={(newPrice) =>
                                                                updateCartItem(
                                                                    itemId,
                                                                    item.qty,
                                                                    newPrice
                                                                )
                                                            }
                                                        />
                                                        {}
                                                        <div
                                                            className={`mt-1.5 flex flex-col items-end gap-0.5 text-[10px] font-extrabold tracking-wider uppercase ${displayedProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                {displayedProfit >= 0 ? (
                                                                    <TrendingUp size={12} />
                                                                ) : (
                                                                    <TrendingDown size={12} />
                                                                )}
                                                                Margin:{' '}
                                                                {displayedProfit >= 0 ? '+' : '-'}₹
                                                                {Math.abs(
                                                                    displayedProfit
                                                                ).toLocaleString('en-IN', {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 items-center lg:h-full lg:pt-6">
                                                <button
                                                    onClick={() => removeFromCart(itemId)}
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="w-full xl:w-[30%]">
                <div className="sticky top-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                    <div className="bg-slate-900 p-6 text-white">
                        <h3 className="flex items-center gap-2 text-lg font-black tracking-wide">
                            <Calculator size={20} className="text-indigo-400" /> Procurement Summary
                        </h3>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                            Real-time ledger projection
                        </p>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-700">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-3 text-sm font-bold text-slate-600">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Box size={14} /> Items Subtotal
                                </span>
                                <span className="text-slate-900">
                                    ₹{(cart.subTotalPlatformCost || 0).toLocaleString('en-IN')}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Receipt size={14} /> Tax (GST)
                                </span>
                                <span className="text-slate-900">
                                    + ₹{(cart.totalTax || 0).toLocaleString('en-IN')}
                                </span>
                            </div>

                            <div className="mt-4 mb-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <h5 className="mb-3 flex items-center gap-2 text-xs font-black tracking-widest text-slate-700 uppercase">
                                    <Truck size={14} className="text-indigo-500" /> Logistics &
                                    Handling
                                </h5>

                                <div className="space-y-2 text-xs font-bold text-slate-500">
                                    <div className="flex justify-between">
                                        <span>Total Billable Weight</span>
                                        <span className="text-slate-800">
                                            {cart.totalBillableWeight?.toFixed(2)} kg{' '}
                                            <span className="text-[9px] font-medium text-slate-400">
                                                ({cart.weightType})
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Delivery Freight</span>
                                        <span className="text-slate-800">
                                            + ₹
                                            {(cart.totalDeliveryCharge || 0).toLocaleString(
                                                'en-IN'
                                            )}
                                        </span>
                                    </div>
                                    {cart.totalPackingCharge > 0 && (
                                        <div className="flex justify-between">
                                            <span>Packing Materials</span>
                                            <span className="text-slate-800">
                                                + ₹
                                                {(cart.totalPackingCharge || 0).toLocaleString(
                                                    'en-IN'
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-3 border-t border-slate-200 pt-2 text-[9px] leading-relaxed font-bold text-slate-400">
                                    *Rates calculated per destination using 0.5kg slab intervals.
                                    Higher of actual or volumetric weight applies.
                                </p>
                            </div>

                            {}
                            {totalCodFee > 0 && (
                                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                                    <span className="flex items-center gap-1.5 text-xs font-black">
                                        <IndianRupee size={14} /> COD Fees (x{codGroupCount})
                                    </span>
                                    <div className="text-right">
                                        <span className="text-sm font-black">
                                            + ₹
                                            {totalCodFee.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                        <p className="mt-0.5 text-[9px] font-bold text-amber-700/70">
                                            (₹35 + 18% GST per order)
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="my-6 border-t border-dashed border-slate-200 pt-6">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="block text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                                            Wallet Deduction
                                        </span>
                                        <span className="text-base font-black text-slate-900">
                                            Total Payable
                                        </span>
                                    </div>
                                    <span className="text-3xl font-black tracking-tighter text-indigo-600">
                                        ₹{finalGrandTotal.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || !isWalletSufficient || hasUnassignedDropship}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-black text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:transform-none disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Wallet size={18} />
                            )}
                            {hasUnassignedDropship
                                ? 'Assign Destinations First'
                                : isWalletSufficient
                                  ? 'Authorize Procurement'
                                  : 'Insufficient Capital - Add Funds'}
                        </button>

                        {!isWalletSufficient && !hasUnassignedDropship && (
                            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-center">
                                <p className="text-xs font-bold text-red-600">
                                    Shortfall: ₹
                                    {(finalGrandTotal - (user?.walletBalance || 0)).toLocaleString(
                                        'en-IN'
                                    )}
                                </p>
                                <button
                                    onClick={() => navigate('/wallet')}
                                    className="mt-1 text-[10px] font-black tracking-widest text-red-800 uppercase hover:underline"
                                >
                                    Go to Wallet Tab
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isAssignModalOpen && (
                    <AssignCustomerModal
                        isOpen={true}
                        onClose={() => {
                            setIsAssignModalOpen(false);
                            setActiveAssignItemId(null);
                        }}
                        onAssign={handleAssignDestination}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
