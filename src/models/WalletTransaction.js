import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null
    }, // Path A
    adminUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }, // Path B
    amount: { type: Number, required: true },
    transactionType: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    description: { type: String, required: true }
}, { timestamps: true });

// The Dual-Path Integrity Enforcer
walletTransactionSchema.pre('validate', function () {
    if (!this.paymentId && !this.adminUserId) {
        throw new Error('Transaction must link to either a Payment or an Admin.');
    }
    if (this.paymentId && this.adminUserId) {
        throw new Error('Transaction cannot link to both Payment and Admin.');
    }
});

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);