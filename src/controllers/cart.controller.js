import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';

const MAX_DROPSHIP_SELLING_PRICE = 999999;

const validatePositiveInteger = (value, fieldName) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new ApiError(400, `${fieldName} must be a positive integer`);
    }
    return parsed;
};

const parseDropshipSellingPrice = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new ApiError(400, 'Dropship selling price must be a valid number');
    }

    const normalized = Math.floor(parsed);
    if (normalized < 0) {
        throw new ApiError(400, 'Dropship selling price cannot be negative');
    }

    if (normalized > MAX_DROPSHIP_SELLING_PRICE) {
        throw new ApiError(
            400,
            `Dropship selling price cannot exceed ₹${MAX_DROPSHIP_SELLING_PRICE.toLocaleString('en-IN')}`
        );
    }

    return normalized;
};

const calculateItemWeights = (product, qty) => {
    const actualWeightKg = (product.weightGrams || 0) / 1000;
    const l = product.dimensions?.length || 0;
    const w = product.dimensions?.width || 0;
    const h = product.dimensions?.height || 0;
    const volWeightKg = (l * w * h) / 5000;

    const chargeableWeightPerUnit = Math.max(actualWeightKg, volWeightKg);

    return {
        actualWeight: actualWeightKg * qty,
        volumetricWeight: volWeightKg * qty,
        billableWeight: chargeableWeightPerUnit * qty,
    };
};

const calculateSlabCharge = (totalWt) => {
    if (totalWt <= 0) totalWt = 0.5;

    let slab = 0;
    if (totalWt <= 0.5) slab = 0.5;
    else if (totalWt <= 1.0) slab = 1;
    else if (totalWt <= 2.0) slab = 2;
    else if (totalWt <= 3.0) slab = 3;
    else if (totalWt <= 4.0) slab = 4;
    else if (totalWt <= 5.0) slab = 5;
    else slab = Math.ceil(totalWt);

    let deliveryCharge = 0;
    switch (slab) {
        case 0.5:
            deliveryCharge = 50;
            break;
        case 1:
            deliveryCharge = 80;
            break;
        case 2:
            deliveryCharge = 100;
            break;
        case 3:
            deliveryCharge = 130;
            break;
        case 4:
            deliveryCharge = 145;
            break;
        case 5:
            deliveryCharge = 160;
            break;
        default:
            deliveryCharge = 160 + (slab - 5) * 30;
    }

    let packingCharge = 0;
    switch (slab) {
        case 0.5:
            packingCharge = 10;
            break;
        case 1:
            packingCharge = 15;
            break;
        case 2:
            packingCharge = 20;
            break;
        case 3:
            packingCharge = 25;
            break;
        case 4:
            packingCharge = 28;
            break;
        case 5:
            packingCharge = 30;
            break;
        default:
            packingCharge = 30 + (slab - 5) * 5;
    }

    return { deliveryCharge, packingCharge, totalShippingCost: deliveryCharge + packingCharge };
};

