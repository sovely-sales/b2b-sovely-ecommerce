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
import { createInvoiceFromOrder, generateInvoiceBuffer } from './invoice.controller.js';
import { logisticsService } from '../services/logistics.service.js';
import { emailService } from '../services/email.service.js';
import { Invoice } from '../models/Invoice.js';
import { Notification } from '../models/Notification.js';
import crypto from 'crypto';
import fs from 'fs';
import Papa from 'papaparse';

const ALLOWED_ORDER_STATUSES = new Set([
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'NDR',
    'DELIVERED',
    'RTO',
    'RTO_DELIVERED',
    'PROFIT_CREDITED',
    'CANCELLED',
]);

const FINAL_REFUND_STATUSES = new Set(['CANCELLED', 'RTO_DELIVERED']);
const STATUS_TRANSITION_RULES = {
    SHIPPED: new Set(['RTO', 'DELIVERED']),
};

const isStatusTransitionAllowed = (currentStatus, targetStatus) => {
    if (!currentStatus || !targetStatus || currentStatus === targetStatus) {
        return true;
    }

    const allowedTargets = STATUS_TRANSITION_RULES[currentStatus];
    return !allowedTargets || allowedTargets.has(targetStatus);
};

const getInvalidTransitionErrorMessage = (currentStatus, targetStatus) => {
    const allowedTargets = STATUS_TRANSITION_RULES[currentStatus];
    if (!allowedTargets) {
        return `Invalid status transition from ${currentStatus} to ${targetStatus}.`;
    }

    return `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed next statuses: ${Array.from(
        allowedTargets
    ).join(', ')}.`;
};

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const getProductTaxTotal = (order) =>
    roundMoney(
        (order.items || []).reduce((total, item) => {
            const perUnitTax = Number(item.taxAmountPerUnit) || 0;
            const quantity = Number(item.qty) || 0;
            return total + perUnitTax * quantity;
        }, 0)
    );

const getRtoDeliveredSettlementBreakdown = (order) => {
    const productTaxTotal = getProductTaxTotal(order);
    const refundProductPrincipalAndTax = roundMoney((order.subTotal || 0) + productTaxTotal);

    const forwardCourierCharge = roundMoney(order.shippingTotal || 0);
    const forwardCourierTax = roundMoney(forwardCourierCharge * 0.18);
    const reverseCourierCharge = roundMoney(forwardCourierCharge + forwardCourierTax);

    return {
        refundProductPrincipalAndTax,
        productTaxTotal,
        reverseCourierCharge,
        forwardCourierCharge,
        forwardCourierTax,
    };
};

const hasStatusInHistory = (order, statusCode) =>
    (order.statusHistory || []).some((entry) => entry.status === statusCode);

const restoreInventoryForOrder = async (order, session) => {
    for (const item of order.items) {
        await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { 'inventory.stock': item.qty } },
            { session }
        );
    }
};

const applyFinalStatusSettlement = async ({ order, targetStatus, session, source = 'MANUAL' }) => {
    const sourceSuffix = source === 'BULK_SYNC' ? ' (via Bulk Sync)' : '';
    const sourceCommentSuffix = source === 'BULK_SYNC' ? ' via bulk sync' : '';

    const hasRefundProcessed = hasStatusInHistory(order, 'REFUND_PROCESSED');
    const hasPenaltyApplied = hasStatusInHistory(order, 'RTO_PENALTY_APPLIED');
    const hasInventoryRestocked = hasStatusInHistory(order, 'RESTOCKED');

    let refundAmount = 0;
    let refundDescription = '';
    let reverseChargeAmount = 0;
    let reverseChargeTax = 0;
    let reverseChargeDescription = '';

    if (targetStatus === 'CANCELLED' && !hasRefundProcessed) {
        refundAmount = roundMoney(order.totalPlatformCost);
        refundDescription = `Full refund for cancelled order ${order.orderId}${sourceSuffix}`;
    }

    if (targetStatus === 'RTO_DELIVERED') {
        const {
            refundProductPrincipalAndTax,
            reverseCourierCharge,
            forwardCourierTax,
            forwardCourierCharge,
        } = getRtoDeliveredSettlementBreakdown(order);

        if (!hasRefundProcessed) {
            refundAmount = refundProductPrincipalAndTax;
            refundDescription = `RTO delivered refund (Product Price + Product Tax) for order ${order.orderId}${sourceSuffix}`;
        }

        if (!hasPenaltyApplied) {
            reverseChargeAmount = reverseCourierCharge;
            reverseChargeTax = forwardCourierTax;
            reverseChargeDescription = `RTO delivered reverse courier charge (Forward freight ₹${forwardCourierCharge} + tax ₹${forwardCourierTax}) for order ${order.orderId}${sourceSuffix}`;
        }
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
                    referenceId: `REF-${order.orderId}`,
                    description: refundDescription,
                    status: 'COMPLETED',
                },
            ],
            { session }
        );

        order.statusHistory.push({
            status: 'REFUND_PROCESSED',
            comment: `₹${refundAmount} refunded to wallet${sourceCommentSuffix}.`,
        });
    }

    if (reverseChargeAmount > 0) {
        const updatedReseller = await User.findByIdAndUpdate(
            order.resellerId,
            { $inc: { walletBalance: -reverseChargeAmount } },
            { new: true, session }
        );

        await WalletTransaction.create(
            [
                {
                    resellerId: order.resellerId,
                    type: 'DEBIT',
                    purpose: 'RTO_PENALTY',
                    amount: reverseChargeAmount,
                    closingBalance: updatedReseller.walletBalance,
                    referenceId: `RTO-${order.orderId}`,
                    description: reverseChargeDescription,
                    status: 'COMPLETED',
                },
            ],
            { session }
        );

        order.statusHistory.push({
            status: 'RTO_PENALTY_APPLIED',
            comment: `₹${reverseChargeAmount} reverse courier charge debited (Tax ₹${reverseChargeTax})${sourceCommentSuffix}.`,
        });
    }

    if (!hasInventoryRestocked) {
        await restoreInventoryForOrder(order, session);
        order.statusHistory.push({
            status: 'RESTOCKED',
            comment: `Inventory automatically restored due to ${targetStatus}${sourceCommentSuffix}.`,
        });
    }

    return {
        refundAmount,
        reverseChargeAmount,
    };
};

