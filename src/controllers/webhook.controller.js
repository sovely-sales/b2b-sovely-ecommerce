import mongoose from 'mongoose';
import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const handleLogisticsWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-logistics-signature'];
    const webhookSecret = process.env.LOGISTICS_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) throw new ApiError(401, 'Missing webhook signature');

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
    if (signature !== expectedSignature) throw new ApiError(401, 'Invalid webhook signature');

    const { order_id: orderId, awb, current_status, remarks } = req.body;

    const statusMap = {
        PICKED_UP: 'SHIPPED',
        IN_TRANSIT: 'SHIPPED',
        DELIVERED: 'DELIVERED',
        UNDELIVERED: 'NDR',
        RTO_DELIVERED: 'RTO',
        CANCELLED: 'CANCELLED',
    };

    const newInternalStatus = statusMap[current_status?.toUpperCase()];
    if (!newInternalStatus) return res.status(200).json({ received: true });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(200).json({ received: true });

    if (
        order.status === newInternalStatus ||
        ['PROFIT_CREDITED', 'CANCELLED', 'RTO'].includes(order.status)
    ) {
        return res.status(200).json({ received: true });
    }

    order.statusHistory.push({
        status: newInternalStatus,
        comment: remarks || `Automated update from courier: ${current_status}`,
    });

    if (newInternalStatus === 'NDR') {
        order.ndrDetails = {
            attemptCount: (order.ndrDetails?.attemptCount || 0) + 1,
            reason: remarks || 'Customer Unavailable',
            resellerAction: 'PENDING',
        };
        order.status = 'NDR';
        await order.save();
        return res.status(200).json({ received: true });
    }

    if (['CANCELLED', 'RTO'].includes(newInternalStatus)) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let refundAmount =
                newInternalStatus === 'CANCELLED'
                    ? order.totalPlatformCost
                    : order.subTotal + order.taxTotal + order.codCharge;

            const description =
                newInternalStatus === 'CANCELLED'
                    ? `Full refund for cancelled order ${order.orderId} via Webhook`
                    : `RTO Refund (Principal + Tax + COD) for ${order.orderId}. Freight forfeited.`;

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
                            description,
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
                comment: `₹${refundAmount} auto-refunded to wallet.`,
            });
            order.status = newInternalStatus;

            await order.save({ session });
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({ received: true });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new ApiError(500, 'Webhook processed but refund failed');
        }
    }

    if (newInternalStatus === 'DELIVERED') {
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
                            description: `Payout (Principal + ₹${order.resellerProfitMargin} Profit) auto-credited for COD delivery`,
                            status: 'COMPLETED',
                        },
                    ],
                    { session }
                );

                order.statusHistory.push({
                    status: 'PROFIT_CREDITED',
                    comment: `₹${order.payoutOnDelivery} auto-credited to wallet on delivery`,
                });

                order.status = 'PROFIT_CREDITED';
                await order.save({ session });

                await session.commitTransaction();
                session.endSession();
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw new ApiError(500, 'Webhook processed but payout failed');
            }
        } else {
            order.status = 'DELIVERED';
            await order.save();
        }
        return res.status(200).json({ received: true });
    }

    order.status = newInternalStatus;
    await order.save();
    return res.status(200).json({ received: true });
});

export const razorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        console.error('⚠️ Missing RAZORPAY_WEBHOOK_SECRET in .env');
        return res.status(500).json({ status: 'error', message: 'Server configuration error' });
    }

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
        console.error('⚠️ SECURITY ALERT: Invalid Razorpay Webhook Signature');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = req.body.event;

    if (event === 'payment.captured') {
        const paymentEntity = req.body.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const existingPayment = await Payment.findOne({
                gatewayPaymentId: razorpayPaymentId,
            }).session(session);
            if (existingPayment) {
                await session.abortTransaction();
                session.endSession();
                return res
                    .status(200)
                    .json({ status: 'ok', message: 'Already processed by frontend' });
            }

            const invoice = await Invoice.findOne({ razorpayOrderId }).session(session);
            if (!invoice || invoice.paymentStatus === 'PAID') {
                await session.abortTransaction();
                session.endSession();
                return res
                    .status(200)
                    .json({ status: 'ok', message: 'Invoice not found or already paid' });
            }

            await Payment.create(
                [
                    {
                        resellerId: invoice.resellerId,
                        gatewayOrderId: razorpayOrderId,
                        gatewayPaymentId: razorpayPaymentId,
                        amount: invoice.grandTotal,
                        paymentMethod: 'UNKNOWN',
                        purpose: invoice.invoiceType === 'WALLET_TOPUP' ? 'WALLET_RECHARGE' : 'DIRECT_ORDER_PAYMENT',
                        status: 'CAPTURED',
                    },
                ],
                { session }
            );

            invoice.paymentStatus = 'PAID';
            await invoice.save({ session });

            if (invoice.invoiceType === 'WALLET_TOPUP') {
                const updatedUser = await User.findByIdAndUpdate(
                    invoice.resellerId,
                    { $inc: { walletBalance: invoice.grandTotal } },
                    { new: true, session }
                );

                await WalletTransaction.create(
                    [
                        {
                            resellerId: invoice.resellerId,
                            type: 'CREDIT',
                            purpose: 'WALLET_RECHARGE',
                            amount: invoice.grandTotal,
                            closingBalance: updatedUser.walletBalance,
                            referenceId: razorpayPaymentId,
                            description: `Wallet top-up via Webhook Fallback (${razorpayPaymentId})`,
                            status: 'COMPLETED',
                        },
                    ],
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();
            console.log(`✅ Webhook Processed: Wallet Top-up for Order ${razorpayOrderId}`);

            return res.status(200).json({ status: 'ok' });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('❌ Webhook processing error:', error);
            return res.status(500).json({ status: 'error' });
        }
    }

    return res.status(200).json({ status: 'ok' });
};