const recalculateCart = async (cart) => {
    let subTotal = 0;
    let totalTax = 0;
    let totalExpectedProfit = 0;

    let totalActualWeight = 0;
    let totalVolumetricWeight = 0;
    let totalBillableWeight = 0;

    const shippingGroups = {
        WHOLESALE: { billableWeight: 0, shippingCost: 0 },
    };

    for (let i = 0; i < cart.items.length; i++) {
        let item = cart.items[i];
        if (!item.productId) continue;

        const productId = item.productId._id ? item.productId._id : item.productId;
        const product = await Product.findById(productId);

        if (!product || product.status !== 'active') {
            item.toBeRemoved = true;
            continue;
        }

        let unitCost = product.dropshipBasePrice;
        if (item.orderType === 'WHOLESALE' && product.tieredPricing?.length > 0) {
            const applicableTier = [...product.tieredPricing]
                .sort((a, b) => b.minQty - a.minQty)
                .find((tier) => item.qty >= tier.minQty);
            if (applicableTier) unitCost = applicableTier.pricePerUnit;
        }

        item.platformUnitCost = unitCost;
        item.gstSlab = product.gstSlab;
        item.taxAmountPerUnit = Number(((unitCost * product.gstSlab) / 100).toFixed(2));

        const weights = calculateItemWeights(product, item.qty);
        item.actualWeight = weights.actualWeight;
        item.volumetricWeight = weights.volumetricWeight;
        item.billableWeight = weights.billableWeight;

        totalActualWeight += item.actualWeight;
        totalVolumetricWeight += item.volumetricWeight;
        totalBillableWeight += item.billableWeight;

        let groupKey = 'WHOLESALE';
        if (item.orderType === 'DROPSHIP') {
            if (item.endCustomerDetails?.phone && item.endCustomerDetails?.address?.zip) {
                groupKey = `DROPSHIP_${item.endCustomerDetails.phone}_${item.endCustomerDetails.address.zip}`;
            } else {
                groupKey = `DROPSHIP_UNASSIGNED_${i}`;
            }
        }

        item._tempGroupKey = groupKey;

        if (!shippingGroups[groupKey]) {
            shippingGroups[groupKey] = { billableWeight: 0, shippingCost: 0 };
        }

        shippingGroups[groupKey].billableWeight += item.billableWeight;
    }

    cart.items = cart.items.filter((item) => !item.toBeRemoved);

    let totalDeliveryCharge = 0;
    let totalPackingCharge = 0;
    let totalShippingCost = 0;

    for (const key in shippingGroups) {
        const group = shippingGroups[key];
        if (group.billableWeight > 0) {
            const charges = calculateSlabCharge(group.billableWeight);
            group.shippingCost = charges.totalShippingCost;

            totalDeliveryCharge += charges.deliveryCharge;
            totalPackingCharge += charges.packingCharge;
            totalShippingCost += charges.totalShippingCost;
        }
    }

    cart.totalDeliveryCharge = totalDeliveryCharge;
    cart.totalPackingCharge = totalPackingCharge;
    cart.totalShippingCost = totalShippingCost;

    for (let i = 0; i < cart.items.length; i++) {
        let item = cart.items[i];
        const groupKey = item._tempGroupKey;
        const group = shippingGroups[groupKey];

        if (group && group.billableWeight > 0) {
            const weightRatio = item.billableWeight / group.billableWeight;
            item.shippingCost = Number((group.shippingCost * weightRatio).toFixed(2));
        } else {
            item.shippingCost = 0;
        }

        item.totalItemPlatformCost = Number(
            ((item.platformUnitCost + item.taxAmountPerUnit) * item.qty).toFixed(2)
        );

        if (item.orderType === 'DROPSHIP') {
            const baseMinimumSellingPrice =
                item.platformUnitCost + item.taxAmountPerUnit + item.shippingCost / item.qty;

            const expectedProfitPrepaid = item.resellerSellingPrice - baseMinimumSellingPrice;

            item.expectedProfit = Number((expectedProfitPrepaid * item.qty).toFixed(2));

            item.expectedProfitIfCOD = Number((expectedProfitPrepaid * item.qty - 41.3).toFixed(2));
        }

        subTotal += item.platformUnitCost * item.qty;
        totalTax += item.taxAmountPerUnit * item.qty;
        totalExpectedProfit += item.expectedProfit;

        item._tempGroupKey = undefined;
    }

    const shippingTax = Number((totalShippingCost * 0.18).toFixed(2));
    cart.subTotalPlatformCost = Number(subTotal.toFixed(2));
    cart.totalTax = Number((totalTax + shippingTax).toFixed(2));
    cart.totalShippingCost = Number(totalShippingCost.toFixed(2));
    cart.grandTotalPlatformCost = Number((subTotal + totalTax + totalShippingCost).toFixed(2));
    cart.totalExpectedProfit = Number(totalExpectedProfit.toFixed(2));

    cart.totalActualWeight = Number(totalActualWeight.toFixed(3));
    cart.totalVolumetricWeight = Number(totalVolumetricWeight.toFixed(3));
    cart.totalBillableWeight = Number(totalBillableWeight.toFixed(3));
    cart.weightType = totalVolumetricWeight > totalActualWeight ? 'VOLUMETRIC' : 'ACTUAL';

    return cart;
};

