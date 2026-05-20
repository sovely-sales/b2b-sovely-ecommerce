import mongoose, { Schema } from 'mongoose';

const syncHistorySchema = new Schema(
    {
        admin: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['IMPORT', 'EXPORT', 'SYNC'],
        },
        purpose: {
            type: String,
            required: true,
        },
        filename: {
            type: String,
        },
        fileSize: {
            type: String,
        },
        status: {
            type: String,
            enum: ['SUCCESS', 'FAILURE', 'PARTIAL_SUCCESS'],
            default: 'SUCCESS',
        },
        details: {
            type: Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

export const SyncHistory = mongoose.model('SyncHistory', syncHistorySchema);
