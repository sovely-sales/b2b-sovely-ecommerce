import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true }, // From Counter
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    }, // Nullable for top-ups
    invoiceType: {
        type: String,
        enum: ['ORDER_BILL', 'WALLET_TOPUP'],
        required: true
    },
    paymentTerms: {
        type: String,
        enum: ['DUE_ON_RECEIPT', 'NET_15', 'NET_30'],
        default: 'DUE_ON_RECEIPT'
    },
    paymentMethod: {
        type: String,
        enum: ['RAZORPAY', 'WALLET', 'BANK_TRANSFER'],
        default: 'RAZORPAY'
    },
    totalAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true }, // Should be calculated based on paymentTerms during creation
    status: {
        type: String,
        enum: ['UNPAID', 'PARTIAL', 'PAID'],
        default: 'UNPAID'
    }
}, { timestamps: true });

export const Invoice = mongoose.model('Invoice', invoiceSchema);