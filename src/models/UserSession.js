import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        tokenHash: { type: String, required: true },
        ipAddress: { type: String, default: '' },
        userAgent: { type: String, default: '' },
        deviceType: {
            type: String,
            enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
            default: 'Unknown',
        },
        os: { type: String, default: 'Unknown OS' },
        browser: { type: String, default: 'Unknown Browser' },
        lastSeenAt: { type: Date, default: Date.now, index: true },
        expiresAt: { type: Date, required: true, index: true },
        isRevoked: { type: Boolean, default: false, index: true },
        revokedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

userSessionSchema.index({ userId: 1, isRevoked: 1, lastSeenAt: -1 });

export const UserSession = mongoose.model('UserSession', userSessionSchema);
