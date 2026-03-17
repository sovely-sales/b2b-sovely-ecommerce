import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema(
    {
        identifier: { type: String, required: true },
        otpCode: { type: String, required: true },
        isUsed: { type: Boolean, default: false },
        expiresAt: { type: Date, required: true, expires: 0 },
    },
    { timestamps: true }
);

otpTokenSchema.index(
    { identifier: 1 },
    { unique: true, partialFilterExpression: { isUsed: false } }
);

export const OtpToken = mongoose.model('OtpToken', otpTokenSchema);
