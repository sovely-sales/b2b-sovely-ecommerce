import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
        invoiceType: { type: String, enum: ['ORDER_BILL', 'WALLET_TOPUP'], required: true },

        razorpayOrderId: { type: String, sparse: true },

        paymentTerms: {
            type: String,
            enum: ['DUE_ON_RECEIPT', 'NET_15', 'NET_30'],
            default: 'DUE_ON_RECEIPT',
        },
        paymentMethod: {
            type: String,
            enum: ['RAZORPAY', 'WALLET', 'BANK_TRANSFER'],
            default: 'RAZORPAY',
        },
        totalAmount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'],
            default: 'UNPAID',
        },
    },
    { timestamps: true }
);

export const Invoice = mongoose.model('Invoice', invoiceSchema);
