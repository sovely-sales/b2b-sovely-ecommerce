import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { Counter } from '../models/Counter.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import crypto from 'crypto';

export const getBalance = asyncHandler(async (req, res) => {
    const balance = req.user.walletBalance || 0;
    return res.status(200).json(new ApiResponse(200, { balance }, 'Wallet balance fetched'));
});

export const getTransactionHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await WalletTransaction.find({ resellerId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await WalletTransaction.countDocuments({ resellerId: req.user._id });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                transactions,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit)),
                },
            },
            'Transaction history fetched successfully'
        )
    );
});

export const createTopUpInvoice = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const resellerId = req.user._id;

    if (!amount || amount <= 0) {
        throw new ApiError(400, 'Valid amount is required');
    }

    const sequence = await Counter.getNextSequenceValue('invoices_fy2526');
    const paddedSeq = String(sequence).padStart(5, '0');
    const invoiceNumStr = `INV/WT/25-26/${paddedSeq}`;

    const invoice = await Invoice.create({
        invoiceNumber: invoiceNumStr,
        resellerId,
        invoiceType: 'WALLET_TOPUP',
        totalTaxableValue: amount,
        grandTotal: amount,
        paymentTerms: 'DUE_ON_RECEIPT',
        dueDate: new Date(),
        paymentStatus: 'UNPAID',
    });

    return res.status(200).json(new ApiResponse(200, invoice, 'Top-up invoice generated'));
});

export const requestWithdrawal = asyncHandler(async (req, res) => {
    const { amount, bankDetails } = req.body;
    const resellerId = req.user._id;

    if (!amount || amount < 500) {
        throw new ApiError(400, 'Minimum withdrawal amount is ₹500');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(resellerId).session(session);

        if (user.walletBalance < amount) {
            throw new ApiError(
                400,
                `Insufficient funds. Available balance: ₹${user.walletBalance}`
            );
        }

        const updatedUser = await User.findByIdAndUpdate(
            resellerId,
            { $inc: { walletBalance: -amount } },
            { new: true, session }
        );

        const secureHash = crypto.randomBytes(4).toString('hex').toUpperCase();

        const transaction = await WalletTransaction.create(
            [
                {
                    resellerId,
                    type: 'DEBIT',
                    purpose: 'BANK_WITHDRAWAL',
                    amount: amount,
                    closingBalance: updatedUser.walletBalance,

                    referenceId: `WDL-${secureHash}`,
                    description: `Withdrawal request to bank account ending in ${bankDetails?.accountNumber?.slice(-4) || 'XXXX'}`,
                    status: 'PENDING',
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res
            .status(200)
            .json(
                new ApiResponse(200, transaction[0], 'Withdrawal request submitted successfully')
            );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(500, error.message || 'Failed to process withdrawal request');
    }
});

export const getAllWithdrawalRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = 'PENDING' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { purpose: 'BANK_WITHDRAWAL' };
    if (status !== 'ALL') query.status = status;

    const requests = await WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('resellerId', 'name email companyName phoneNumber bankDetails');

    const total = await WalletTransaction.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                requests,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit)),
                },
            },
            'Withdrawal requests fetched successfully'
        )
    );
});

export const processWithdrawalRequest = asyncHandler(async (req, res) => {
    const { action, utrNumber, rejectionReason } = req.body;
    const { id } = req.params;

    if (!['APPROVE', 'REJECT'].includes(action)) {
        throw new ApiError(400, 'Action must be exactly APPROVE or REJECT');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const transaction = await WalletTransaction.findById(id).session(session);

        if (!transaction) throw new ApiError(404, 'Withdrawal request not found');

        if (transaction.status !== 'PENDING') {
            throw new ApiError(400, `Cannot process. Transaction is already ${transaction.status}`);
        }

        if (action === 'APPROVE') {
            if (!utrNumber)
                throw new ApiError(400, 'Bank UTR Number is required to approve a payout.');

            transaction.status = 'COMPLETED';
            transaction.description = `${transaction.description} | UTR: ${utrNumber}`;

            await transaction.save({ session });
        } else if (action === 'REJECT') {
            if (!rejectionReason)
                throw new ApiError(400, 'A reason is required to reject a payout.');

            transaction.status = 'FAILED';
            transaction.description = `${transaction.description} | REJECTED: ${rejectionReason}`;
            await transaction.save({ session });

            const user = await User.findByIdAndUpdate(
                transaction.resellerId,
                { $inc: { walletBalance: transaction.amount } },
                { new: true, session }
            );

            await WalletTransaction.create(
                [
                    {
                        resellerId: user._id,
                        type: 'CREDIT',
                        purpose: 'REFUND',
                        amount: transaction.amount,
                        closingBalance: user.walletBalance,
                        referenceId: `REF-${transaction.referenceId}`,
                        description: `Refund for rejected bank withdrawal. Reason: ${rejectionReason}`,
                        status: 'COMPLETED',
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
                    transaction,
                    `Withdrawal request successfully ${action.toLowerCase()}d.`
                )
            );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(
            error.statusCode || 500,
            error.message || 'Failed to process withdrawal'
        );
    }
});
