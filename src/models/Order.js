import mongoose from 'mongoose';

const orderItemSnapshotSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        sku: { type: String, required: true },
        title: { type: String, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        qty: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
    {
        status: { type: String, required: true },
        comment: { type: String },
        date: { type: Date, default: Date.now },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true, unique: true },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            default: 'PENDING',
        },
        statusHistory: [statusHistorySchema],
        tracking: {
            courierName: { type: String },
            trackingNumber: { type: String },
            trackingUrl: { type: String },
        },
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
        items: [orderItemSnapshotSchema],
        orderDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

orderSchema.index({ userId: 1, status: 1 });

orderSchema.pre('save', async function () {
    if (this.isNew) {
        this.statusHistory.push({ status: this.status, comment: 'Order placed successfully' });
    } else if (this.isModified('status')) {
        this.statusHistory.push({ status: this.status, comment: `Order marked as ${this.status}` });
    }
});

export const Order = mongoose.model('Order', orderSchema);
