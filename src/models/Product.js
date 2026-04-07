import mongoose from 'mongoose';

const tieredPriceSchema = new mongoose.Schema(
    {
        minQty: { type: Number, required: true },
        maxQty: { type: Number },
        pricePerUnit: { type: Number, required: true },
    },
    { _id: false }
);

const inventorySchema = new mongoose.Schema(
    {
        stock: { type: Number, required: true, default: 0 },
        alertThreshold: { type: Number, default: 10 },
    },
    { _id: false }
);

const dimensionsSchema = new mongoose.Schema(
    {
        length: { type: Number, default: 0, required: true },
        width: { type: Number, default: 0, required: true },
        height: { type: Number, default: 0, required: true },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        sku: { type: String, required: true, unique: true },
        title: { type: String, required: true, trim: true },
        descriptionHTML: { type: String },
        vendor: { type: String },
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

        dropshipBasePrice: { type: Number, required: true },
        suggestedRetailPrice: { type: Number, required: true },
        estimatedMarginPercent: { type: Number, default: 0 },
        tieredPricing: [tieredPriceSchema],

        weightGrams: { type: Number, required: true },
        dimensions: dimensionsSchema,
        hsnCode: { type: String, required: true },
        gstSlab: { type: Number, enum: [0, 5, 18, 40], required: true },
        shippingDays: { type: String, default: '3-5' },

        returnPolicy: {
            type: String,
            enum: ['NO_RETURNS', '7_DAYS_REPLACEMENT', '7_DAYS_RETURN'],
            default: 'NO_RETURNS',
        },

        historicalRtoRate: {
            type: Number,
            default: 0,
            index: true,
        },
        isVerifiedSupplier: { type: Boolean, default: true },

        status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
        deletedAt: { type: Date, default: null },

        moq: { type: Number, default: 1 },
        inventory: inventorySchema,

        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },
    },

    { timestamps: true, optimisticConcurrency: true }
);

productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'inventory.stock': 1 });

productSchema.index(
    {
        title: 'text',
        sku: 'text',
        tags: 'text',
        vendor: 'text',
    },
    {
        weights: { title: 10, sku: 8, tags: 5, vendor: 2 },
        name: 'B2B_Text_Index',
    }
);

productSchema.pre('save', function () {
    if (this.suggestedRetailPrice > this.dropshipBasePrice && this.dropshipBasePrice > 0) {
        this.estimatedMarginPercent = Math.round(
            ((this.suggestedRetailPrice - this.dropshipBasePrice) / this.suggestedRetailPrice) * 100
        );
    } else {
        this.estimatedMarginPercent = 0;
    }
});

export const Product = mongoose.model('Product', productSchema);
