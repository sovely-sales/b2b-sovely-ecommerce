import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        qty: {
            type: Number,
            required: true,
            min: 1,
        },
        orderType: {
            type: String,
            enum: ['DROPSHIP', 'WHOLESALE'],
            required: true,
            default: 'DROPSHIP',
        },
        platformUnitCost: { type: Number, required: true },
        resellerSellingPrice: { type: Number, default: 0 },
        gstSlab: { type: Number, default: 0 },
        taxAmountPerUnit: { type: Number, default: 0 },
        shippingCost: { type: Number, default: 0 },
        actualWeight: { type: Number, default: 0 },
        volumetricWeight: { type: Number, default: 0 },
        billableWeight: { type: Number, default: 0 },

        totalItemPlatformCost: { type: Number, required: true },
        expectedProfit: { type: Number, default: 0 },
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        resellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        items: [cartItemSchema],

        subTotalPlatformCost: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 },

        
        totalShippingCost: { type: Number, default: 0 },
        totalDeliveryCharge: { type: Number, default: 0 }, 
        totalPackingCharge: { type: Number, default: 0 }, 

        grandTotalPlatformCost: { type: Number, default: 0 },

        totalExpectedProfit: { type: Number, default: 0 },
        totalActualWeight: { type: Number, default: 0 },
        totalVolumetricWeight: { type: Number, default: 0 },
        totalBillableWeight: { type: Number, default: 0 },
        weightType: { type: String, enum: ['ACTUAL', 'VOLUMETRIC'] },
    },
    { timestamps: true }
);

export const Cart = mongoose.model('Cart', cartSchema);
