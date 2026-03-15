import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    parentCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
}, { timestamps: true });

categorySchema.index({ name: 1 });

export const Category = mongoose.model('Category', categorySchema);