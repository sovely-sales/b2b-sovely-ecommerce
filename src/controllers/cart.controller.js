import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// --- NEW: Client's Logistics Engine ---
const calculateFreightAndPackaging = (product, qty) => {
    // 1. Actual Weight in Kg
    const actualWeightKg = (product.weightGrams || 0) / 1000;

    // 2. Volumetric Weight in Kg (L * W * H / 5000)
    const l = product.dimensions?.length || 0;
    const w = product.dimensions?.width || 0;
    const h = product.dimensions?.height || 0;
    const volWeightKg = (l * w * h) / 5000;

    // 3. Chargeable Weight (Greater of the two)
    const chargeableWeightPerUnit = Math.max(actualWeightKg, volWeightKg);

    // 4. Total Chargeable Weight for this cart line item
    const totalWt = chargeableWeightPerUnit * qty;

    // 5. Determine Weight Slab
    let slab = 0;
    if (totalWt <= 0.5) slab = 0.5;
    else if (totalWt <= 1.0) slab = 1;
    else if (totalWt <= 2.0) slab = 2;
    else if (totalWt <= 3.0) slab = 3;
    else if (totalWt <= 4.0) slab = 4;
    else if (totalWt <= 5.0) slab = 5;
    else slab = Math.ceil(totalWt); // Fallback: rounds up to nearest kg for >5kg

    // 6. Calculate Delivery Charge (Based on Client's SWITCH)
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
            break; // Interpolated (Missing in client data)
        case 5:
            deliveryCharge = 160;
            break;
        default:
            deliveryCharge = 160 + (slab - 5) * 30; // +₹30 per extra kg above 5kg
    }

    // 7. Calculate Packaging/Product Charge (Based on Client's SWITCH)
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
            break; // Interpolated (Missing in client data)
        case 5:
            packingCharge = 30;
            break;
        default:
            packingCharge = 30 + (slab - 5) * 5; // +₹5 per extra kg above 5kg
    }

    return {
        deliveryCharge,
        packingCharge,
        totalShippingCost: deliveryCharge + packingCharge,
    };
};

const recalculateCart = async (cart) => {
    let subTotal = 0;
    let totalTax = 0;
    let totalShippingCost = 0;
    let totalExpectedProfit = 0;

    for (let item of cart.items) {
        const product = await Product.findById(item.productId);

        if (!product || product.status !== 'active') {
            item.toBeRemoved = true;
            continue;
        }

        let unitCost = product.dropshipBasePrice;

        if (
            item.orderType === 'WHOLESALE' &&
            product.tieredPricing &&
            product.tieredPricing.length > 0
        ) {
            const applicableTier = [...product.tieredPricing]
                .sort((a, b) => b.minQty - a.minQty)
                .find((tier) => item.qty >= tier.minQty);

            if (applicableTier) {
                unitCost = applicableTier.pricePerUnit;
            }
        }

        item.platformUnitCost = unitCost;
        item.gstSlab = product.gstSlab;
        item.taxAmountPerUnit = Number(((unitCost * product.gstSlab) / 100).toFixed(2));

        // --- APPLIED NEW LOGISTICS ENGINE ---
        const { totalShippingCost: itemShippingCost } = calculateFreightAndPackaging(
            product,
            item.qty
        );
        item.shippingCost = itemShippingCost;

        item.totalItemPlatformCost = Number(
            ((unitCost + item.taxAmountPerUnit) * item.qty).toFixed(2)
        );

        if (item.orderType === 'DROPSHIP') {
            // Minimum selling price = Platform Cost + Tax + Shipping
            const minimumSellingPrice =
                unitCost + item.taxAmountPerUnit + item.shippingCost / item.qty;

            if (item.resellerSellingPrice < minimumSellingPrice) {
                item.resellerSellingPrice = minimumSellingPrice;
            }

            const profitPerUnit = item.resellerSellingPrice - minimumSellingPrice;
            item.expectedProfit = Number((profitPerUnit * item.qty).toFixed(2));
        } else {
            item.expectedProfit = 0;
            item.resellerSellingPrice = 0;
        }

        subTotal += unitCost * item.qty;
        totalTax += item.taxAmountPerUnit * item.qty;
        totalShippingCost += item.shippingCost;
        totalExpectedProfit += item.expectedProfit;
    }

    cart.items = cart.items.filter((item) => !item.toBeRemoved);

    cart.subTotalPlatformCost = Number(subTotal.toFixed(2));
    cart.totalTax = Number(totalTax.toFixed(2));
    cart.totalShippingCost = Number(totalShippingCost.toFixed(2));
    cart.grandTotalPlatformCost = Number((subTotal + totalTax + totalShippingCost).toFixed(2));
    cart.totalExpectedProfit = Number(totalExpectedProfit.toFixed(2));

    return cart;
};

