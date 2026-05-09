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
            required: true, // e.g. "Inventory Sync", "Product Catalog Import", "Order Export"
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
            type: Schema.Types.Mixed, // { inserted: 10, updated: 5, skipped: 2, errors: [] }
        },
    },
    { timestamps: true }
);

export const SyncHistory = mongoose.model('SyncHistory', syncHistorySchema);