export const getCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ resellerId: req.user._id });

    if (!cart) {
        cart = await Cart.create({ resellerId: req.user._id, items: [] });
    } else {
        cart = await recalculateCart(cart);
        await cart.save();
    }

    const populatedCart = await Cart.findById(cart._id).populate(
        'items.productId',
        'title images sku inventory moq weightGrams dimensions dropshipBasePrice suggestedRetailPrice'
    );

    return res
        .status(200)
        .json(new ApiResponse(200, populatedCart, 'Cart fetched and synced successfully'));
});

export const addToCart = asyncHandler(async (req, res) => {
    const { productId, qty, orderType, resellerSellingPrice, customerDetails, saveToAddressBook } =
        req.body;

    if (!productId || !qty || !orderType) {
        throw new ApiError(400, 'Product ID, Quantity, and Order Type are required');
    }

    if (
        orderType === 'DROPSHIP' &&
        (!customerDetails || !customerDetails.name || !customerDetails.phone)
    ) {
        throw new ApiError(400, 'Customer destination details are required for Dropship orders.');
    }

    const parsedQty = validatePositiveInteger(qty, 'Quantity');

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    if (product.inventory.stock < parsedQty) {
        throw new ApiError(400, `Only ${product.inventory.stock} units available in stock`);
    }

    if (orderType === 'WHOLESALE' && parsedQty < product.moq) {
        throw new ApiError(
            400,
            `Minimum Order Quantity (MOQ) for this wholesale product is ${product.moq} units.`
        );
    }

    let cart = await Cart.findOne({ resellerId: req.user._id });
    if (!cart) {
        cart = new Cart({ resellerId: req.user._id, items: [] });
    }

    const hasDropshipPriceInput =
        resellerSellingPrice !== undefined &&
        resellerSellingPrice !== null &&
        resellerSellingPrice !== '';

    const targetSellingPrice =
        orderType === 'DROPSHIP'
            ? hasDropshipPriceInput
                ? parseDropshipSellingPrice(resellerSellingPrice)
                : parseDropshipSellingPrice(product.suggestedRetailPrice || 0)
            : 0;

    const existingItemIndex = cart.items.findIndex((item) => {
        if (item.productId.toString() !== String(productId) || item.orderType !== orderType)
            return false;
        if (orderType === 'WHOLESALE') return true;

        if (orderType === 'DROPSHIP') {
            const isSameCustomer = item.endCustomerDetails?.phone === customerDetails.phone;
            const isSamePrice = item.resellerSellingPrice === targetSellingPrice;
            return isSameCustomer && isSamePrice;
        }
        return false;
    });

    if (existingItemIndex > -1) {
        cart.items[existingItemIndex].qty += parsedQty;
    } else {
        cart.items.push({
            productId,
            qty: parsedQty,
            orderType,
            resellerSellingPrice: targetSellingPrice,
            endCustomerDetails:
                orderType === 'DROPSHIP'
                    ? {
                          name: customerDetails.name,
                          phone: customerDetails.phone,
                          address: {
                              street: customerDetails.street,
                              city: customerDetails.city,
                              state: customerDetails.state,
                              zip: customerDetails.zip,
                          },
                      }
                    : null,
        });
    }

    if (orderType === 'DROPSHIP' && saveToAddressBook) {
        const user = await User.findById(req.user._id);
        const exists = user.savedCustomers.some((c) => c.phone === customerDetails.phone);
        if (!exists) {
            user.savedCustomers.push({
                name: customerDetails.name,
                phone: customerDetails.phone,
                address: {
                    street: customerDetails.street,
                    city: customerDetails.city,
                    state: customerDetails.state,
                    zip: customerDetails.zip,
                },
            });
            await user.save({ validateBeforeSave: false });
        }
    }

    cart = await recalculateCart(cart);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
        'items.productId',
        'title images sku inventory moq weightGrams dimensions dropshipBasePrice suggestedRetailPrice'
    );

    return res.status(200).json(new ApiResponse(200, populatedCart, 'Item added to cart'));
});

