import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { qikinkService } from '../services/qikink.service.js';
import { SystemConfig } from '../models/SystemConfig.js';

export const createProduct = asyncHandler(async (req, res) => {
    let {
        sku,
        title,
        descriptionHTML,
        vendor,
        categoryId,
        images,
        dropshipBasePrice,
        suggestedRetailPrice,
        tieredPricing,
        weightGrams,
        dimensions,
        hsnCode,
        gstSlab,
        shippingDays,
        inventory,
        moq,
        status,
        tags,
    } = req.body;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        images = req.files.map((file, index) => ({
            url: `${req.protocol}://${req.get('host')}/temp/${file.filename}`,
            position: index + 1,
            altText: title,
        }));
    }

    if (
        !sku ||
        !title ||
        !dropshipBasePrice ||
        !suggestedRetailPrice ||
        !hsnCode ||
        gstSlab === undefined
    ) {
        throw new ApiError(400, 'Missing mandatory B2B fields (SKU, Title, Prices, HSN, GST Slab)');
    }

    const productExists = await Product.findOne({ sku });
    if (productExists) {
        throw new ApiError(409, `Product with SKU ${sku} already exists`);
    }

    const product = await Product.create({
        sku,
        title,
        descriptionHTML,
        vendor,
        categoryId,
        images,
        dropshipBasePrice,
        suggestedRetailPrice,
        tieredPricing,
        weightGrams,
        dimensions,
        hsnCode,
        gstSlab,
        shippingDays,
        inventory,
        moq,
        status,
        tags,
    });

    qikinkService.syncProduct(product).catch((err) => {
        console.error('Unhandled error during Qikink product sync:', err);
    });

    return res.status(201).json(new ApiResponse(201, product, 'B2B Product created successfully'));
});

