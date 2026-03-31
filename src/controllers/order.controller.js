import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { IdempotencyRecord } from '../models/IdempotencyRecord.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createInvoiceFromOrder } from './invoice.controller.js';

export const createOrder = asyncHandler(async (req, res) => {
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (!idempotencyKey) throw new ApiError(400, 'Idempotency key is missing.');

    const existingTransaction = await IdempotencyRecord.findOne({ key: idempotencyKey });
    if (existingTransaction) return res.status(200).json(existingTransaction.response);

    const user = req.user;
    if (user.accountType === 'B2B' && user.kycStatus !== 'APPROVED') {
        throw new ApiError(403, 'Forbidden: Business KYC must be approved to place orders.');
    }

    const { endCustomerDetails, paymentMethod } = req.body;
    const resellerId = req.user._id;

    const cart = await Cart.findOne({ resellerId });
    if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

    const hasDropship = cart.items.some((item) => item.orderType === 'DROPSHIP');
    if (hasDropship && (!endCustomerDetails || !endCustomerDetails.phone)) {
        throw new ApiError(400, 'End Customer details are mandatory for dropship orders');
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const productMap = products.reduce((acc, p) => {
        acc[p._id.toString()] = p;
        return acc;
    }, {});

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const resellerCheck = await User.findById(resellerId).session(session);
        if (!resellerCheck || resellerCheck.walletBalance < cart.grandTotalPlatformCost) {
            throw new ApiError(400, 'Insufficient wallet balance.');
        }

        const dropshipItems = [];
        const wholesaleItems = [];

        cart.items.forEach((item) => {
            const trueProduct = productMap[item.productId.toString()];
            if (!trueProduct) throw new ApiError(404, `Product ${item.productId} unavailable.`);

            const processedItem = {
                productId: item.productId,
                sku: trueProduct.sku,
                title: trueProduct.title,
                hsnCode: trueProduct.hsnCode || '0000',
                qty: item.qty,
                platformBasePrice: item.platformUnitCost,
                resellerSellingPrice: item.resellerSellingPrice,
                
                taxAmountPerUnit: item.taxAmountPerUnit,
                gstSlab: item.gstSlab,
                shippingCost: item.shippingCost || 0,
                actualWeight: item.actualWeight || 0,
                volumetricWeight: item.volumetricWeight || 0,
                billableWeight: item.billableWeight || 0,
            };

            if (item.orderType === 'DROPSHIP') {
                dropshipItems.push(processedItem);
            } else {
                wholesaleItems.push(processedItem);
            }
        });

        const ordersToCreate = [];
        const generatedOrderIds = [];

        
        if (wholesaleItems.length > 0) {
            const whSubTotal = wholesaleItems.reduce(
                (acc, item) => acc + item.platformBasePrice * item.qty,
                0
            );
            const whTaxTotal = wholesaleItems.reduce(
                (acc, item) => acc + item.taxAmountPerUnit * item.qty,
                0
            );
            const whShippingTotal = wholesaleItems.reduce(
                (acc, item) => acc + item.shippingCost,
                0
            );
            const whTotalCost = whSubTotal + whTaxTotal + whShippingTotal;

            const whOrderId = `OD-WH-${Math.floor(1000000 + Math.random() * 9000000)}`;
            generatedOrderIds.push(whOrderId);
            const whActualWeight = wholesaleItems.reduce((acc, item) => acc + item.actualWeight, 0);
            const whVolWeight = wholesaleItems.reduce(
                (acc, item) => acc + item.volumetricWeight,
                0
            );
            const whBillableWeight = wholesaleItems.reduce(
                (acc, item) => acc + item.billableWeight,
                0
            );
            ordersToCreate.push({
                orderId: whOrderId,
                resellerId,
                status: 'PENDING',
                paymentMethod: 'PREPAID_WALLET',
                subTotal: whSubTotal,
                taxTotal: whTaxTotal,
                shippingTotal: whShippingTotal,
                deliveryCharge: cart.totalDeliveryCharge,
                packingCharge: cart.totalPackingCharge,
                totalPlatformCost: whTotalCost,

                
                totalActualWeight: whActualWeight,
                totalVolumetricWeight: whVolWeight,
                totalBillableWeight: whBillableWeight,
                weightType: whVolWeight > whActualWeight ? 'VOLUMETRIC' : 'ACTUAL',

                amountToCollect: 0,
                resellerProfitMargin: 0,
                items: wholesaleItems,
                statusHistory: [
                    { status: 'PENDING', comment: 'Wholesale order placed via Wallet' },
                ],
            });
        }

        
        if (dropshipItems.length > 0) {
            const dsSubTotal = dropshipItems.reduce(
                (acc, item) => acc + item.platformBasePrice * item.qty,
                0
            );
            const dsTaxTotal = dropshipItems.reduce(
                (acc, item) => acc + item.taxAmountPerUnit * item.qty,
                0
            );
            const dsShippingTotal = dropshipItems.reduce((acc, item) => acc + item.shippingCost, 0);

            
            const codCharge = paymentMethod === 'COD' ? 35 : 0;
            const dsTotalCost = dsSubTotal + dsTaxTotal + dsShippingTotal + codCharge;

            const dsOrderId = `OD-DS-${Math.floor(1000000 + Math.random() * 9000000)}`;
            generatedOrderIds.push(dsOrderId);

            let amountToCollect = 0;
            let resellerProfitMargin = 0;
            let resellerPayoutOnDelivery = 0;

            if (paymentMethod === 'COD') {
                amountToCollect = dropshipItems.reduce(
                    (acc, item) => acc + item.resellerSellingPrice * item.qty,
                    0
                );

                
                resellerProfitMargin = amountToCollect - dsTotalCost;

                
                
                resellerPayoutOnDelivery =
                    dsSubTotal + dsTaxTotal + dsShippingTotal + resellerProfitMargin;

                
                if (resellerProfitMargin < 0) {
                    throw new ApiError(
                        400,
                        `Selling price is too low. You are losing ₹${Math.abs(resellerProfitMargin)} on this COD order.`
                    );
                }
            }

            const dsActualWeight = dropshipItems.reduce((acc, item) => acc + item.actualWeight, 0);
            const dsVolWeight = dropshipItems.reduce((acc, item) => acc + item.volumetricWeight, 0);
            const dsBillableWeight = dropshipItems.reduce(
                (acc, item) => acc + item.billableWeight,
                0
            );

            ordersToCreate.push({
                orderId: dsOrderId,
                resellerId,
                endCustomerDetails,
                status: 'PENDING',
                paymentMethod,
                subTotal: dsSubTotal,
                taxTotal: dsTaxTotal,
                shippingTotal: dsShippingTotal,
                codCharge,
                totalPlatformCost: dsTotalCost,

                
                totalActualWeight: dsActualWeight,
                totalVolumetricWeight: dsVolWeight,
                totalBillableWeight: dsBillableWeight,
                weightType: dsVolWeight > dsActualWeight ? 'VOLUMETRIC' : 'ACTUAL',

                amountToCollect,
                resellerProfitMargin,
                payoutOnDelivery: resellerPayoutOnDelivery,
                items: dropshipItems,
                statusHistory: [
                    {
                        status: 'PENDING',
                        comment: `Dropship order placed via Wallet (${paymentMethod})`,
                    },
                ],
            });
        }

        const createdOrders = await Order.insertMany(ordersToCreate, { session });

        for (const orderDoc of createdOrders) {
            await createInvoiceFromOrder(orderDoc, req.user, session);
        }

        const updatedReseller = await User.findByIdAndUpdate(
            resellerId,
            { $inc: { walletBalance: -cart.grandTotalPlatformCost } },
            { returnDocument: 'after', session }
        );

        await WalletTransaction.create(
            [
                {
                    resellerId,
                    type: 'DEBIT',
                    purpose: 'ORDER_DEDUCTION',
                    amount: cart.grandTotalPlatformCost,
                    closingBalance: updatedReseller.walletBalance,
                    referenceId: generatedOrderIds.join(', '),
                    description: `Platform cost deducted for orders: ${generatedOrderIds.join(', ')}`,
                    status: 'COMPLETED',
                },
            ],
            { session }
        );

        for (const item of cart.items) {
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: item.productId, 'inventory.stock': { $gte: item.qty } },
                { $inc: { 'inventory.stock': -item.qty } },
                { session, returnDocument: 'after' }
            );
            if (!updatedProduct) throw new ApiError(400, `Item out of stock.`);
        }

        await Cart.findByIdAndUpdate(
            cart._id,
            {
                items: [],
                subTotalPlatformCost: 0,
                totalTax: 0,
                totalShippingCost: 0,
                grandTotalPlatformCost: 0,
                totalExpectedProfit: 0,
            },
            { session }
        );

        const finalResponse = new ApiResponse(
            201,
            createdOrders,
            `Successfully processed ${createdOrders.length} order(s).`
        );

        await IdempotencyRecord.create([{ key: idempotencyKey, response: finalResponse }], {
            session,
        });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json(finalResponse);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.code === 11000 && error.keyPattern?.key) {
            throw new ApiError(409, 'This order is already being processed. Please wait.');
        }
        throw new ApiError(
            error.statusCode || 500,
            error.message || 'Failed to process order transaction'
        );
    }
});