export const createOrder = asyncHandler(async (req, res) => {
    const rawIdempotencyKey = req.headers['x-idempotency-key'];
    if (!rawIdempotencyKey) throw new ApiError(400, 'Idempotency key is missing.');

    const idempotencyKey = `${req.user._id}:${rawIdempotencyKey}`;

    const existingTransaction = await IdempotencyRecord.findOne({ key: idempotencyKey });
    if (existingTransaction) return res.status(200).json(existingTransaction.response);

    const { paymentMethods = {}, platformOrderNos = {}, wholesaleBranchId } = req.body;
    const resellerId = req.user._id;

    const cart = await Cart.findOne({ resellerId });
    if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

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
        if (!resellerCheck) throw new ApiError(404, 'Reseller account not found.');

        const wholesaleItems = [];
        const dropshipGroups = {};

        cart.items.forEach((item) => {
            const trueProduct = productMap[item.productId.toString()];
            if (!trueProduct) throw new ApiError(404, `Product ${item.productId} unavailable.`);

            let currentPlatformPrice = trueProduct.dropshipBasePrice;

            const currentTaxPerUnit = Number(
                ((currentPlatformPrice * trueProduct.gstSlab) / 100).toFixed(2)
            );

            const processedItem = {
                productId: item.productId,
                sku: trueProduct.sku,
                title: trueProduct.title,
                image: trueProduct.images?.[0]?.url || '',
                hsnCode: trueProduct.hsnCode || '0000',
                qty: item.qty,

                platformBasePrice: currentPlatformPrice,
                taxAmountPerUnit: currentTaxPerUnit,
                gstSlab: trueProduct.gstSlab,

                resellerSellingPrice: item.resellerSellingPrice || 0,

                shippingCost: item.shippingCost || 0,
                actualWeight: item.actualWeight || 0,
                volumetricWeight: item.volumetricWeight || 0,
                billableWeight: item.billableWeight || 0,
            };

            if (item.orderType === 'DROPSHIP') {
                const customer = item.endCustomerDetails;
                if (!customer || !customer.phone) {
                    throw new ApiError(
                        400,
                        'One or more dropship items are missing destination details.'
                    );
                }

                const groupKey = `DROPSHIP_${customer.phone}_${customer.address.zip}`;
                if (!dropshipGroups[groupKey]) {
                    const groupPlatformId = platformOrderNos[groupKey] || '';
                    dropshipGroups[groupKey] = {
                        customerDetails: customer,
                        items: [],
                        platformOrderNo: groupPlatformId,
                    };
                }
                dropshipGroups[groupKey].items.push(processedItem);
            } else {
                wholesaleItems.push(processedItem);
            }
        });

        const ordersToCreate = [];
        const generatedOrderIds = [];

        if (wholesaleItems.length > 0) {
            let selectedBranch = null;
            if (wholesaleBranchId && resellerCheck.branches && resellerCheck.branches.length > 0) {
                selectedBranch = resellerCheck.branches.find(
                    (b) => b._id.toString() === wholesaleBranchId
                );
            }

            const finalGstin = selectedBranch?.gstin || resellerCheck.gstin;
            const finalAddress = selectedBranch?.address || resellerCheck.billingAddress;

            const buyerSnapshot = {
                name: resellerCheck.name,
                companyName: resellerCheck.companyName,
                phone: resellerCheck.phoneNumber,
                gstin: finalGstin,
                address: finalAddress,
            };

            const whActualWeight = wholesaleItems.reduce((acc, item) => acc + item.actualWeight, 0);
            const whVolWeight = wholesaleItems.reduce(
                (acc, item) => acc + item.volumetricWeight,
                0
            );
            const whBillableWeight = wholesaleItems.reduce(
                (acc, item) => acc + item.billableWeight,
                0
            );

            const whFreight = calculateSlabCharge(whBillableWeight);
            const finalShippingTotal = whFreight.totalShippingCost;

            const whSubTotal = wholesaleItems.reduce(
                (acc, item) => acc + item.platformBasePrice * item.qty,
                0
            );
            const whItemTaxTotal = wholesaleItems.reduce(
                (acc, item) => acc + item.taxAmountPerUnit * item.qty,
                0
            );

            const whShippingTax = Number((finalShippingTotal * 0.18).toFixed(2));
            const whTaxTotal = whItemTaxTotal + whShippingTax;

            const whTotalCost = whSubTotal + whTaxTotal + finalShippingTotal;

            const whOrderId = `Sov-${Math.floor(10000000 + Math.random() * 90000000)}`;
            generatedOrderIds.push(whOrderId);

            ordersToCreate.push({
                orderId: whOrderId,
                resellerId,
                billingDetails: buyerSnapshot,
                shippingDetails: buyerSnapshot,
                status: 'PENDING',
                paymentMethod: 'PREPAID_WALLET',
                subTotal: whSubTotal,
                taxTotal: whTaxTotal,
                shippingTotal: finalShippingTotal,
                deliveryCharge: whFreight.deliveryCharge,
                packingCharge: whFreight.packingCharge,
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

        for (const [groupKey, group] of Object.entries(dropshipGroups)) {
            const dsItems = group.items;
            const customer = group.customerDetails;
            const currentPaymentMethod = paymentMethods[groupKey] || 'COD';

            const dsActualWeight = dsItems.reduce((acc, item) => acc + item.actualWeight, 0);
            const dsVolWeight = dsItems.reduce((acc, item) => acc + item.volumetricWeight, 0);
            const dsBillableWeight = dsItems.reduce((acc, item) => acc + item.billableWeight, 0);

            const freight = calculateSlabCharge(dsBillableWeight);
            const dsShippingTotal = freight.totalShippingCost;

            const dsSubTotal = dsItems.reduce(
                (acc, item) => acc + item.platformBasePrice * item.qty,
                0
            );
            const dsItemTaxTotal = dsItems.reduce(
                (acc, item) => acc + item.taxAmountPerUnit * item.qty,
                0
            );

            const codCharge = currentPaymentMethod === 'COD' ? 35 : 0;
            const codTax = Number((codCharge * 0.18).toFixed(2));
            const dsShippingTax = Number((dsShippingTotal * 0.18).toFixed(2));

            const dsTaxTotal = dsItemTaxTotal + dsShippingTax + codTax;
            const dsTotalCost = dsSubTotal + dsTaxTotal + dsShippingTotal + codCharge;

            const dsOrderId = `Sov-${Math.floor(10000000 + Math.random() * 90000000)}`;
            generatedOrderIds.push(dsOrderId);

            const totalCustomerPayment = dsItems.reduce(
                (acc, item) => acc + item.resellerSellingPrice * item.qty,
                0
            );

            let amountToCollect = 0;
            let payoutOnDelivery = 0;
            let resellerProfitMargin = totalCustomerPayment - dsTotalCost;

            if (currentPaymentMethod === 'COD') {
                amountToCollect = totalCustomerPayment;

                payoutOnDelivery = amountToCollect;
            }

            if (resellerProfitMargin < 0) {
                const deficit = roundMoney(Math.abs(resellerProfitMargin));
                throw new ApiError(
                    400,
                    `Selling price for destination ${customer.address.zip} is too low by ₹${deficit.toFixed(
                        2
                    )}. Minimum customer total required is ₹${roundMoney(dsTotalCost).toFixed(
                        2
                    )}, current is ₹${roundMoney(totalCustomerPayment).toFixed(2)}.`
                );
            }

            ordersToCreate.push({
                orderId: dsOrderId,
                resellerId,
                endCustomerDetails: customer,
                status: 'PENDING',
                platformOrderNo: group.platformOrderNo,
                paymentMethod: currentPaymentMethod,
                subTotal: dsSubTotal,
                taxTotal: dsTaxTotal,
                shippingTotal: dsShippingTotal,
                deliveryCharge: freight.deliveryCharge,
                packingCharge: freight.packingCharge,
                codCharge,
                totalPlatformCost: dsTotalCost,

                totalActualWeight: dsActualWeight,
                totalVolumetricWeight: dsVolWeight,
                totalBillableWeight: dsBillableWeight,
                weightType: dsVolWeight > dsActualWeight ? 'VOLUMETRIC' : 'ACTUAL',

                amountToCollect,
                resellerProfitMargin,
                payoutOnDelivery,
                items: dsItems,
                statusHistory: [
                    {
                        status: 'PENDING',
                        comment: `Dropship order placed (${currentPaymentMethod})`,
                    },
                ],
            });
        }

        const calculatedFinalTotal = ordersToCreate.reduce(
            (acc, o) => acc + o.totalPlatformCost,
            0
        );

        if (resellerCheck.walletBalance < calculatedFinalTotal) {
            throw new ApiError(
                400,
                `Insufficient wallet balance. Total required: ₹${calculatedFinalTotal.toFixed(2)}, Available: ₹${resellerCheck.walletBalance}`
            );
        }

        const createdOrders = await Order.insertMany(ordersToCreate, { session });

        for (const orderDoc of createdOrders) {
            await createInvoiceFromOrder(orderDoc, req.user, session);
        }

        const updatedReseller = await User.findByIdAndUpdate(
            resellerId,
            { $inc: { walletBalance: -calculatedFinalTotal } },
            { returnDocument: 'after', session }
        );

        const secureHash = crypto.randomBytes(4).toString('hex').toUpperCase();

        await WalletTransaction.create(
            [
                {
                    resellerId,
                    type: 'DEBIT',
                    purpose: 'ORDER_DEDUCTION',
                    amount: calculatedFinalTotal,
                    closingBalance: updatedReseller.walletBalance,
                    referenceId: `ORD-${secureHash}`,
                    description: `Platform cost deducted for ${generatedOrderIds.length} order(s): ${generatedOrderIds.join(', ')}`,
                    status: 'COMPLETED',
                },
            ],
            { session }
        );

        const productQtyMap = {};
        for (const item of cart.items) {
            const pid = item.productId.toString();
            productQtyMap[pid] = (productQtyMap[pid] || 0) + item.qty;
        }

        const bulkOperations = Object.entries(productQtyMap).map(([productId, totalQty]) => ({
            updateOne: {
                filter: { _id: productId, 'inventory.stock': { $gte: totalQty } },
                update: { $inc: { 'inventory.stock': -totalQty } },
            },
        }));

        const bulkResult = await Product.bulkWrite(bulkOperations, { session });

        if (bulkResult.modifiedCount !== Object.keys(productQtyMap).length) {
            throw new ApiError(
                400,
                'Checkout failed: One or more items went out of stock during processing.'
            );
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

        const wholesaleOrders = createdOrders.filter((o) => o.orderId.startsWith('OD-WH'));
        if (wholesaleOrders.length > 0) {
            try {
                const admins = await User.find({ role: 'ADMIN' });
                for (const whOrder of wholesaleOrders) {
                    if (admins.length > 0) {
                        const adminNotifs = admins.map((admin) => ({
                            recipientId: admin._id,
                            type: 'ORDER_APPROVAL_REQUIRED',
                            title: 'Action Required: Bulk Order Pending',
                            message: `${req.user.companyName || req.user.name} placed a bulk order (${whOrder.orderId}) for ₹${whOrder.totalPlatformCost.toLocaleString('en-IN')}. Requires authorization & E-Way Bill.`,
                            referenceData: {
                                referenceId: whOrder.orderId,
                                referenceType: 'Order',
                                actionUrl: `/admin/orders?search=${whOrder.orderId}`,
                            },
                        }));
                        await Notification.insertMany(adminNotifs);
                        await emailService.sendAdminNewOrderAlert(admins[0], whOrder, req.user);
                    }
                }
            } catch (alertError) {
                console.error('Failed to trigger Admin Wholesale alerts:', alertError);
            }
        }

        Promise.all(
            createdOrders.map(async (orderDoc) => {
                try {
                    const invoiceDoc = await Invoice.findOne({ orderId: orderDoc._id });
                    if (invoiceDoc) {
                        const pdfBuffer = await generateInvoiceBuffer(invoiceDoc, req.user);
                        await emailService.sendInvoiceEmail(
                            req.user,
                            orderDoc,
                            invoiceDoc,
                            pdfBuffer
                        );
                    }
                } catch (emailErr) {
                    console.error(`Failed to send email for order ${orderDoc.orderId}:`, emailErr);
                }
            })
        ).catch(console.error);

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
    const order = await Order.findOne({ _id: req.params.id, resellerId: req.user._id }).populate(
        'items.productId',
        'images title'
    );

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return res.status(200).json(new ApiResponse(200, order, 'Order fetched successfully'));
});

export const getMyOrders = asyncHandler(async (req, res) => {
    const resellerId = req.user._id;
    const { status, search, sort = 'latest', page = 1, limit = 10, startDate, endDate } = req.query;

    const query = { resellerId };

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        query.createdAt = {
            $gte: start,
            $lte: end,
        };
    }

    if (status && status !== 'ALL') {
        if (status === 'PENDING_PROCESSING') {
            query.status = { $in: ['PENDING', 'PROCESSING'] };
        } else {
            query.status = status;
        }
    }

    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(safeSearch, 'i');
        query.$or = [
            { orderId: { $regex: searchRegex } },
            { 'endCustomerDetails.name': { $regex: searchRegex } },
            { 'endCustomerDetails.phone': { $regex: searchRegex } },
            { 'items.sku': { $regex: searchRegex } },
            { 'items.title': { $regex: searchRegex } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortParams = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const orders = await Order.find(query)
        .sort(sortParams)
        .skip(skip)
        .limit(Number(limit))
        .populate('items.productId', 'images title');

    const total = await Order.countDocuments(query);
    const currentPage = Number(page);
    const totalPages = Math.ceil(total / Number(limit));

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                pagination: {
                    total,
                    page: currentPage,
                    pages: totalPages,
                    hasNextPage: currentPage < totalPages,
                },
            },
            'Orders fetched successfully'
        )
    );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, awbNumber, courierName, ndrReason, platformOrderNo } = req.body;
    const { id } = req.params;
    const normalizedStatus =
        typeof status === 'string' ? status.trim().toUpperCase().replace(/\s+/g, '_') : '';

    if (!normalizedStatus || !ALLOWED_ORDER_STATUSES.has(normalizedStatus)) {
        throw new ApiError(400, 'Invalid order status');
    }

    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    if (!isStatusTransitionAllowed(order.status, normalizedStatus)) {
        throw new ApiError(400, getInvalidTransitionErrorMessage(order.status, normalizedStatus));
    }

    if (awbNumber !== undefined || courierName !== undefined) {
        order.tracking = {
            awbNumber: awbNumber || order.tracking?.awbNumber || '',
            courierName: courierName || order.tracking?.courierName || '',
            trackingUrl: order.tracking?.trackingUrl || '',
        };
    }

    // Update platform order number if provided
    if (platformOrderNo !== undefined) {
        order.platformOrderNo = platformOrderNo;
    }

    if (normalizedStatus === 'NDR') {
        order.ndrDetails = {
            attemptCount: (order.ndrDetails?.attemptCount || 0) + 1,
            reason: ndrReason || 'Customer Unavailable',
            resellerAction: 'PENDING',
        };
    }

    const statusComment = {
        PENDING: 'Order placed and awaiting confirmation',
        PROCESSING: 'Order is being processed and packed',
        SHIPPED: awbNumber
            ? `Order shipped via ${courierName} (AWB: ${awbNumber})`
            : 'Order shipped',
        NDR: `Delivery attempt failed: ${ndrReason || 'Customer Unavailable'}`,
        DELIVERED: 'Order delivered to customer',
        RTO: 'Order marked as RTO (in transit to origin)',
        RTO_DELIVERED: 'RTO delivered to origin (final return)',
        CANCELLED: 'Order has been cancelled',
    };

    if (FINAL_REFUND_STATUSES.has(normalizedStatus) && !FINAL_REFUND_STATUSES.has(order.status)) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            order.statusHistory.push({
                status: normalizedStatus,
                comment: statusComment[normalizedStatus] || `Status updated to ${normalizedStatus}`,
            });

            await applyFinalStatusSettlement({
                order,
                targetStatus: normalizedStatus,
                session,
            });

            order.status = normalizedStatus;
            await order.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res
                .status(200)
                .json(new ApiResponse(200, order, `Order status updated to ${normalizedStatus}`));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new ApiError(500, 'Failed to process final settlement for this order status.');
        }
    }

    if (
        normalizedStatus === 'DELIVERED' &&
        !['DELIVERED', 'PROFIT_CREDITED'].includes(order.status)
    ) {
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
                            referenceId: `PRO-${order.orderId}`,
                            description: `Payout (Principal + ₹${order.resellerProfitMargin} Profit) credited for COD delivery`,
                            status: 'COMPLETED',
                        },
                    ],
                    { session }
                );

                order.statusHistory.push({
                    status: 'DELIVERED',
                    comment: statusComment.DELIVERED,
                });
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

    if (
        !['CANCELLED', 'RTO_DELIVERED', 'DELIVERED'].includes(normalizedStatus) ||
        (normalizedStatus === 'DELIVERED' && order.paymentMethod !== 'COD')
    ) {
        order.statusHistory.push({
            status: normalizedStatus,
            comment: statusComment[normalizedStatus] || `Status updated to ${normalizedStatus}`,
        });
    }

    order.status = normalizedStatus;
    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, order, `Order status updated to ${normalizedStatus}`));
});

