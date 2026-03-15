import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'secret_dummy';

// Setup Razorpay instance (Ensure these are in your .env)
// If using dummy keys, we mock the Razorpay instance to allow local testing
export const razorpayInstance = key_id === 'rzp_test_dummy'
    ? {
        orders: {
            create: async (options) => {
                console.log("[MOCK RAZORPAY] Creating order:", options);
                return {
                    id: `order_mock_${Date.now()}`,
                    entity: "order",
                    amount: options.amount,
                    amount_paid: 0,
                    amount_due: options.amount,
                    currency: options.currency,
                    receipt: options.receipt,
                    status: "created",
                    attempts: 0,
                    created_at: Math.floor(Date.now() / 1000)
                };
            }
        }
    }
    : new Razorpay({ key_id, key_secret });

// Endpoint called by frontend after successful Razorpay checkout widget payment
export const verifyPaymentSignature = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;
    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
        throw new ApiError(400, "Missing required payment parameters");
    }

    // Validate Signature
    const isMock = process.env.RAZORPAY_KEY_ID === undefined || process.env.RAZORPAY_KEY_ID === 'rzp_test_dummy';

    if (!isMock) {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_dummy')
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            throw new ApiError(400, "Invalid payment signature");
        }
    } else {
        console.log("[MOCK RAZORPAY] Bypassing signature validation for dummy environment.");
    }

    // Find the invoice to ensure it hasn't been paid already
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new ApiError(404, "Invoice not found");
    if (invoice.status === 'PAID') throw new ApiError(400, "Invoice already marked as PAID");

    // Idempotency: Check if Payment reference already exists
    const existingPayment = await Payment.findOne({ referenceId: razorpay_payment_id });
    if (existingPayment) {
        return res.status(200).json(new ApiResponse(200, existingPayment, "Payment already processed"));
    }

    // Save Payment Record
    const payment = await Payment.create({
        userId,
        invoiceId,
        paymentMethod: 'CARD', // Or fetch exact method from Razorpay API
        status: 'SUCCESS',
        referenceId: razorpay_payment_id
    });

    // Update Invoice Status
    invoice.status = 'PAID';
    await invoice.save();

    // If this was a WALLET_TOPUP, immediately credit the wallet
    if (invoice.invoiceType === 'WALLET_TOPUP') {
        await WalletTransaction.create({
            userId,
            paymentId: payment._id,
            amount: invoice.totalAmount,
            transactionType: 'CREDIT',
            description: `Wallet top-up via Razorpay (${razorpay_payment_id})`
        });
    }

    return res.status(200).json(new ApiResponse(200, { payment, invoice }, "Payment verified securely"));
});


export const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { invoiceId } = req.body;
    const customerId = req.user._id;

    if (!invoiceId) {
        throw new ApiError(400, "invoiceId is required");
    }

    // SECURE: Fetch the invoice from the DB to get the true amount
    const invoice = await Invoice.findOne({ _id: invoiceId, customerId });
    
    if (!invoice) throw new ApiError(404, "Invoice not found or does not belong to user");
    if (invoice.status === 'PAID') throw new ApiError(400, "Invoice is already paid");

    const amountInINR = invoice.totalAmount;

    // Razorpay expects the amount in the smallest currency sub-unit (paise for INR)
    const options = {
        amount: Math.round(amountInINR * 100), 
        currency: "INR",
        receipt: `receipt_${invoice._id.toString().substring(0, 10)}_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);

    if (!order) {
        throw new ApiError(500, "Failed to create Razorpay order");
    }

    // Save the razorpay order id to the invoice for tracking/verification later
    invoice.razorpayOrderId = order.id;
    await invoice.save();

    return res.status(200).json(
        new ApiResponse(200, {
            razorpayOrder: order,
            amount: amountInINR // Send back the true amount so the frontend knows what is being charged
        }, "Razorpay order created securely")
    );
});