export const getOrderById = asyncHandler(async (req, res) => {
    
    const order = await Order.findOne({ _id: req.params.id, resellerId: req.user._id });

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return res.status(200).json(new ApiResponse(200, order, 'Order fetched successfully'));
});

export const getMyOrders = asyncHandler(async (req, res) => {
    const resellerId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { resellerId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    const total = await Order.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
            },
            'Orders fetched successfully'
        )
    );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, awbNumber, courierName, ndrReason } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    if (status === 'SHIPPED') order.tracking = { awbNumber, courierName };

    if (status === 'NDR') {
        order.ndrDetails = {
            attemptCount: (order.ndrDetails?.attemptCount || 0) + 1,
            reason: ndrReason || 'Customer Unavailable',
            resellerAction: 'PENDING',
        };
    }

    
    if (['CANCELLED', 'RTO'].includes(status) && !['CANCELLED', 'RTO'].includes(order.status)) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let refundAmount = 0;
            let description = '';

            if (status === 'CANCELLED') {
                
                refundAmount = order.totalPlatformCost;
                description = `Full refund for cancelled order ${order.orderId}`;
            } else if (status === 'RTO') {
                
                refundAmount = order.subTotal + order.taxTotal + order.codCharge;
                description = `RTO Refund (Principal + Tax + COD Fee) for order ${order.orderId}. Freight forfeited.`;
            }

            if (refundAmount > 0) {
                const updatedReseller = await User.findByIdAndUpdate(
                    order.resellerId,
                    { $inc: { walletBalance: refundAmount } },
                    { new: true, session }
                );

                await WalletTransaction.create(
                    [
                        {
                            resellerId: order.resellerId,
                            type: 'CREDIT',
                            purpose: 'REFUND',
                            amount: refundAmount,
                            closingBalance: updatedReseller.walletBalance,
                            referenceId: order.orderId,
                            description: description,
                            status: 'COMPLETED',
                        },
                    ],
                    { session }
                );
            }

            
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { 'inventory.stock': item.qty } },
                    { session }
                );
            }

            order.statusHistory.push({
                status: 'REFUND_PROCESSED',
                comment: `₹${refundAmount} refunded to wallet.`,
            });

            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new ApiError(500, 'Failed to process refund and restore inventory.');
        }
    }

    
    if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
        if (order.payoutOnDelivery > 0 && order.paymentMethod === 'COD') {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                
                const updatedReseller = await User.findByIdAndUpdate(
                    order.resellerId,
                    { $inc: { walletBalance: order.payoutOnDelivery } },
                    { new: true, session }
                );

                
                await WalletTransaction.create(
                    [
                        {
                            resellerId: order.resellerId,
                            type: 'CREDIT',
                            purpose: 'PROFIT_CREDIT',
                            amount: order.payoutOnDelivery,
                            closingBalance: updatedReseller.walletBalance,
                            referenceId: order.orderId,
                            description: `Payout (Principal + ₹${order.resellerProfitMargin} Profit) credited for COD delivery`,
                            status: 'COMPLETED',
                        },
                    ],
                    { session }
                );

                order.statusHistory.push({ status: 'DELIVERED', comment: 'Order delivered' });
                order.statusHistory.push({
                    status: 'PROFIT_CREDITED',
                    comment: `₹${order.payoutOnDelivery} (Principal + Profit) credited to wallet`,
                });

                order.status = 'PROFIT_CREDITED';
                await order.save({ session });

                await session.commitTransaction();
                session.endSession();

                return res
                    .status(200)
                    .json(new ApiResponse(200, order, 'Order delivered and payout credited'));
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw new ApiError(500, 'Failed to process profit payout.');
            }
        }
    }

    const statusComment = {
        PENDING: 'Order placed and awaiting confirmation',
        PROCESSING: 'Order is being processed and packed',
        SHIPPED: awbNumber
            ? `Order shipped via ${courierName} (AWB: ${awbNumber})`
            : 'Order shipped',
        NDR: `Delivery attempt failed: ${ndrReason || 'Customer Unavailable'}`,
        DELIVERED: 'Order delivered to customer',
        RTO: 'Order returned to origin (RTO)',
        CANCELLED: 'Order has been cancelled',
    };

    order.statusHistory.push({
        status,
        comment: statusComment[status] || `Status updated to ${status}`,
    });

    order.status = status;
    await order.save();

    return res.status(200).json(new ApiResponse(200, order, `Order status updated to ${status}`));
});