export const resellerActionOnNDR = asyncHandler(async (req, res) => {
    const { action, updatedPhone, updatedAddress } = req.body;
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

    try {
        await logisticsService.submitNdrAction(order, action, updatedPhone, updatedAddress);
    } catch (logisticsError) {
        throw new ApiError(500, `Logistics service error: ${logisticsError.message}`);
    }

    order.ndrDetails.resellerAction = action;

    let commentDetails = `Reseller requested: ${action}`;

    if (updatedPhone) {
        order.ndrDetails.updatedCustomerPhone = updatedPhone;

        if (order.endCustomerDetails) {
            order.endCustomerDetails.phone = updatedPhone;
        } else if (order.shippingDetails) {
            order.shippingDetails.phone = updatedPhone;
        }
        commentDetails += ` | Phone updated to: ${updatedPhone}`;
    }

    if (updatedAddress) {
        if (order.endCustomerDetails?.address) {
            order.endCustomerDetails.address.street = `${order.endCustomerDetails.address.street} [UPDATE: ${updatedAddress}]`;
        } else if (order.shippingDetails?.address) {
            order.shippingDetails.address.street = `${order.shippingDetails.address.street} [UPDATE: ${updatedAddress}]`;
        }
        commentDetails += ` | Address notes added: ${updatedAddress}`;
    }

    order.statusHistory.push({
        status: 'NDR_ACTION_SUBMITTED',
        comment: commentDetails,
    });

    await order.save();

    try {
        const admins = await User.find({ role: 'ADMIN' });
        if (admins.length > 0) {
            const adminNotifs = admins.map((admin) => ({
                recipientId: admin._id,
                type: 'NDR_ACTION_REQUIRED',
                title: `NDR Alert: ${action === 'REATTEMPT' ? 'Re-delivery Requested' : 'RTO Requested'}`,
                message: `${req.user.companyName || req.user.name} requested a ${action === 'REATTEMPT' ? 're-delivery' : 'Return to Origin'} for order ${order.orderId}. Please inform the warehouse.`,
                referenceData: {
                    referenceId: order.orderId,
                    referenceType: 'Order',
                    actionUrl: `/admin/orders?search=${order.orderId}`,
                },
            }));
            await Notification.insertMany(adminNotifs);
        }
    } catch (notifErr) {
        console.error('Failed to send Admin NDR Notification:', notifErr);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, `NDR action '${action}' submitted successfully.`));
});

