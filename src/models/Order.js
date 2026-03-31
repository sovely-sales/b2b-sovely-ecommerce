import mongoose from 'mongoose';

const orderItemSnapshotSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        sku: { type: String, required: true },
        title: { type: String, required: true },
        image: { type: String },
        hsnCode: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },

        platformBasePrice: { type: Number, required: true },
        resellerSellingPrice: { type: Number, required: true },

        
        taxAmountPerUnit: { type: Number, required: true },
        gstSlab: { type: Number, required: true },
        shippingCost: { type: Number, required: true },
        actualWeight: { type: Number, required: true, default: 0 },
        volumetricWeight: { type: Number, required: true, default: 0 },
        billableWeight: { type: Number, required: true, default: 0 },
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

const ndrSchema = new mongoose.Schema(
    {
        attemptCount: { type: Number, default: 1 },
        reason: { type: String },
        resellerAction: {
            type: String,
            enum: ['REATTEMPT', 'RTO_REQUESTED', 'PENDING'],
            default: 'PENDING',
        },
        updatedCustomerPhone: { type: String },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true, unique: true },
        resellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        endCustomerDetails: {
            name: { type: String },
            phone: { type: String },
            address: {
                street: { type: String },
                city: { type: String },
                state: { type: String },
                zip: { type: String },
            },
        },
        status: {
            type: String,
            enum: [
                'PENDING',
                'PROCESSING',
                'SHIPPED',
                'NDR',
                'DELIVERED',
                'RTO',
                'PROFIT_CREDITED',
                'CANCELLED',
            ],
            default: 'PENDING',
        },
        statusHistory: [statusHistorySchema],
        ndrDetails: ndrSchema,

        tracking: {
            courierName: { type: String },
            trackingNumber: { type: String },
            trackingUrl: { type: String },
            awbNumber: { type: String },
        },

        paymentMethod: {
            type: String,
            enum: ['COD', 'PREPAID_WALLET', 'PREPAID_GATEWAY'],
            default: 'COD',
        },

        
        subTotal: { type: Number, required: true, default: 0 },
        taxTotal: { type: Number, required: true, default: 0 },
        shippingTotal: { type: Number, required: true, default: 0 },
        deliveryCharge: { type: Number, default: 0 },
        packingCharge: { type: Number, default: 0 },
        codCharge: { type: Number, required: true, default: 0 },
        totalPlatformCost: { type: Number, required: true },
        totalActualWeight: { type: Number, default: 0 },
        totalVolumetricWeight: { type: Number, default: 0 },
        totalBillableWeight: { type: Number, default: 0 },
        weightType: { type: String, enum: ['ACTUAL', 'VOLUMETRIC'] },

        amountToCollect: { type: Number, required: true },
        resellerProfitMargin: { type: Number, required: true },
        payoutOnDelivery: { type: Number, default: 0 },

        items: [orderItemSnapshotSchema],
        orderDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

orderSchema.index({ resellerId: 1, status: 1 });
orderSchema.index({ 'endCustomerDetails.phone': 1 });

export const Order = mongoose.model('Order', orderSchema);
