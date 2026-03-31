import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';


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

    
    const weightGroups = {
        WHOLESALE: { billableWeight: 0, shippingCost: 0 },
        DROPSHIP: { billableWeight: 0, shippingCost: 0 },
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

        
        weightGroups[item.orderType].billableWeight += item.billableWeight;
    }

    cart.items = cart.items.filter((item) => !item.toBeRemoved);

    
    let dropshipCharges = { deliveryCharge: 0, packingCharge: 0, totalShippingCost: 0 };
    if (weightGroups.DROPSHIP.billableWeight > 0) {
        dropshipCharges = calculateSlabCharge(weightGroups.DROPSHIP.billableWeight);
    }

    let wholesaleCharges = { deliveryCharge: 0, packingCharge: 0, totalShippingCost: 0 };
    if (weightGroups.WHOLESALE.billableWeight > 0) {
        wholesaleCharges = calculateSlabCharge(weightGroups.WHOLESALE.billableWeight);
    }

    weightGroups.DROPSHIP.shippingCost = dropshipCharges.totalShippingCost;
    weightGroups.WHOLESALE.shippingCost = wholesaleCharges.totalShippingCost;

    const totalShippingCost =
        weightGroups.WHOLESALE.shippingCost + weightGroups.DROPSHIP.shippingCost;

    
    cart.totalDeliveryCharge = dropshipCharges.deliveryCharge + wholesaleCharges.deliveryCharge;
    cart.totalPackingCharge = dropshipCharges.packingCharge + wholesaleCharges.packingCharge;

    
    for (let i = 0; i < cart.items.length; i++) {
        let item = cart.items[i];

        
        const groupTotalWeight = weightGroups[item.orderType].billableWeight;
        if (groupTotalWeight > 0) {
            const weightRatio = item.billableWeight / groupTotalWeight;
            item.shippingCost = Number(
                (weightGroups[item.orderType].shippingCost * weightRatio).toFixed(2)
            );
        } else {
            item.shippingCost = 0;
        }

        item.totalItemPlatformCost = Number(
            ((item.platformUnitCost + item.taxAmountPerUnit) * item.qty).toFixed(2)
        );

        if (item.orderType === 'DROPSHIP') {
            
            const minimumSellingPrice =
                item.platformUnitCost + item.taxAmountPerUnit + item.shippingCost / item.qty;

            if (item.resellerSellingPrice < minimumSellingPrice) {
                item.resellerSellingPrice = Number(minimumSellingPrice.toFixed(2));
            }

            const profitPerUnit = item.resellerSellingPrice - minimumSellingPrice;
            item.expectedProfit = Number((profitPerUnit * item.qty).toFixed(2));
        } else {
            item.expectedProfit = 0;
            item.resellerSellingPrice = 0;
        }

        subTotal += item.platformUnitCost * item.qty;
        totalTax += item.taxAmountPerUnit * item.qty;
        totalExpectedProfit += item.expectedProfit;
    }

    cart.subTotalPlatformCost = Number(subTotal.toFixed(2));
    cart.totalTax = Number(totalTax.toFixed(2));
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
    let cart = await Cart.findOne({ resellerId: req.user._id }).populate(
        'items.productId',
        'title images sku inventory moq weightGrams dimensions dropshipBasePrice suggestedRetailPrice' 
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
        (item) => item.productId.toString() === String(productId) && item.orderType === orderType
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