export const getAllAdminOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = {};

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
    }

    if (status) {
        query.status = status;
    }

    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const matchingUsers = await User.find({
            $or: [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { companyName: { $regex: safeSearch, $options: 'i' } },
                { gstin: { $regex: safeSearch, $options: 'i' } },
            ],
        }).select('_id');

        const userIds = matchingUsers.map((u) => u._id);

        query['$or'] = [
            { orderId: { $regex: safeSearch, $options: 'i' } },
            { platformOrderNo: { $regex: safeSearch, $options: 'i' } },
            { 'endCustomerDetails.name': { $regex: safeSearch, $options: 'i' } },
            { 'endCustomerDetails.phone': { $regex: safeSearch, $options: 'i' } },
            { 'tracking.awbNumber': { $regex: safeSearch, $options: 'i' } },
        ];

        if (userIds.length > 0) {
            query['$or'].push({ resellerId: { $in: userIds } });
        }
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .populate('resellerId', 'name email companyName phoneNumber gstin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            },
            'Orders fetched successfully'
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

            const weights = calculateItemWeights(product, inputOrder.qty);
            const freight = calculateSlabCharge(weights.billableWeight);

            const codCharge = inputOrder.paymentMethod === 'COD' ? 35 : 0;
            const freightTax = Number((freight.totalShippingCost * 0.18).toFixed(2));
            const codTax = Number((codCharge * 0.18).toFixed(2));

            const itemTaxTotal = taxAmountPerUnit * inputOrder.qty;
            const taxTotal = itemTaxTotal + freightTax + codTax;
            const totalPlatformCost = subTotal + taxTotal + freight.totalShippingCost + codCharge;

            grandTotalWalletDeduction += totalPlatformCost;

            const totalCustomerPayment = inputOrder.resellerSellingPrice * inputOrder.qty;
            let amountToCollect = 0;
            let payoutOnDelivery = 0;
            let resellerProfitMargin = totalCustomerPayment - totalPlatformCost;

            if (inputOrder.paymentMethod === 'COD') {
                amountToCollect = totalCustomerPayment;

                payoutOnDelivery = amountToCollect;
            }

            if (resellerProfitMargin < 0) {
                throw new ApiError(
                    400,
                    `Selling price for ${product.sku} is too low. You would lose money.`
                );
            }

            const dsOrderId = `Sov-${Math.floor(10000000 + Math.random() * 90000000)}`;
            generatedOrderIds.push(dsOrderId);

            ordersToCreate.push({
                orderId: dsOrderId,
                resellerId,
                endCustomerDetails: inputOrder.endCustomerDetails,
                platformOrderNo: inputOrder.platformId || '',
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
                        image: product.images?.[0]?.url || '',
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

        const secureHash = crypto.randomBytes(4).toString('hex').toUpperCase();

        await WalletTransaction.create(
            [
                {
                    resellerId,
                    type: 'DEBIT',
                    purpose: 'ORDER_DEDUCTION',
                    amount: grandTotalWalletDeduction,
                    closingBalance: updatedReseller.walletBalance,
                    referenceId: `ORD-${secureHash}`,
                    description: `Platform cost deducted for Bulk CSV Dropship (${generatedOrderIds.length} orders)`,
                    status: 'COMPLETED',
                },
            ],
            { session }
        );

        const productQtyMap = {};
        for (const inputOrder of orders) {
            const pid = inputOrder.productId.toString();
            productQtyMap[pid] = (productQtyMap[pid] || 0) + inputOrder.qty;
        }

        const bulkOperations = Object.entries(productQtyMap).map(([productId, totalQty]) => ({
            updateOne: {
                filter: { _id: productId, 'inventory.stock': { $gte: totalQty } },
                update: { $inc: { 'inventory.stock': -totalQty } },
            },
        }));

        const bulkResult = await Product.bulkWrite(bulkOperations, { session });

        if (bulkResult.modifiedCount !== Object.keys(productQtyMap).length) {
            throw new ApiError(
                400,
                'Inventory conflict: One or more products have insufficient stock to fulfill the bulk batch.'
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

export const exportAdminOrdersToCsv = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        query.createdAt = {
            $gte: start,
            $lte: end,
        };
    }

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate('resellerId', 'name companyName email phoneNumber billingAddress');

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        if (/^\+?\d{10,}$/.test(str) || /^\d{5,6}$/.test(str)) {
            str = `\t${str}`;
        }
        return `"${str}"`;
    };

    const headers = [
        'Wukusy Order No',
        'First Name',
        'Last Name',
        'Mobile',
        'Shipping Address 1',
        'City',
        'State',
        'Pincode',
        'Company',
        'SKU',
        'Quantity',
        'Selling Price',
        'Status',
        'Platform Order No',
        'Courier',
        'Tracking',
    ];

    let csvContent = '\uFEFF' + headers.map(escapeCsv).join(',') + '\n';

    orders.forEach((order) => {
        const isDropship = !!order.endCustomerDetails?.name;
        const reseller = order.resellerId || {};

        const fullName = (isDropship ? order.endCustomerDetails?.name : reseller.name) || '';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const company = reseller.companyName || '';
        const phone = (isDropship ? order.endCustomerDetails?.phone : reseller.phoneNumber) || '';
        const shippingAddress1 =
            (isDropship
                ? order.endCustomerDetails?.address?.street
                : reseller.billingAddress?.street) || '';
        const city =
            (isDropship
                ? order.endCustomerDetails?.address?.city
                : reseller.billingAddress?.city) || '';
        const state =
            (isDropship
                ? order.endCustomerDetails?.address?.state
                : reseller.billingAddress?.state) || '';
        const pincode =
            (isDropship ? order.endCustomerDetails?.address?.zip : reseller.billingAddress?.zip) ||
            '';

        order.items.forEach((item) => {
            const row = [
                order.orderId,
                firstName,
                lastName,
                phone,
                shippingAddress1,
                city,
                state,
                pincode,
                company,
                item.sku,
                item.qty,
                item.resellerSellingPrice,
                order.status,
                '', // Platform Order No
                '', // Courier
                '', // Tracking
            ];
            csvContent += row.map(escapeCsv).join(',') + '\n';
        });
    });

    res.setHeader('Content-Type', 'text/csv');
    const filename =
        startDate && endDate ? `orders_export_${startDate}_to_${endDate}.csv` : 'orders_export.csv';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
});

export const exportMyOrdersToCsv = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = { resellerId: req.user._id };
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        query.createdAt = {
            $gte: start,
            $lte: end,
        };
    }

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate('resellerId', 'name companyName email phoneNumber billingAddress');

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        if (/^\+?\d{10,}$/.test(str) || /^\d{5,6}$/.test(str)) {
            str = `\t${str}`;
        }
        return `"${str}"`;
    };

    const headers = [
        'Sovely Order ID',
        'Marketplace Ref ID',
        'First Name',
        'Last Name',
        'Mobile',
        'Shipping Address 1',
        'City',
        'State',
        'Pincode',
        'Company',
        'SKU',
        'Quantity',
        'Selling Price',
        'Status',
        'Seller GSTIN',
        'Seller Name',
    ];

    let csvContent = '\uFEFF' + headers.map(escapeCsv).join(',') + '\n';

    orders.forEach((order) => {
        const isDropship = !!order.endCustomerDetails?.name;
        const reseller = order.resellerId || {};

        const fullName = (isDropship ? order.endCustomerDetails?.name : reseller.name) || '';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const company = reseller.companyName || '';
        const phone = (isDropship ? order.endCustomerDetails?.phone : reseller.phoneNumber) || '';
        const shippingAddress1 =
            (isDropship
                ? order.endCustomerDetails?.address?.street
                : reseller.billingAddress?.street) || '';
        const city =
            (isDropship
                ? order.endCustomerDetails?.address?.city
                : reseller.billingAddress?.city) || '';
        const state =
            (isDropship
                ? order.endCustomerDetails?.address?.state
                : reseller.billingAddress?.state) || '';
        const pincode =
            (isDropship ? order.endCustomerDetails?.address?.zip : reseller.billingAddress?.zip) ||
            '';

        order.items.forEach((item) => {
            const row = [
                order.orderId,
                order.platformOrderNo || '',
                firstName,
                lastName,
                phone,
                shippingAddress1,
                city,
                state,
                pincode,
                company,
                item.sku,
                item.qty,
                item.resellerSellingPrice,
                order.status,
                '29DTGPS4598H2ZR',
                'Infinity Enterprises',
            ];
            csvContent += row.map(escapeCsv).join(',') + '\n';
        });
    });

    res.setHeader('Content-Type', 'text/csv');
    const filename =
        startDate && endDate
            ? `my_orders_export_${startDate}_to_${endDate}.csv`
            : 'my_orders_export.csv';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
});

