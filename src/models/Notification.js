import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                'ORDER_APPROVAL_REQUIRED',
                'ORDER_APPROVED',
                'ORDER_REJECTED',
                'NDR_ALERT',
                'WALLET_UPDATE',
                'SYSTEM_ALERT',
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },

        referenceData: {
            referenceId: { type: String },
            referenceType: {
                type: String,
                enum: ['Order', 'WalletTransaction', 'Product', 'None'],
                default: 'None',
            },
            actionUrl: { type: String },
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification = mongoose.model('Notification', notificationSchema);