export const getProducts = asyncHandler(async (req, res) => {
    const {
        search,
        category,
        minMargin,
        maxBasePrice,
        minBasePrice,
        minWeight,
        maxWeight,
        minMoq,
        maxMoq,
        inStock,
        isDropship,
        gstSlab,
        maxShippingDays,
        isVerifiedSupplier,
        sort,
        page = 1,
        limit = 20,
    } = req.query;

    const query = { status: 'active', deletedAt: null };
    let projection = { '-__v': 0 };

    const hasMinBasePrice = minBasePrice !== undefined;
    const hasMaxBasePrice = maxBasePrice !== undefined;
    const parsedMinBasePrice = hasMinBasePrice ? Number(minBasePrice) : null;
    const parsedMaxBasePrice = hasMaxBasePrice ? Number(maxBasePrice) : null;

    if (hasMinBasePrice && (!Number.isFinite(parsedMinBasePrice) || parsedMinBasePrice < 0)) {
        throw new ApiError(400, 'minBasePrice must be a non-negative number');
    }

    if (hasMaxBasePrice && (!Number.isFinite(parsedMaxBasePrice) || parsedMaxBasePrice < 0)) {
        throw new ApiError(400, 'maxBasePrice must be a non-negative number');
    }

    if (
        hasMinBasePrice &&
        hasMaxBasePrice &&
        parsedMinBasePrice !== null &&
        parsedMaxBasePrice !== null &&
        parsedMinBasePrice > parsedMaxBasePrice
    ) {
        throw new ApiError(400, 'minBasePrice cannot be greater than maxBasePrice');
    }

    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(safeSearch, 'i');
        query.$or = [
            { title: searchRegex },
            { sku: searchRegex },
            { tags: searchRegex },
            { vendor: searchRegex },
        ];
    }

    if (category) {
        if (mongoose.Types.ObjectId.isValid(category)) {
            query.categoryId = new mongoose.Types.ObjectId(category);
        } else {
            query.categoryId = category;
        }
    }

    if (minMargin) query.estimatedMarginPercent = { $gte: Number(minMargin) };
    if (req.query.margin) {
        const marginVal = Number(req.query.margin);
        if (marginVal > 0) {
            query.estimatedMarginPercent = { $gte: marginVal };
        }
    }

    if (hasMinBasePrice || hasMaxBasePrice) {
        query.dropshipBasePrice = {};
        if (parsedMinBasePrice !== null) query.dropshipBasePrice.$gte = parsedMinBasePrice;
        if (parsedMaxBasePrice !== null) query.dropshipBasePrice.$lte = parsedMaxBasePrice;
    }

    if (minWeight || maxWeight) {
        query.weightGrams = {};
        if (minWeight) query.weightGrams.$gte = Number(minWeight);
        if (maxWeight) query.weightGrams.$lte = Number(maxWeight);
    }

    if (minMoq || maxMoq) {
        query.moq = {};
        if (minMoq) query.moq.$gte = Number(minMoq);
        if (maxMoq) query.moq.$lte = Number(maxMoq);
    } else if (isDropship === 'true') {
        query.moq = 1;
    } else if (isDropship === 'false') {
        query.moq = { $gt: 1 };
    }

    if (inStock === 'true') {
        query['inventory.stock'] = { $gt: 0 };
    }

    if (req.query.stock && req.query.stock !== 'ALL') {
        const stockMode = req.query.stock;
        if (stockMode === 'IN_STOCK') {
            query['inventory.stock'] = { $gt: 10 };
        } else if (stockMode === 'LOW_STOCK') {
            query['inventory.stock'] = { $gt: 0, $lte: 10 };
        } else if (stockMode === 'OUT_OF_STOCK') {
            query['inventory.stock'] = { $lte: 0 };
        }
    }

    if (req.query.lowRtoRisk === 'true') {
        query.historicalRtoRate = { $lte: 10 };
    }

    if (gstSlab) {
        const slabs = gstSlab.split(',').map(Number);
        query.gstSlab = { $in: slabs };
    }

    if (maxShippingDays) {
        if (maxShippingDays === '1') {
            query.shippingDays = { $in: ['1', '1 Day', 'Same Day', '24h', 'Immediate'] };
        } else if (maxShippingDays === '3') {
            query.shippingDays = {
                $in: ['1', '2', '3', '1-3', '2-3', '1 Day', '3 Days', 'Same Day', '2-4 Days'],
            };
        } else if (maxShippingDays === '7') {
            query.shippingDays = {
                $in: [
                    '1',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '1-3',
                    '3-5',
                    '5-7',
                    '1 Day',
                    '3 Days',
                    '7 Days',
                    'Same Day',
                    '2-4 Days',
                    '5-7 Days',
                ],
            };
        }
    }

    if (isVerifiedSupplier === 'true') {
        query.isVerifiedSupplier = true;
    }

    if (req.query.vendor) {
        query.vendor = req.query.vendor;
    }

    const skip = (Number(page) - 1) * Number(limit);

    let sortParams = { createdAt: -1 };
    if (sort === 'price-asc') sortParams = { dropshipBasePrice: 1 };
    else if (sort === 'price-desc') sortParams = { dropshipBasePrice: -1 };
    else if (sort === 'margin') sortParams = { estimatedMarginPercent: -1 };

    const pipeline = [
        { $match: query },
        {
            $addFields: {
                isOutOfStock: { $cond: [{ $lte: ['$inventory.stock', 0] }, 1, 0] },
            },
        },
        { $sort: { isOutOfStock: 1, ...sortParams } },
        { $project: { __v: 0 } },
        { $skip: skip },
        { $limit: Number(limit) },
    ];

    let products = await Product.aggregate(pipeline);
    products = await Product.populate(products, { path: 'categoryId', select: 'name slug' });

    const total = await Product.countDocuments(query);

    const modifierConfig = await SystemConfig.findOne({ key: 'global_price_modifier' });
    const modifier = modifierConfig ? Number(modifierConfig.value) : 1;

    if (modifier !== 1) {
        products.forEach((p) => {
            p.dropshipBasePrice = Math.round(p.dropshipBasePrice * modifier);
            p.suggestedRetailPrice = Math.round(p.suggestedRetailPrice * modifier);
        });
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit)),
                },
            },
            'Products fetched successfully'
        )
    );
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null }).populate(
        'categoryId',
        'name slug'
    );

    if (!product) {
        throw new ApiError(404, 'Product not found or has been removed');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, 'Product details fetched successfully'));
});

export const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null });

    if (!product) {
        throw new ApiError(404, 'Product not found or has been removed');
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        req.body.images = req.files.map((file, index) => ({
            url: `${req.protocol}://${req.get('host')}/temp/${file.filename}`,
            position: index + 1,
            altText: req.body.title || product.title,
        }));
    }

    if (req.body.inventory && typeof req.body.inventory === 'object') {
        Object.assign(product.inventory, req.body.inventory);
        delete req.body.inventory;
    }

    if (req.body.tieredPricing) {
        product.tieredPricing = [];
    }

    Object.assign(product, req.body);
    await product.save();

    qikinkService.updateProduct(product).catch((err) => {
        console.error('Unhandled error during Qikink product update:', err);
    });

    return res.status(200).json(new ApiResponse(200, product, 'Product updated successfully'));
});

