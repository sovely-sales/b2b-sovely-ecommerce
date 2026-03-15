import mongoose from 'mongoose';

const userPricingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    customPrice: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Prevent duplicate pricing rules for the same customer-product pair
userPricingSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const UserPricing = mongoose.model('UserPricing', userPricingSchema);