export const resellerActionOnNDR = asyncHandler(async (req, res) => {
    const { action, updatedPhone } = req.body; 
    const { id } = req.params;
    const resellerId = req.user._id;

    
    if (!['REATTEMPT', 'RTO_REQUESTED'].includes(action)) {
        throw new ApiError(400, 'Invalid NDR action. Must be REATTEMPT or RTO_REQUESTED.');
    }

    
    const order = await Order.findOne({ _id: id, resellerId });
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    
    if (order.status !== 'NDR') {
        throw new ApiError(
            400,
            `Cannot submit NDR action. Order is currently in ${order.status} state.`
        );
    }

    
    order.ndrDetails.resellerAction = action;
    if (updatedPhone) {
        order.ndrDetails.updatedCustomerPhone = updatedPhone;
        
        order.endCustomerDetails.phone = updatedPhone;
    }

    
    order.statusHistory.push({
        status: 'NDR_ACTION_SUBMITTED',
        comment: `Reseller requested: ${action}${updatedPhone ? ` with new phone: ${updatedPhone}` : ''}`,
    });

    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, order, `NDR action '${action}' submitted successfully.`));
});
export const getAllAdminOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};

    
    if (status) {
        query.status = status;
    }

    
    if (search) {
        query.$or = [{ orderId: { $regex: search, $options: 'i' } }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('resellerId', 'name companyName email'); 

    const total = await Order.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit)),
                },
            },
            'All platform orders fetched successfully'
        )
    );
});


