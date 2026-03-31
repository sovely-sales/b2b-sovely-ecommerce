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
                // --- NEW SNAPSHOTS ---
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

        // WHOLESALE ORDER CREATION
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
                totalPlatformCost: whTotalCost,

                // Assign wholesale weights
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

        // DROPSHIP ORDER CREATION
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

            // --- NEW: Apply Client's COD Logic ---
            const codCharge = paymentMethod === 'COD' ? 35 : 0;
            const dsTotalCost = dsSubTotal + dsTaxTotal + dsShippingTotal + codCharge;

            const dsOrderId = `OD-DS-${Math.floor(1000000 + Math.random() * 9000000)}`;
            generatedOrderIds.push(dsOrderId);

            let amountToCollect = 0;
            let resellerProfitMargin = 0;

            if (paymentMethod === 'COD') {
                amountToCollect = dropshipItems.reduce(
                    (acc, item) => acc + item.resellerSellingPrice * item.qty,
                    0
                );
                // Profit is what's left after subtracting platform cost, shipping, tax, AND the COD fee
                resellerProfitMargin = amountToCollect - dsTotalCost;
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

                // Assign dropship weights
                totalActualWeight: dsActualWeight,
                totalVolumetricWeight: dsVolWeight,
                totalBillableWeight: dsBillableWeight,
                weightType: dsVolWeight > dsActualWeight ? 'VOLUMETRIC' : 'ACTUAL',

                amountToCollect,
                resellerProfitMargin,
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

/**
 * @desc    Get a single order by ID
 * @route   GET /api/orders/:id
 */
export const getOrderById = asyncHandler(async (req, res) => {
    // Finds the order ensuring it belongs to the logged-in reseller
    const order = await Order.findOne({ _id: req.params.id, resellerId: req.user._id });

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    return res.status(200).json(new ApiResponse(200, order, 'Order fetched successfully'));
});

/**
 * @desc    Get Reseller's Orders
 * @route   GET /api/orders
 */
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

/**
 * @desc    Update Order Status (ADMIN ONLY) - Handles Profit Payouts & NDR
 * @route   PUT /api/orders/:id/status
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, awbNumber, courierName, ndrReason } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');

    // Handle Shipping Details
    if (status === 'SHIPPED') {
        order.tracking = { awbNumber, courierName };
    }

    // Handle NDR (Non-Delivery Report)
    if (status === 'NDR') {
        order.ndrDetails = {
            attemptCount: (order.ndrDetails?.attemptCount || 0) + 1,
            reason: ndrReason || 'Customer Unavailable',
            resellerAction: 'PENDING',
        };
    }

    // FIX: ACID Transaction & Race Condition protection for profit payouts
    if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
        if (order.resellerProfitMargin > 0 && order.paymentMethod === 'COD') {
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // 1. Atomically add profit to wallet and get the new balance
                const updatedReseller = await User.findByIdAndUpdate(
                    order.resellerId,
                    { $inc: { walletBalance: order.resellerProfitMargin } },
                    { new: true, session }
                );

                if (!updatedReseller) throw new Error('Reseller not found during payout');

                // 2. Create the Ledger Entry
                await WalletTransaction.create(
                    [
                        {
                            resellerId: order.resellerId,
                            type: 'CREDIT',
                            purpose: 'PROFIT_CREDIT',
                            amount: order.resellerProfitMargin,
                            closingBalance: updatedReseller.walletBalance,
                            referenceId: order.orderId,
                            description: `Profit margin credited for COD delivery of ${order.orderId}`,
                            status: 'COMPLETED',
                        },
                    ],
                    { session }
                );

                await session.commitTransaction();
                session.endSession();

                // Push both status entries into tracking history
                order.statusHistory.push({
                    status: 'DELIVERED',
                    comment: 'Order delivered to customer',
                });
                order.statusHistory.push({
                    status: 'PROFIT_CREDITED',
                    comment: `Rs.${order.resellerProfitMargin} profit margin credited to your wallet`,
                });
                order.status = 'PROFIT_CREDITED';
                await order.save();
                return res
                    .status(200)
                    .json(new ApiResponse(200, order, 'Order delivered and profit credited'));
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw new ApiError(
                    500,
                    'Failed to process profit payout. Order status not updated.'
                );
            }
        }
    }

    // Record every status change in tracking history
    const statusComment = {
        PENDING: 'Order placed and awaiting confirmation',
        PROCESSING: 'Order is being processed and packed',
        SHIPPED: awbNumber
            ? `Order shipped via ${courierName || 'courier'} (AWB: ${awbNumber})`
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

/**
 * @desc    Reseller takes action on an NDR (Non-Delivery Report)
 * @route   POST /api/orders/:id/ndr-action
 */
export const resellerActionOnNDR = asyncHandler(async (req, res) => {
    const { action, updatedPhone } = req.body; // action must be 'REATTEMPT' or 'RTO_REQUESTED'
    const { id } = req.params;
    const resellerId = req.user._id;

    // 1. Validate Input
    if (!['REATTEMPT', 'RTO_REQUESTED'].includes(action)) {
        throw new ApiError(400, 'Invalid NDR action. Must be REATTEMPT or RTO_REQUESTED.');
    }

    // 2. Find the Order (Ensure it belongs to this reseller)
    const order = await Order.findOne({ _id: id, resellerId });
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    // 3. Ensure the order is actually in NDR state
    if (order.status !== 'NDR') {
        throw new ApiError(
            400,
            `Cannot submit NDR action. Order is currently in ${order.status} state.`
        );
    }

    // 4. Update the NDR Details
    order.ndrDetails.resellerAction = action;
    if (updatedPhone) {
        order.ndrDetails.updatedCustomerPhone = updatedPhone;
        // Optionally update the main customer details as well
        order.endCustomerDetails.phone = updatedPhone;
    }

    // 5. Log the history
    order.statusHistory.push({
        status: 'NDR_ACTION_SUBMITTED',
        comment: `Reseller requested: ${action}${updatedPhone ? ` with new phone: ${updatedPhone}` : ''}`,
    });

    await order.save();

    return res
        .status(200)
        .json(new ApiResponse(200, order, `NDR action '${action}' submitted successfully.`));
});
/**
 * @desc    Get ALL orders across the platform (ADMIN ONLY)
 * @route   GET /api/orders/all
 */
export const getAllAdminOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};

    // Filter by exact status if provided
    if (status) {
        query.status = status;
    }

    // Basic search by Order ID
    if (search) {
        query.$or = [{ orderId: { $regex: search, $options: 'i' } }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('resellerId', 'name companyName email'); // Populate business details for admin

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

/**
 * @desc    Export Admin Orders to CSV
 * @route   GET /api/orders/export
 */
export const exportAdminOrdersToCsv = asyncHandler(async (req, res) => {
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
        .populate('resellerId', 'name companyName email phone');

    // Helper to safely format CSV values
    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        // Prefix long numeric sequences with a tab to force string type in Excel
        let str = String(val).replace(/"/g, '""');
        if (/^\+?\d{10,}$/.test(str) || /^\d{5,6}$/.test(str)) {
            str = `\t${str}`;
        }
        return `"${str}"`;
    };

    const headers = [
        'Order ID',
        'Order Date',
        'Status',
        'Order Type',
        'Payment Method',
        'Reseller Name',
        'Reseller Email',
        'Reseller Company',
        'Reseller Phone',
        'Customer Name',
        'Customer Phone',
        'Customer Street',
        'Customer City',
        'Customer State',
        'Customer ZIP',
        'Items (SKU | Title | HSN | Qty | GST)',
        'Total Actual Weight (kg)',
        'Total Volumetric Weight (kg)',
        'Total Billable Weight (kg)',
        'Weight Type',
        'Base Product Cost',
        'Tax Amount',
        'Shipping Charge',
        'COD Charge',
        'Total Platform Cost',
        'Reseller Profit Margin',
        'COD to Collect',
        'AWB Number',
        'Courier',
        'Tracking Number',
        'Tracking URL',
        'NDR Attempt Count',
        'NDR Reason',
        'NDR Reseller Action',
    ];

    let csvContent = headers.map((h) => `"${h}"`).join(',') + '\n';

    orders.forEach((order) => {
        const isDropship = !!order.endCustomerDetails?.name;

        // Create a more descriptive items breakdown
        const itemsStr = order.items
            .map((i) => `${i.sku} | ${i.title} (x${i.qty}) | HSN:${i.hsnCode} | GST:${i.gstSlab}%`)
            .join(' || ');

        const row = [
            order.orderId,
            new Date(order.createdAt).toISOString().split('T')[0],
            order.status,
            isDropship ? 'DROPSHIP' : 'WHOLESALE',
            order.paymentMethod,
            order.resellerId?.name || '',
            order.resellerId?.email || '',
            order.resellerId?.companyName || '',
            order.resellerId?.phone || '',
            isDropship ? order.endCustomerDetails?.name || '' : '',
            isDropship ? order.endCustomerDetails?.phone || '' : '',
            isDropship ? order.endCustomerDetails?.address?.street || '' : '',
            isDropship ? order.endCustomerDetails?.address?.city || '' : '',
            isDropship ? order.endCustomerDetails?.address?.state || '' : '',
            isDropship ? order.endCustomerDetails?.address?.zip || '' : '',
            itemsStr,
            order.totalActualWeight || 0,
            order.totalVolumetricWeight || 0,
            order.totalBillableWeight || 0,
            order.weightType || 'N/A',
            order.subTotal || 0,
            order.taxTotal || 0,
            order.shippingTotal || 0,
            order.codCharge || 0,
            order.totalPlatformCost || 0,
            order.resellerProfitMargin || 0,
            order.amountToCollect || 0,
            order.tracking?.awbNumber || '',
            order.tracking?.courierName || '',
            order.tracking?.trackingNumber || '',
            order.tracking?.trackingUrl || '',
            order.ndrDetails?.attemptCount || 0,
            order.ndrDetails?.reason || '',
            order.ndrDetails?.resellerAction || '',
        ];

        csvContent += row.map(escapeCsv).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders_export.csv"');
    return res.status(200).send(csvContent);
});
