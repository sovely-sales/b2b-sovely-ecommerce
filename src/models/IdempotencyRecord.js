import mongoose from 'mongoose';

const idempotencySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    
    
    response: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400, 
    },
});

export const IdempotencyRecord = mongoose.model('IdempotencyRecord', idempotencySchema);
