import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Invoice } from '../models/Invoice.js';
import { Product } from '../models/Product.js';
import { Counter } from '../models/Counter.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { WalletTransaction } from '../models/WalletTransaction.js';

const calculateDueDate = (paymentTerms) => {
    const dueDate = new Date();
    if (paymentTerms === 'NET_15') dueDate.setDate(dueDate.getDate() + 15);
    else if (paymentTerms === 'NET_30') dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
};

export const placeOrder = asyncHandler(async (req, res) => {
    const { items, paymentMethod = 'RAZORPAY', paymentTerms = 'DUE_ON_RECEIPT' } = req.body;
    const userId = req.user._id;

    if (!items || !items.length) throw new ApiError(400, 'Items list is empty');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findOneAndUpdate(
                { _id: item.productId, 'inventory.stock': { $gte: item.qty } },
                { $inc: { 'inventory.stock': -item.qty } },
                { session, new: true }
            );

            if (!product) {
                const missingProduct = await Product.findById(item.productId).select('title');
                const title = missingProduct ? missingProduct.title : `ID: ${item.productId}`;
                throw new Error(`Insufficient stock for ${title}.`);
            }

            totalAmount += product.platformSellPrice * item.qty;
            orderItems.push({
                sku: product.sku,
                price: product.platformSellPrice,
                qty: item.qty,
                tax: 0,
            });
        }

        const orderIdSeq = await Counter.getNextSequenceValue('orderId');
        const invoiceNumSeq = await Counter.getNextSequenceValue('invoiceNumber');

        const orderIdStr = `ORD-${orderIdSeq.toString().padStart(6, '0')}`;
        const invoiceNumStr = `INV-${invoiceNumSeq.toString().padStart(6, '0')}`;

        const newOrder = new Order({
            orderId: orderIdStr,
            userId,
            status: 'PENDING',
            totalAmount,
            items: orderItems,
            paymentMethod,
            paymentTerms,
        });
        await newOrder.save({ session });

        const dueDate = calculateDueDate(paymentTerms);
        const newInvoice = new Invoice({
            invoiceNumber: invoiceNumStr,
            userId,
            orderId: newOrder._id,
            invoiceType: 'ORDER_BILL',
            totalAmount,
            dueDate,
            paymentMethod,
            paymentTerms,
            status: paymentMethod === 'BANK_TRANSFER' ? 'UNPAID' : 'UNPAID',
        });
        await newInvoice.save({ session });

        if (paymentMethod === 'WALLET') {
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, walletBalance: { $gte: totalAmount } },
                { $inc: { walletBalance: -totalAmount } },
                { session, returnDocument: 'after' }
            );

            if (!updatedUser) {
                throw new Error('Insufficient wallet balance for this purchase.');
            }

            await User.findByIdAndUpdate(
                userId,
                { $inc: { walletBalance: -totalAmount } },
                { session, returnDocument: 'after' }
            );

            const walletPayment = new Payment({
                userId,
                invoiceId: newInvoice._id,
                paymentMethod: 'WALLET',
                status: 'SUCCESS',
                referenceId: `WALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            });
            await walletPayment.save({ session });

            await WalletTransaction.create(
                [
                    {
                        userId,
                        paymentId: walletPayment._id,
                        amount: totalAmount,
                        transactionType: 'DEBIT',
                        description: `Order Payment for ${orderIdStr}`,
                    },
                ],
                { session }
            );

            newOrder.status = 'PROCESSING';
            await newOrder.save({ session });

            newInvoice.status = 'PAID';
            await newInvoice.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { order: newOrder, invoice: newInvoice },
                    'Order placed successfully'
                )
            );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        throw new ApiError(400, error.message || 'Failed to place order');
    }
});

export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, orders, 'Orders fetched successfully'));
});

export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) throw new ApiError(404, 'Order not found');
    return res.status(200).json(new ApiResponse(200, order, 'Order fetched successfully'));
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, status: 'PENDING' },
        { status: 'CANCELLED' },
        { new: true }
    );
    if (!order) throw new ApiError(404, 'Order not found or cannot be cancelled');

    await Invoice.findOneAndUpdate(
        { orderId: order._id, status: 'UNPAID' },
        { status: 'CANCELLED' }
    );
    return res.status(200).json(new ApiResponse(200, order, 'Order cancelled successfully'));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, courierName, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found');

    if (status) order.status = status.toUpperCase();
    if (courierName || trackingNumber) {
        order.tracking = {
            ...order.tracking,
            courierName: courierName || order.tracking?.courierName,
            trackingNumber: trackingNumber || order.tracking?.trackingNumber,
            trackingUrl: `https://${(courierName || order.tracking?.courierName || 'courier').toLowerCase()}.com/track/${trackingNumber || order.tracking?.trackingNumber}`,
        };
    }

    await order.save();
    return res
        .status(200)
        .json(new ApiResponse(200, order, `Order successfully marked as ${order.status}`));
});

export const getAllOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const status = req.query.status || 'ALL';

    const query = {};

    if (status !== 'ALL') {
        query.status = status;
    }

    if (search) {
        const matchingUsers = await User.find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ],
        }).select('_id');

        const userIds = matchingUsers.map((u) => u._id);

        query['$or'] = [
            { orderId: { $regex: search, $options: 'i' } },
            { userId: { $in: userIds } },
        ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                data: orders,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
            'All orders fetched successfully'
        )
    );
});