export const bulkAdjustPrices = asyncHandler(async (req, res) => {
    const { percentage } = req.body;

    const multiplier = 1 + percentage / 100;

    const result = await Product.updateMany(
        { deletedAt: null },
        [
            {
                $set: {
                    dropshipBasePrice: {
                        $round: [{ $multiply: ['$dropshipBasePrice', multiplier] }, 0],
                    },
                    suggestedRetailPrice: {
                        $round: [{ $multiply: ['$suggestedRetailPrice', multiplier] }, 0],
                    },
                },
            },

            {
                $set: {
                    estimatedMarginPercent: {
                        $cond: {
                            if: {
                                $and: [
                                    { $gt: ['$suggestedRetailPrice', '$dropshipBasePrice'] },
                                    { $gt: ['$dropshipBasePrice', 0] },
                                ],
                            },
                            then: {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            '$suggestedRetailPrice',
                                                            '$dropshipBasePrice',
                                                        ],
                                                    },
                                                    '$suggestedRetailPrice',
                                                ],
                                            },
                                            100,
                                        ],
                                    },
                                    0,
                                ],
                            },
                            else: 0,
                        },
                    },
                },
            },
        ],
        { updatePipeline: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { modifiedCount: result.modifiedCount },
                `Successfully adjusted prices for ${result.modifiedCount} active products by ${percentage >= 0 ? '+' : ''}${percentage}%.`
            )
        );
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null });

    if (!product) {
        throw new ApiError(404, 'Product not found or already deleted');
    }

    product.deletedAt = new Date();
    product.status = 'archived';
    await product.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, 'Product successfully deleted (archived)'));
});

export const getAllAdminProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, status, price, stock, sort } = req.query;

    const query = {};
    let projection = {};

    if (status && status !== 'ALL') {
        query.status = status;
    }

    if (price && price !== 'ALL') {
        if (price === 'UNDER_500') {
            query.dropshipBasePrice = { $lt: 500 };
        } else if (price === 'OVER_1000') {
            query.dropshipBasePrice = { $gte: 1000 };
        }
    }

    if (stock && stock !== 'ALL') {
        if (stock === 'IN_STOCK') {
            query['inventory.stock'] = { $gt: 10 };
        } else if (stock === 'LOW_STOCK') {
            query['inventory.stock'] = { $gt: 0, $lte: 10 };
        } else if (stock === 'OUT_OF_STOCK') {
            query['inventory.stock'] = { $lte: 0 };
        }
    }

    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(safeSearch, 'i');
        query.$or = [{ title: searchRegex }, { sku: searchRegex }, { vendor: searchRegex }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    let sortParams = { createdAt: -1 };
    if (sort === 'stock_asc') {
        sortParams = { 'inventory.stock': 1 };
    }

    const products = await Product.find(query, projection)
        .sort(sortParams)
        .skip(skip)
        .limit(Number(limit))
        .populate('categoryId', 'name');

    const total = await Product.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                products,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / Number(limit)),
                },
            },
            'Admin products fetched successfully'
        )
    );
});

export const validateBulkOrder = asyncHandler(async (req, res) => {
    const { skus } = req.body;

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
        throw new ApiError(400, 'Please provide an array of SKUs to validate.');
    }

    if (skus.length > 500) {
        throw new ApiError(400, 'Maximum 500 SKUs allowed per bulk validation request.');
    }

    const cleanSkus = skus.map((sku) => sku.replace(/["'\r\n]/g, '').trim());

    // Create case-insensitive regex for every SKU to prevent exact-match failures
    const regexSkus = cleanSkus.map(
        (sku) => new RegExp(`^${sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    );

    const products = await Product.find({
        sku: { $in: regexSkus },
        status: 'active',
        deletedAt: null,
    }).select(
        'sku title inventory.stock moq dropshipBasePrice platformSellPrice gstSlab weightGrams dimensions hsnCode'
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                products,
                `Validated ${products.length} out of ${skus.length} requested SKUs.`
            )
        );
});

export const getGlobalPriceModifier = asyncHandler(async (req, res) => {
    const config = await SystemConfig.findOne({ key: 'global_price_modifier' });
    // Default to 1 (100% / No modifier) if it doesn't exist yet
    const modifier = config ? config.value : 1;

    return res.status(200).json(new ApiResponse(200, { modifier }, 'Modifier fetched'));
});

export const updateGlobalPriceModifier = asyncHandler(async (req, res) => {
    const { modifier } = req.body; // e.g., 1.25 for 125%

    if (modifier < 0.1 || modifier > 5) {
        throw new ApiError(400, 'Modifier must be between 0.1x (10%) and 5x (500%)');
    }

    await SystemConfig.findOneAndUpdate(
        { key: 'global_price_modifier' },
        { value: modifier, description: 'Temporary global price multiplier' },
        { upsert: true, new: true }
    );

    return res.status(200).json(new ApiResponse(200, { modifier }, 'Temporary modifier active'));
});
