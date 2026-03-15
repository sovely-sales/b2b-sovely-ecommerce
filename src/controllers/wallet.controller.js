import { Invoice } from '../models/Invoice.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { Counter } from '../models/Counter.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { razorpayInstance } from './payment.controller.js';

export const getBalance = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Calculate sum of credits minus debits
    const transactions = await WalletTransaction.find({ userId });

    let balance = 0;
    for (const trx of transactions) {
        if (trx.transactionType === 'CREDIT') balance += trx.amount;
        if (trx.transactionType === 'DEBIT') balance -= trx.amount;
    }

    return res.status(200).json(new ApiResponse(200, { balance }, "Wallet balance fetched"));
});

export const getTransactionHistory = asyncHandler(async (req, res) => {
    const transactions = await WalletTransaction.find({ userId: req.user._id })
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, transactions, "Transaction history fetched"));
});

export const addMoney = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Valid amount is required to add money");
    }

    // 1. Generate Invoice representation for the Top-up
    const invoiceNumSeq = await Counter.getNextSequenceValue('invoiceNumber');
    const invoiceNumStr = `INV-${invoiceNumSeq.toString().padStart(6, '0')}`;

    const invoice = await Invoice.create({
        invoiceNumber: invoiceNumStr,
        userId,
        invoiceType: 'WALLET_TOPUP',
        totalAmount: amount,
        paymentTerms: 'DUE_ON_RECEIPT',
        dueDate: new Date(), // Due immediately
        status: 'UNPAID'
    });

    // 2. Create Razorpay Order matching the exact amount (convert to paise)
    const options = {
        amount: Math.round(amount * 100),  // amount in the smallest currency unit
        currency: "INR",
        receipt: invoiceNumStr,
        payment_capture: 1 // AUTO capture
    };

    try {
        const order = await razorpayInstance.orders.create(options);

        // Send back everything the frontend needs to open the checkout widget
        return res.status(200).json(new ApiResponse(200, {
            invoiceId: invoice._id,
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy'
        }, "Razorpay order created for wallet topup"));
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to initialize Razorpay payment");
    }
});