export const getCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ resellerId: req.user._id }).populate(
        'items.productId',
        'title images sku inventory moq weightGrams dimensions dropshipBasePrice suggestedRetailPrice' // Added dimensions
    );

    if (!cart) {
        cart = await Cart.create({ resellerId: req.user._id, items: [] });
    }

    return res.status(200).json(new ApiResponse(200, cart, 'Cart fetched successfully'));
});

export const addToCart = asyncHandler(async (req, res) => {
    const { productId, qty, orderType, resellerSellingPrice } = req.body;

    if (!productId || !qty || !orderType) {
        throw new ApiError(400, 'Product ID, Quantity, and Order Type are required');
    }

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    if (product.inventory.stock < qty) {
        throw new ApiError(400, `Only ${product.inventory.stock} units available in stock`);
    }

    if (orderType === 'WHOLESALE' && qty < product.moq) {
        throw new ApiError(
            400,
            `Minimum Order Quantity (MOQ) for this wholesale product is ${product.moq} units.`
        );
    }

    let cart = await Cart.findOne({ resellerId: req.user._id });
    if (!cart) {
        cart = new Cart({ resellerId: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId && item.orderType === orderType
    );

    if (existingItemIndex > -1) {
        cart.items[existingItemIndex].qty += qty;
        if (orderType === 'DROPSHIP' && resellerSellingPrice) {
            cart.items[existingItemIndex].resellerSellingPrice = resellerSellingPrice;
        }
    } else {
        cart.items.push({
            productId,
            qty,
            orderType,
            resellerSellingPrice:
                orderType === 'DROPSHIP' ? resellerSellingPrice || product.suggestedRetailPrice : 0,
        });
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
    const { productId } = req.params;

    let cart = await Cart.findOne({ resellerId: req.user._id });
    if (!cart) throw new ApiError(404, 'Cart not found');

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex === -1) throw new ApiError(404, 'Item not found in cart');

    const product = await Product.findById(productId);
    if (qty > product.inventory.stock) {
        throw new ApiError(400, `Cannot exceed available stock (${product.inventory.stock} units)`);
    }

    if (cart.items[itemIndex].orderType === 'WHOLESALE' && qty < product.moq) {
        throw new ApiError(400, `Quantity cannot be less than the MOQ of ${product.moq} units.`);
    }

    if (qty > 0) cart.items[itemIndex].qty = qty;
    if (resellerSellingPrice && cart.items[itemIndex].orderType === 'DROPSHIP') {
        cart.items[itemIndex].resellerSellingPrice = resellerSellingPrice;
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
    const { productId } = req.params;

    let cart = await Cart.findOne({ resellerId: req.user._id });
    if (!cart) throw new ApiError(404, 'Cart not found');

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);

    cart = await recalculateCart(cart);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
        'items.productId',
        'title images sku inventory moq weightGrams dimensions dropshipBasePrice suggestedRetailPrice'
    );

    return res.status(200).json(new ApiResponse(200, populatedCart, 'Item removed from cart'));
});