export const exportCourierOrdersToCsv = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        };
    }

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate('resellerId', 'name companyName email phoneNumber billingAddress');

    const headers = [
        'Wukusy Order No',
        'First Name',
        'Last Name',
        'Company',
        'Mobile',
        'Shipping Address 1',
        'Shipping Address 2',
        'City',
        'State',
        'Pincode',
        'SKU',
        'Quantity',
        'Payment Method',
        'Selling Price',
        'Status',
        'Platform Order No',
        'Courier',
        'Tracking',
    ];

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        if (/^\+?\d{10,}$/.test(str) || /^\d{5,6}$/.test(str)) {
            str = `\t${str}`;
        }
        return `"${str}"`;
    };

    let csvContent = headers.map((h) => `"${h}"`).join(',') + '\n';

    orders.forEach((order) => {
        const isDropship = !!order.endCustomerDetails?.name;

        let firstName = '';
        let lastName = '';
        let company = '';
        let mobile = '';
        let address1 = '';
        let address2 = '';
        let city = '';
        let state = '';
        let pincode = '';

        if (isDropship) {
            const nameParts = (order.endCustomerDetails.name || '').split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
            mobile = order.endCustomerDetails.phone || '';
            address1 = order.endCustomerDetails.address?.street || '';
            city = order.endCustomerDetails.address?.city || '';
            state = order.endCustomerDetails.address?.state || '';
            pincode = order.endCustomerDetails.address?.zip || '';
        } else {
            const nameParts = (order.resellerId?.name || '').split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
            company = order.resellerId?.companyName || '';
            mobile = order.resellerId?.phoneNumber || order.resellerId?.email || '';
            address1 = order.resellerId?.billingAddress?.street || '';
            city = order.resellerId?.billingAddress?.city || '';
            state = order.resellerId?.billingAddress?.state || '';
            pincode = order.resellerId?.billingAddress?.zip || '';
        }

        order.items.forEach((item) => {
            const row = [
                order.orderId,
                firstName,
                lastName,
                company,
                mobile,
                address1,
                address2,
                city,
                state,
                pincode,
                item.sku,
                item.qty,
                order.paymentMethod,
                item.resellerSellingPrice || item.platformBasePrice,
                order.status, // Status
                order.platformOrderNo || '', // Platform Order No
                '', // Courier
                '', // Tracking
            ];

            csvContent += row.map(escapeCsv).join(',') + '\n';
        });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="courier_orders_export.csv"');
    return res.status(200).send(csvContent);
});

