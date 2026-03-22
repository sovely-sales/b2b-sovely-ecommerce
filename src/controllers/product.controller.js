import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Create a new B2B/Dropship Product (ADMIN ONLY)
 * @route   POST /api/products
 */
export const createProduct = asyncHandler(async (req, res) => {
    const {
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

    // Basic B2B Validation
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

    // Note: estimatedMarginPercent is auto-calculated by the Mongoose pre-save hook!

    return res.status(201).json(new ApiResponse(201, product, 'B2B Product created successfully'));
});

/**
 * @desc    Get all products with Reseller/B2B filters (Regex Search)
 * @route   GET /api/products
 */
export const getProducts = asyncHandler(async (req, res) => {
    const {
        search,
        category,
        minMargin,
        maxBasePrice,
        minBasePrice, // NEW
        minMoq, // NEW
        maxMoq, // NEW
        inStock, // NEW
        isDropship,
        page = 1,
        limit = 20,
    } = req.query;

    const query = { status: 'active', deletedAt: null };
    let projection = { '-__v': 0 };

    // 1. Regex Text Search
    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(safeSearch, 'i');

        query.$or = [
            { title: { $regex: searchRegex } },
            { sku: { $regex: searchRegex } },
            { tags: { $regex: searchRegex } },
            { vendor: { $regex: searchRegex } },
        ];
    }

    // 2. Category Filter
    if (category) query.categoryId = category;

    // 3. Profit Margin Filter
    if (minMargin) query.estimatedMarginPercent = { $gte: Number(minMargin) };

    // 4. Base Price Filters
    if (minBasePrice || maxBasePrice) {
        query.dropshipBasePrice = {};
        if (minBasePrice) query.dropshipBasePrice.$gte = Number(minBasePrice);
        if (maxBasePrice) query.dropshipBasePrice.$lte = Number(maxBasePrice);
    }

    // 5. MOQ Filters
    if (minMoq || maxMoq) {
        query.moq = {};
        if (minMoq) query.moq.$gte = Number(minMoq);
        if (maxMoq) query.moq.$lte = Number(maxMoq);
    } else if (isDropship === 'true') {
        query.moq = 1;
    } else if (isDropship === 'false') {
        query.moq = { $gt: 1 };
    }

    // 6. Ready to Ship (In Stock) Filter
    if (inStock === 'true') {
        query['inventory.stock'] = { $gt: 0 };
    }

    if (req.query.margin) {
        query.estimatedMarginPercent = { $gte: Number(req.query.margin) };
    }

    if (req.query.lowRtoRisk === 'true') {
        query.historicalRtoRate = { $lte: 10 }; // Only show products with < 10% RTO rate
    }

    // Setup Pagination & Sorting
    const skip = (Number(page) - 1) * Number(limit);
    const sortParams = { createdAt: -1 };

    const products = await Product.find(query, projection)
        .sort(sortParams)
        .skip(skip)
        .limit(Number(limit))
        .populate('categoryId', 'name slug');

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
            'Products fetched successfully'
        )
    );
});

/**
 * @desc    Get single product details (Includes Tiered Pricing for UI rendering)
 * @route   GET /api/products/:id
 */
export const getProductById = asyncHandler(async (req, res) => {
    // FIX: Ensure we don't fetch soft-deleted products
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

/**
 * @desc    Update a Product (ADMIN ONLY)
 * @route   PUT /api/products/:id
 */
export const updateProduct = asyncHandler(async (req, res) => {
    // FIX: Prevent updating a product that has been soft-deleted
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null });

    if (!product) {
        throw new ApiError(404, 'Product not found or has been removed');
    }

    // Update fields (Mongoose will trigger the pre-save hook to recalculate margins if prices change)
    Object.assign(product, req.body);
    await product.save();

    return res.status(200).json(new ApiResponse(200, product, 'Product updated successfully'));
});

/**
 * @desc    Soft Delete a Product (ADMIN ONLY)
 * @route   DELETE /api/products/:id
 */
export const deleteProduct = asyncHandler(async (req, res) => {
    // We don't use findByIdAndDelete because we need to preserve historical orders
    const product = await Product.findOne({ _id: req.params.id, deletedAt: null });

    if (!product) {
        throw new ApiError(404, 'Product not found or already deleted');
    }

    // Apply Soft Delete
    product.deletedAt = new Date();
    product.status = 'archived'; // Double safety to remove it from active queries
    await product.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, 'Product successfully deleted (archived)'));
});
/**
 * @desc    Get ALL products (including inactive/deleted) for Admin Dashboard
 * @route   GET /api/products/admin/all
 */
export const getAllAdminProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    
    // Admins need to see everything, so we don't filter out deletedAt or inactive status
    const query = {};

    if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(safeSearch, 'i');
        query.$or = [
            { title: { $regex: searchRegex } },
            { sku: { $regex: searchRegex } },
            { vendor: { $regex: searchRegex } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const products = await Product.find(query)
        .sort({ createdAt: -1 }) // Newest first
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