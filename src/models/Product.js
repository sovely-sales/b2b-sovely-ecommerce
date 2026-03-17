import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
    {
        stock: { type: Number, required: true, default: 0 },
        alertThreshold: { type: Number, default: 10 },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        sku: { type: String, required: true, unique: true },
        title: { type: String, required: true, trim: true },
        descriptionHTML: { type: String },
        vendor: { type: String },
        productType: { type: String },
        tags: [{ type: String }],
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        images: [
            {
                url: { type: String, required: true },
                position: { type: Number },
                altText: { type: String },
            },
        ],
        platformSellPrice: { type: Number, required: true },
        compareAtPrice: { type: Number },
        discountPercent: { type: Number, default: 0 },
        weightGrams: { type: Number },
        seoTitle: { type: String },
        seoDescription: { type: String },
        status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
        moq: { type: Number, default: 1 },
        inventory: inventorySchema,

        shippingDays: { type: String, default: '3-5' },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

productSchema.index({ title: 'text', tags: 'text' });

productSchema.index({ categoryId: 1 });

productSchema.index({ status: 1, discountPercent: -1 });

productSchema.index({ platformSellPrice: 1 });
productSchema.index({ averageRating: -1 });

productSchema.index({ 'inventory.stock': 1 });

productSchema.pre('save', function (next) {
    if (
        this.compareAtPrice &&
        this.compareAtPrice > this.platformSellPrice &&
        this.platformSellPrice > 0
    ) {
        this.discountPercent = Math.round(
            ((this.compareAtPrice - this.platformSellPrice) / this.compareAtPrice) * 100
        );
    } else {
        this.discountPercent = 0;
    }
    next();
});

export const Product = mongoose.model('Product', productSchema);
