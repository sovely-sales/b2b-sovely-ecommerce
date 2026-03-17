import mongoose from 'mongoose';

const stockAdjustmentSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        adminUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        adjustedAmount: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const StockAdjustment = mongoose.model('StockAdjustment', stockAdjustmentSchema);
