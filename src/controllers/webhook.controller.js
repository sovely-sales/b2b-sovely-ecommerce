import mongoose from 'mongoose';
import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { emailService } from '../services/email.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const handleLogisticsWebhook = async (req, res) => {
    return res.status(200).json({ received: true, message: 'Automated webhooks disabled' });
};

export const razorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
        console.error('⚠️ Missing RAZORPAY_WEBHOOK_SECRET in .env');
        return res.status(500).json({ status: 'error', message: 'Server configuration error' });
    }

    const shasum = crypto.createHmac('sha256', secret);

    shasum.update(req.rawBody || JSON.stringify(req.body));
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
                return res.status(200).json({ status: 'ok', message: 'Already processed' });
            }

            const invoice = await Invoice.findOne({ razorpayOrderId }).session(session);
            if (!invoice || invoice.paymentStatus === 'PAID') {
                await session.abortTransaction();
                session.endSession();
                return res.status(200).json({ status: 'ok', message: 'Invoice not found/paid' });
            }

            await Payment.create(
                [
                    {
                        resellerId: invoice.resellerId,
                        gatewayOrderId: razorpayOrderId,
                        gatewayPaymentId: razorpayPaymentId,
                        amount: invoice.grandTotal,
                        paymentMethod: 'UNKNOWN',
                        purpose:
                            invoice.invoiceType === 'WALLET_TOPUP'
                                ? 'WALLET_RECHARGE'
                                : 'DIRECT_ORDER_PAYMENT',
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
                            referenceId: 'TOP-' + razorpayPaymentId,
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
