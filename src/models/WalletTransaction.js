import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
    {
        resellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['CREDIT', 'DEBIT'],
            required: true,
        },
        purpose: {
            type: String,
            enum: [
                'WALLET_RECHARGE', 
                'ORDER_DEDUCTION', 
                'PROFIT_CREDIT', 
                'RTO_PENALTY', 
                'REFUND', 
                'BANK_WITHDRAWAL', 
            ],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
        },
        
        closingBalance: {
            type: Number,
            required: true,
        },
        referenceId: {
            type: String, 
            required: true,
        },
        description: {
            type: String, 
        },
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED'],
            default: 'COMPLETED',
        },
    },
    { timestamps: true }
);

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