export const adminDispatchOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
        throw new ApiError(
            400,
            `Cannot dispatch an order that is currently in ${order.status} state.`
        );
    }

    const shipmentDetails = await logisticsService.createShipment(order);

    order.tracking = {
        awbNumber: shipmentDetails.awb,
        courierName: shipmentDetails.courierName,
        trackingUrl: shipmentDetails.trackingUrl,
    };

    order.status = 'SHIPPED';
    order.statusHistory.push({
        status: 'SHIPPED',
        comment: `Order packed and dispatched via ${shipmentDetails.courierName}. AWB: ${shipmentDetails.awb}`,
    });

    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, order, 'Order successfully dispatched and AWB generated.'));
});

export const adminAuthorizeOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { ewayBillNumber } = req.body;

    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.status !== 'PENDING') {
        throw new ApiError(400, `Order is already in ${order.status} state.`);
    }

    if (ewayBillNumber) {
        order.ewayBillNumber = ewayBillNumber;
    }

    order.status = 'PROCESSING';

    let comment = 'Order authorized and processing started.';
    if (ewayBillNumber) {
        comment += ` E-way Bill Generated: ${ewayBillNumber}`;
    }

    order.statusHistory.push({ status: 'PROCESSING', comment });

    await order.save();

    try {
        const reseller = await User.findById(order.resellerId);

        if (reseller) {
            await Notification.create({
                recipientId: reseller._id,
                type: 'ORDER_APPROVED',
                title: 'Wholesale Order Approved! 🎉',
                message: `Your bulk order ${order.orderId} has been authorized and is now being packed for dispatch.`,
                referenceData: {
                    referenceId: order.orderId,
                    referenceType: 'Order',
                    actionUrl: `/orders?search=${order.orderId}`,
                },
            });

            await emailService.sendOrderApprovedEmail(reseller, order);
        }
    } catch (notifErr) {
        console.error(`Failed to send approval alerts for ${order.orderId}:`, notifErr);
    }

    return res.status(200).json(new ApiResponse(200, order, 'Order authorized successfully.'));
});