const calculateItemWeights = (product, qty) => {
    const actualWeightKg = (product.weightGrams || 0) / 1000;
    const l = product.dimensions?.length || 0;
    const w = product.dimensions?.width || 0;
    const h = product.dimensions?.height || 0;
    const volWeightKg = (l * w * h) / 5000;

    const chargeableWeightPerUnit = Math.max(actualWeightKg, volWeightKg);

    
    const finalBillable = chargeableWeightPerUnit > 0 ? chargeableWeightPerUnit * qty : 0.5 * qty;
    const finalActual = actualWeightKg > 0 ? actualWeightKg * qty : 0.5 * qty;

    return {
        actualWeight: finalActual,
        volumetricWeight: volWeightKg * qty,
        billableWeight: finalBillable,
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
    let packingCharge = 0;

    switch (slab) {
        case 0.5:
            deliveryCharge = 50;
            packingCharge = 10;
            break;
        case 1:
            deliveryCharge = 80;
            packingCharge = 15;
            break;
        case 2:
            deliveryCharge = 100;
            packingCharge = 20;
            break;
        case 3:
            deliveryCharge = 130;
            packingCharge = 25;
            break;
        case 4:
            deliveryCharge = 145;
            packingCharge = 28;
            break;
        case 5:
            deliveryCharge = 160;
            packingCharge = 30;
            break;
        default:
            deliveryCharge = 160 + (slab - 5) * 30;
            packingCharge = 30 + (slab - 5) * 5;
    }
    return { deliveryCharge, packingCharge, totalShippingCost: deliveryCharge + packingCharge };
};

export const createBulkDropshipOrders = asyncHandler(async (req, res) => {
    const { orders } = req.body;
    const resellerId = req.user._id;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
        throw new ApiError(400, 'No valid orders provided.');
    }

    const user = req.user;
    if (user.accountType === 'B2B' && user.kycStatus !== 'APPROVED') {
        throw new ApiError(403, 'Forbidden: Business KYC must be approved to place orders.');
    }

    
    const productIds = [...new Set(orders.map((o) => o.productId))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = products.reduce((acc, p) => {
        acc[p._id.toString()] = p;
        return acc;
    }, {});

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const ordersToCreate = [];
        const generatedOrderIds = [];
        let grandTotalWalletDeduction = 0;

        for (const inputOrder of orders) {
            const product = productMap[inputOrder.productId.toString()];
            if (!product) throw new ApiError(404, `Product unavailable.`);
            if (product.inventory.stock < inputOrder.qty)
                throw new ApiError(400, `Insufficient stock for ${product.sku}`);

            
            const platformBasePrice = product.dropshipBasePrice;
            const subTotal = platformBasePrice * inputOrder.qty;
            const taxAmountPerUnit = Number(
                ((platformBasePrice * product.gstSlab) / 100).toFixed(2)
            );
            const taxTotal = taxAmountPerUnit * inputOrder.qty;

            
            const weights = calculateItemWeights(product, inputOrder.qty);
            const freight = calculateSlabCharge(weights.billableWeight);

            const codCharge = inputOrder.paymentMethod === 'COD' ? 35 : 0;
            const totalPlatformCost = subTotal + taxTotal + freight.totalShippingCost + codCharge;

            
            grandTotalWalletDeduction += totalPlatformCost;

            
            let amountToCollect = 0;
            let resellerProfitMargin = 0;
            let payoutOnDelivery = 0;

            if (inputOrder.paymentMethod === 'COD') {
                amountToCollect = inputOrder.resellerSellingPrice * inputOrder.qty;
                resellerProfitMargin = amountToCollect - totalPlatformCost;
                payoutOnDelivery =
                    subTotal + taxTotal + freight.totalShippingCost + resellerProfitMargin;

                if (resellerProfitMargin < 0) {
                    throw new ApiError(
                        400,
                        `Selling price for ${product.sku} is too low. You would lose money.`
                    );
                }
            }

            const dsOrderId = `OD-BLK-${Math.floor(1000000 + Math.random() * 9000000)}`;
            generatedOrderIds.push(dsOrderId);

            ordersToCreate.push({
                orderId: dsOrderId,
                resellerId,
                endCustomerDetails: inputOrder.endCustomerDetails,
                status: 'PENDING',
                paymentMethod: inputOrder.paymentMethod,

                subTotal,
                taxTotal,
                shippingTotal: freight.totalShippingCost,
                deliveryCharge: freight.deliveryCharge,
                packingCharge: freight.packingCharge,
                codCharge,
                totalPlatformCost,

                totalActualWeight: weights.actualWeight,
                totalVolumetricWeight: weights.volumetricWeight,
                totalBillableWeight: weights.billableWeight,
                weightType:
                    weights.volumetricWeight > weights.actualWeight ? 'VOLUMETRIC' : 'ACTUAL',

                amountToCollect,
                resellerProfitMargin,
                payoutOnDelivery,

                items: [
                    {
                        productId: product._id,
                        sku: product.sku,
                        title: product.title,
                        hsnCode: product.hsnCode || '0000',
                        qty: inputOrder.qty,
                        platformBasePrice,
                        resellerSellingPrice: inputOrder.resellerSellingPrice,
                        taxAmountPerUnit,
                        gstSlab: product.gstSlab,
                        shippingCost: freight.totalShippingCost,
                        actualWeight: weights.actualWeight,
                        volumetricWeight: weights.volumetricWeight,
                        billableWeight: weights.billableWeight,
                    },
                ],
                statusHistory: [
                    { status: 'PENDING', comment: `Bulk dropship order dispatched via CSV` },
                ],
            });
        }

        
        const resellerCheck = await User.findById(resellerId).session(session);
        if (!resellerCheck || resellerCheck.walletBalance < grandTotalWalletDeduction) {
            throw new ApiError(
                400,
                `Insufficient wallet balance. You need ₹${grandTotalWalletDeduction.toLocaleString('en-IN', { maximumFractionDigits: 0 })} for this bulk batch.`
            );
        }

        
        const createdOrders = await Order.insertMany(ordersToCreate, { session });

        for (const orderDoc of createdOrders) {
            await createInvoiceFromOrder(orderDoc, req.user, session);
        }

        const updatedReseller = await User.findByIdAndUpdate(
            resellerId,
            { $inc: { walletBalance: -grandTotalWalletDeduction } },
            { returnDocument: 'after', session }
        );

        await WalletTransaction.create(
            [
                {
                    resellerId,
                    type: 'DEBIT',
                    purpose: 'ORDER_DEDUCTION',
                    amount: grandTotalWalletDeduction,
                    closingBalance: updatedReseller.walletBalance,
                    referenceId:
                        generatedOrderIds.length > 3
                            ? `${generatedOrderIds[0]} + ${generatedOrderIds.length - 1} more`
                            : generatedOrderIds.join(', '),
                    description: `Platform cost deducted for Bulk CSV Dropship (${generatedOrderIds.length} orders)`,
                    status: 'COMPLETED',
                },
            ],
            { session }
        );

        
        for (const inputOrder of orders) {
            await Product.findByIdAndUpdate(
                inputOrder.productId,
                { $inc: { 'inventory.stock': -inputOrder.qty } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    createdOrders,
                    `Successfully dispatched ${createdOrders.length} bulk dropship orders!`
                )
            );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(
            error.statusCode || 500,
            error.message || 'Failed to process bulk orders'
        );
    }
});
