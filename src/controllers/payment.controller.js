import Razorpay from 'razorpay';
import crypto from 'crypto';
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
    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
        throw new ApiError(400, 'Missing required payment parameters');
    }

    const isMock =
        process.env.RAZORPAY_KEY_ID === undefined ||
        process.env.RAZORPAY_KEY_ID === 'rzp_test_dummy';

    if (!isMock) {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_dummy')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            throw new ApiError(400, 'Invalid payment signature');
        }
    } else {
        console.log('[MOCK RAZORPAY] Bypassing signature validation for dummy environment.');
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    if (invoice.status === 'PAID') throw new ApiError(400, 'Invoice already marked as PAID');

    if (invoice.razorpayOrderId !== razorpay_order_id) {
        throw new ApiError(
            400,
            'Payment origin mismatch: Invoice does not match the Razorpay order'
        );
    }

    const existingPayment = await Payment.findOne({ referenceId: razorpay_payment_id });
    if (existingPayment) {
        return res
            .status(200)
            .json(new ApiResponse(200, existingPayment, 'Payment already processed'));
    }

    const payment = await Payment.create({
        userId,
        invoiceId,
        paymentMethod: 'RAZORPAY',
        status: 'SUCCESS',
        referenceId: razorpay_payment_id,
    });

    invoice.status = 'PAID';
    await invoice.save();

    if (invoice.invoiceType === 'ORDER_BILL' && invoice.orderId) {
        const order = await Order.findById(invoice.orderId);
        if (order) {
            order.status = 'PROCESSING';
            await order.save();
        }
    } else if (invoice.invoiceType === 'WALLET_TOPUP') {
        await WalletTransaction.create({
            userId,
            paymentId: payment._id,
            amount: invoice.totalAmount,
            transactionType: 'CREDIT',
            description: `Wallet top-up via Razorpay (${razorpay_payment_id})`,
        });

        await User.findByIdAndUpdate(userId, {
            $inc: { walletBalance: invoice.totalAmount },
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { payment, invoice }, 'Payment verified securely'));
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { invoiceId } = req.body;
    const userId = req.user._id;

    if (!invoiceId) {
        throw new ApiError(400, 'invoiceId is required');
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, userId });

    if (!invoice) throw new ApiError(404, 'Invoice not found or does not belong to user');
    if (invoice.status === 'PAID') throw new ApiError(400, 'Invoice is already paid');

    const amountInINR = invoice.totalAmount;

    const options = {
        amount: Math.round(amountInINR * 100),
        currency: 'INR',
        receipt: `receipt_${invoice._id.toString().substring(0, 10)}_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    if (!order) {
        throw new ApiError(500, 'Failed to create Razorpay order');
    }

    invoice.razorpayOrderId = order.id;
    await invoice.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                razorpayOrder: order,
                amount: amountInINR,
            },
            'Razorpay order created securely'
        )
    );
});