export const exportUntrackedWukusyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({
        status: { $in: ['PENDING', 'PROCESSING'] },
        'tracking.awbNumber': { $exists: false },
    }).populate('resellerId');

    const headers = [
        'Sovely Order ID',
        'First Name',
        'Last Name',
        'Company',
        'Mobile',
        'Shipping Add 1',
        'Shipping Add 2',
        'City',
        'State',
        'Pincode',
        'SKU',
        'Quantity',
        'Payment Method',
        'Selling Price',
        'Status',
        'Platform ID',
        'Courier',
        'Tracking',
    ];

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let str = String(val).replace(/"/g, '""');
        // Prevent Excel scientific notation for long numbers
        if (/^\+?\d{10,}$/.test(str) || /^\d{5,6}$/.test(str)) {
            str = `\t${str}`;
        }
        return `"${str}"`;
    };

    let csvContent = '\uFEFF' + headers.map((h) => `"${h}"`).join(',') + '\n';

    orders.forEach((order) => {
        const isDropship = !!order.endCustomerDetails?.name;

        let firstName = '',
            lastName = '',
            company = '',
            mobile = '';
        let address1 = '',
            address2 = '',
            city = '',
            state = '',
            pincode = '';

        if (isDropship) {
            const nameParts = (order.endCustomerDetails.name || '').split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
            mobile = order.endCustomerDetails.phone || '';
            address1 = order.endCustomerDetails.address?.street || '';
            city = order.endCustomerDetails.address?.city || '';
            state = order.endCustomerDetails.address?.state || '';
            pincode = order.endCustomerDetails.address?.zip || '';
        } else {
            const nameParts = (order.resellerId?.name || '').split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
            company = order.resellerId?.companyName || '';
            mobile = order.resellerId?.phoneNumber || order.resellerId?.email || '';
            address1 = order.resellerId?.billingAddress?.street || '';
            city = order.resellerId?.billingAddress?.city || '';
            state = order.resellerId?.billingAddress?.state || '';
            pincode = order.resellerId?.billingAddress?.zip || '';
        }

        order.items.forEach((item) => {
            const row = [
                order.orderId,
                firstName,
                lastName,
                company,
                mobile,
                address1,
                address2,
                city,
                state,
                pincode,
                item.sku,
                item.qty,
                order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
                item.resellerSellingPrice || item.platformBasePrice,
                order.status, // Status
                order.platformOrderNo || '', // Platform Order No
                '', // Courier
                '', // Tracking
            ];
            csvContent += row.map(escapeCsv).join(',') + '\n';
        });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="wukusy_untracked_orders.csv"');
    return res.status(200).send(csvContent);
});

