import mongoose, { Schema } from 'mongoose';

const ticketSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        ticketId: {
            type: String,
            required: true,
            unique: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['General', 'Order Issue', 'Technical', 'Billing', 'Other'],
            default: 'General',
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        attachment: {
            type: String, // Cloudinary URL
            default: '',
        },
        status: {
            type: String,
            required: true,
            enum: ['OPEN', 'RESOLVED'],
            default: 'OPEN',
        },
        adminNote: {
            type: String,
            default: '',
        },
        adminAttachment: {
            type: String, // Cloudinary URL
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