export const updateCartItem = asyncHandler(async (req, res) => {
    const { qty, resellerSellingPrice } = req.body;
    const { itemId } = req.params;

    let cart = await Cart.findOne({ resellerId: req.user._id });
    if (!cart) throw new ApiError(404, 'Cart not found');

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) throw new ApiError(404, 'Item not found in cart');

    const product = await Product.findById(cart.items[itemIndex].productId);

    if (qty !== undefined) {
        if (qty <= 0) {
            cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
            cart = await recalculateCart(cart);
            await cart.save();
            return res.status(200).json(new ApiResponse(200, cart, 'Item removed from cart'));
        }

        const parsedQty = validatePositiveInteger(qty, 'Quantity');
        if (parsedQty > product.inventory.stock) {
            throw new ApiError(
                400,
                `Cannot exceed available stock (${product.inventory.stock} units)`
            );
        }
        if (cart.items[itemIndex].orderType === 'WHOLESALE' && parsedQty < product.moq) {
            throw new ApiError(
                400,
                `Quantity cannot be less than the MOQ of ${product.moq} units.`
            );
        }
        cart.items[itemIndex].qty = parsedQty;
    }

    if (resellerSellingPrice !== undefined && cart.items[itemIndex].orderType === 'DROPSHIP') {
        cart.items[itemIndex].resellerSellingPrice =
            parseDropshipSellingPrice(resellerSellingPrice);
    }

    cart = await recalculateCart(cart);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
        'items.productId',
        'title images sku inventory moq weightGrams dimensions dropshipBasePrice suggestedRetailPrice'
    );

    return res.status(200).json(new ApiResponse(200, populatedCart, 'Cart updated'));
});

export const removeFromCart = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    let cart = await Cart.findOne({ resellerId: req.user._id });
    if (!cart) throw new ApiError(404, 'Cart not found');

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    cart = await recalculateCart(cart);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
        'items.productId',
        'title images sku inventory moq weightGrams dimensions dropshipBasePrice suggestedRetailPrice'
    );

    return res.status(200).json(new ApiResponse(200, populatedCart, 'Item removed from cart'));
});

export const clearCart = asyncHandler(async (req, res) => {
    const emptyCart = await Cart.findOneAndUpdate(
        { resellerId: req.user._id },
        {
            $set: {
                items: [],
                subTotalPlatformCost: 0,
                totalTax: 0,
                totalShippingCost: 0,
                grandTotalPlatformCost: 0,
                totalExpectedProfit: 0,
            },
        },
        { new: true }
    );

    if (!emptyCart) {
        throw new ApiError(404, 'Cart not found to clear');
    }

    return res.status(200).json(new ApiResponse(200, emptyCart, 'Cart cleared successfully'));
});

export const assignCustomerToCartItem = asyncHandler(async (req, res) => {
    const { customerDetails, saveToAddressBook } = req.body;
    const { itemId } = req.params;

    if (
        !customerDetails ||
        !customerDetails.name ||
        !customerDetails.phone ||
        !customerDetails.street ||
        !customerDetails.zip
    ) {
        throw new ApiError(400, 'Incomplete customer details provided.');
    }

    let cart = await Cart.findOne({ resellerId: req.user._id });
    if (!cart) throw new ApiError(404, 'Cart not found');

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);

    if (itemIndex === -1 || cart.items[itemIndex].orderType !== 'DROPSHIP') {
        throw new ApiError(404, 'Valid dropship item not found in cart.');
    }

    cart.items[itemIndex].endCustomerDetails = {
        name: customerDetails.name,
        phone: customerDetails.phone,
        address: {
            street: customerDetails.street,
            city: customerDetails.city,
            state: customerDetails.state,
            zip: customerDetails.zip,
        },
    };

    if (saveToAddressBook) {
        const user = await User.findById(req.user._id);
        const exists = user.savedCustomers.some((c) => c.phone === customerDetails.phone);
        if (!exists) {
            user.savedCustomers.push(cart.items[itemIndex].endCustomerDetails);
            await user.save({ validateBeforeSave: false });
        }
    }

    cart = await recalculateCart(cart);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
        'items.productId',
        'title images sku inventory moq weightGrams dimensions dropshipBasePrice suggestedRetailPrice'
    );

    return res
        .status(200)
        .json(new ApiResponse(200, populatedCart, 'Destination assigned successfully'));
});