function parseCSVText(text) {
    const rows = [];
    let row = [],
        field = '',
        i = 0,
        insideQuotes = false;
    while (i < text.length) {
        const char = text[i];
        if (insideQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }
                insideQuotes = false;
                i++;
                continue;
            }
            field += char;
            i++;
            continue;
        }
        if (char === '"') {
            insideQuotes = true;
            i++;
            continue;
        }
        if (char === ',') {
            row.push(field);
            field = '';
            i++;
            continue;
        }
        if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            i++;
            continue;
        }
        if (char === '\r') {
            i++;
            continue;
        }
        field += char;
        i++;
    }
    row.push(field);
    rows.push(row);
    return rows;
}

export const importWukusyStatusesCsv = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No CSV file uploaded or file is empty.' });
        }

        const csvText = req.file.buffer.toString('utf-8');
        const rows = parseCSVText(csvText);

        if (rows.length < 2) {
            return res.status(400).json({ message: 'CSV appears to be empty.' });
        }

        const header = rows[0].map((h) => h.trim().replace(/^"+|"+$/g, ''));
        const dataRows = rows.slice(1);

        const wukusyOrderNoIdx = header.indexOf('Wukusy Order No');
        const sovelyOrderIdIdx = header.indexOf('Sovely Order ID');
        const platformOrderNoIdx = header.indexOf('Platform Order No');
        const platformIdIdx = header.indexOf('Platform ID');
        const statusIdx = header.indexOf('Status');
        const courierIdx = header.indexOf('Courier');
        const trackingIdx = header.indexOf('Tracking');

        if ((sovelyOrderIdIdx === -1 && platformOrderNoIdx === -1) || statusIdx === -1) {
            return res
                .status(400)
                .json({
                    message:
                        'Invalid CSV format. Missing required headers (Sovely Order ID or Status).',
                });
        }

        const WUKUSY_STATUS_MAP = {
            shipped: 'SHIPPED',
            confirmed: 'PROCESSING',
            'cancelled-new': 'CANCELLED',
            cancelled: 'CANCELLED',
            pending: 'PENDING',
            delivered: 'DELIVERED',
            rto: 'RTO',
            'rto delivered': 'RTO_DELIVERED',
            label_printed: 'SHIPPED',
        };

        let updated = 0;
        let skipped = 0;

        for (const row of dataRows) {
            if (!row || row.length < header.length) continue;

            const cleanField = (val) =>
                val
                    ? val
                          .replace(/^"+|"+$/g, '')
                          .replace(/^=/, '')
                          .trim()
                    : '';

            const wukusyOrderNo = cleanField(row[wukusyOrderNoIdx]);
            const sovelyOrderId =
                cleanField(row[sovelyOrderIdIdx]) || cleanField(row[platformOrderNoIdx]);
            const platformId = cleanField(row[platformIdIdx]);
            const rawStatus = cleanField(row[statusIdx]).toLowerCase();
            const courier = cleanField(row[courierIdx]);
            const tracking = cleanField(row[trackingIdx]);

            if (!sovelyOrderId) continue;

            const mappedStatus = WUKUSY_STATUS_MAP[rawStatus];

            // FIX: Search your database using the Sovely Order ID (your local orderId)
            const order = await Order.findOne({ orderId: sovelyOrderId });

            if (!order) {
                skipped++;
                continue;
            }

            let isModified = false;

            // Update the platform reference if provided
            if (platformId && order.platformOrderNo !== platformId) {
                order.platformOrderNo = platformId;
                isModified = true;
            }

            if (courier || tracking) {
                if (!order.tracking) order.tracking = {};

                if (courier && order.tracking.courierName !== courier) {
                    order.tracking.courierName = courier;
                    isModified = true;
                }
                if (tracking && order.tracking.awbNumber !== tracking) {
                    order.tracking.awbNumber = tracking;
                    order.tracking.trackingNumber = tracking;
                    isModified = true;
                }
            }

            if (mappedStatus && order.status !== mappedStatus) {
                // --- FINANCIAL SETTLEMENT PATCH ---
                const finalStatuses = ['CANCELLED', 'RTO_DELIVERED'];
                if (finalStatuses.includes(mappedStatus) && !finalStatuses.includes(order.status)) {
                    try {
                        await applyFinalStatusSettlement({
                            order,
                            targetStatus: mappedStatus,
                            session: null,
                            source: 'BULK_SYNC',
                        });
                    } catch (settlementError) {
                        console.error(
                            `Failed to apply settlement for ${order.orderId}:`,
                            settlementError
                        );
                    }
                }

                order.status = mappedStatus;
                order.statusHistory.push({
                    status: mappedStatus,
                    comment: `System sync via Warehouse CSV (Raw: ${rawStatus})`,
                    date: new Date(),
                });
                isModified = true;
            }

            if (isModified) {
                await order.save();
                updated++;
            } else {
                skipped++;
            }
        }

        return res.status(200).json({
            message: 'Warehouse sync completed successfully',
            result: { updated, skipped },
        });
    } catch (error) {
        console.error('Error processing Wukusy CSV:', error);
        return res.status(500).json({ message: 'Server error processing the CSV file.' });
    }
};
