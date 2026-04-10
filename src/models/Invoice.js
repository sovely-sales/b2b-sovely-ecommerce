import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        sku: { type: String, required: true },
        title: { type: String, required: true },
        hsnCode: {
            type: String,
            required: function () {
                return this.parent().invoiceType !== 'WALLET_TOPUP';
            },
        },
        qty: { type: Number, required: true },

        unitBasePrice: { type: Number, required: true },
        totalBaseAmount: { type: Number, required: true },

        gstSlab: { type: Number, default: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },

        totalItemAmount: { type: Number, required: true },
    },
    { _id: false }
);

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        resellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        invoiceType: {
            type: String,

            enum: [
                'B2B_WHOLESALE',
                'DROPSHIP_PLATFORM_FEE',
                'SHIPPING_FEE',
                'RTO_PENALTY',
                'WALLET_TOPUP',
            ],
            required: true,
        },

        isInterState: {
            type: Boolean,
            required: function () {
                return this.invoiceType !== 'WALLET_TOPUP';
            },
        },

        billedTo: {
            companyName: { type: String },
            gstin: { type: String },
            address: {
                street: { type: String },
                city: { type: String },
                state: { type: String },
                zip: { type: String },
                stateCode: {
                    type: String,
                    required: function () {
                        return this.invoiceType !== 'WALLET_TOPUP';
                    },
                },
            },
        },

        shippedTo: {
            name: { type: String },
            address: {
                street: { type: String },
                city: { type: String },
                state: { type: String },
                zip: { type: String },
            },
        },

        items: [invoiceItemSchema],

        totalTaxableValue: {
            type: Number,
            required: function () {
                return this.invoiceType !== 'WALLET_TOPUP';
            },
        },
        totalCgst: { type: Number, default: 0 },
        totalSgst: { type: Number, default: 0 },
        totalIgst: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true },

        paymentStatus: {
            type: String,
            enum: ['UNPAID', 'PARTIAL', 'PAID', 'FAILED'],
            default: 'UNPAID',
        },
        paymentTerms: {
            type: String,
            enum: ['DUE_ON_RECEIPT', 'NET_15', 'NET_30', 'PREPAID'],
            default: 'DUE_ON_RECEIPT',
        },
        dueDate: { type: Date },
        razorpayOrderId: { type: String },

        status: {
            type: String,
            enum: ['DRAFT', 'GENERATED', 'CANCELLED'],
            default: 'GENERATED',
        },
        generatedAt: { type: Date, default: Date.now },
        pdfUrl: { type: String },
    },
    { timestamps: true }
);

invoiceSchema.index({ resellerId: 1 });
invoiceSchema.index({ orderId: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
