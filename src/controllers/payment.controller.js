import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'secret_dummy';

export const razorpayInstance =
    key_id === 'rzp_test_dummy'
        ? {
              orders: {
                  create: async (options) => {
                      console.log('[MOCK RAZORPAY] Creating order:', options);
                      return {
                          id: `order_mock_${Date.now()}`,
                          entity: 'order',
                          amount: options.amount,
                          amount_paid: 0,
                          amount_due: options.amount,
                          currency: options.currency,
                          receipt: options.receipt,
                          status: 'created',
                          attempts: 0,
                          created_at: Math.floor(Date.now() / 1000),
                      };
                  },
              },
          }
        : new Razorpay({ key_id, key_secret });

export const verifyPaymentSignature = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;
    const resellerId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
        throw new ApiError(400, 'Missing required payment parameters');
    }

    const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_dummy';

    if (!isMock) {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_dummy')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            throw new ApiError(400, 'Invalid payment signature');
        }
    }

    const invoiceCheck = await Invoice.findOne({ _id: invoiceId, resellerId });
    if (!invoiceCheck) throw new ApiError(404, 'Invoice not found');
    if (invoiceCheck.paymentStatus === 'PAID') {
        return res.status(200).json(new ApiResponse(200, null, 'Payment already processed'));
    }
    if (invoiceCheck.razorpayOrderId !== razorpay_order_id) {
        throw new ApiError(
            400,
            'Payment origin mismatch: Invoice does not match the Razorpay order'
        );
    }

    const expectedAmountInPaise = Math.round(invoiceCheck.grandTotal * 100);

    if (!isMock) {
        const rzpPayment = await razorpayInstance.payments.fetch(razorpay_payment_id);
        if (rzpPayment.amount !== expectedAmountInPaise) {
            throw new ApiError(400, 'SECURITY ALERT: Amount mismatch.');
        }
        if (rzpPayment.status === 'authorized') {
            await razorpayInstance.payments.capture(
                razorpay_payment_id,
                expectedAmountInPaise,
                'INR'
            );
        } else if (rzpPayment.status !== 'captured') {
            throw new ApiError(400, `Payment status: ${rzpPayment.status}. Expected captured.`);
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const lockedInvoice = await Invoice.findOneAndUpdate(
            { _id: invoiceId, paymentStatus: { $ne: 'PAID' } },
            { $set: { paymentStatus: 'PAID' } },
            { new: true, session }
        );

        if (!lockedInvoice) {
            await session.abortTransaction();
            session.endSession();
            return res
                .status(200)
                .json(new ApiResponse(200, null, 'Payment was just processed by webhook'));
        }

        const paymentArray = await Payment.create(
            [
                {
                    resellerId: resellerId,
                    gatewayOrderId: razorpay_order_id,
                    gatewayPaymentId: razorpay_payment_id,
                    gatewaySignature: razorpay_signature,
                    amount: lockedInvoice.grandTotal,
                    paymentMethod: 'UNKNOWN',
                    purpose:
                        lockedInvoice.invoiceType === 'WALLET_TOPUP'
                            ? 'WALLET_RECHARGE'
                            : 'DIRECT_ORDER_PAYMENT',
                    status: 'CAPTURED',
                },
            ],
            { session }
        );
        const payment = paymentArray[0];

        if (lockedInvoice.invoiceType === 'ORDER_BILL' && lockedInvoice.orderId) {
            await Order.findByIdAndUpdate(
                lockedInvoice.orderId,
                { status: 'PROCESSING' },
                { session }
            );
        } else if (lockedInvoice.invoiceType === 'WALLET_TOPUP') {
            const updatedUser = await User.findByIdAndUpdate(
                resellerId,
                { $inc: { walletBalance: lockedInvoice.grandTotal } },
                { new: true, session }
            );

            if (!updatedUser) throw new ApiError(404, 'User not found during wallet update');

            await WalletTransaction.create(
                [
                    {
                        resellerId: resellerId,
                        type: 'CREDIT',
                        purpose: 'WALLET_RECHARGE',
                        amount: lockedInvoice.grandTotal,
                        closingBalance: updatedUser.walletBalance,
                        referenceId: razorpay_payment_id,
                        description: `Wallet top-up via Razorpay (${razorpay_payment_id})`,
                    },
                ],
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { payment, invoice: lockedInvoice },
                    'Payment verified securely'
                )
            );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, `Payment processing failed: ${error.message}`);
    }
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { invoiceId } = req.body;
    const resellerId = req.user._id;

    if (!invoiceId) throw new ApiError(400, 'invoiceId is required');

    const invoice = await Invoice.findOne({ _id: invoiceId, resellerId });

    if (!invoice) throw new ApiError(404, 'Invoice not found or does not belong to user');
    if (invoice.paymentStatus === 'PAID') throw new ApiError(400, 'Invoice is already paid');

    const amountInINR = invoice.grandTotal;

    const options = {
        amount: Math.round(amountInINR * 100),
        currency: 'INR',
        receipt: `receipt_${invoice._id.toString().substring(0, 10)}_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    if (!order) throw new ApiError(500, 'Failed to create Razorpay order');

    invoice.razorpayOrderId = order.id;
    await invoice.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { razorpayOrder: order, amount: amountInINR, key_id },
                'Razorpay order created securely'
            )
        );
});
