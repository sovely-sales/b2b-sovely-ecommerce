import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import * as xlsx from "xlsx";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js"; // Required for Mongoose .populate() to work
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const parseCategories = async (categoryString) => {
    if (!categoryString) return null;
    const parts = categoryString.split('>').map(p => p.trim()).filter(p => p);
    if (parts.length === 0) return null;

    let parentId = null;
    let lastCategoryId = null;

    for (const part of parts) {
        let cat = await Category.findOne({ name: part, parentCategoryId: parentId });
        if (!cat) {
            cat = await Category.create({ name: part, parentCategoryId: parentId });
        }
        parentId = cat._id;
        lastCategoryId = cat._id;
    }
    return lastCategoryId;
};

const categoryCache = new Map();

const getCategoryId = async (categoryString, defCatId) => {
    if (!categoryString) return defCatId;
    if (categoryCache.has(categoryString)) {
        return categoryCache.get(categoryString);
    }
    const id = await parseCategories(categoryString);
    const finalId = id || defCatId;
    categoryCache.set(categoryString, finalId);
    return finalId;
};

const getProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, query, categoryId } = req.query;

    const filter = {};

    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }

    if (categoryId) {
        // Collect all descendant category IDs recursively to include products nested deeply
        const rootId = new mongoose.Types.ObjectId(categoryId);
        const categoryIds = [rootId];
        let currentLevelIds = [rootId];

        while (currentLevelIds.length > 0) {
            const children = await Category.find({ parentCategoryId: { $in: currentLevelIds } }, '_id').lean();
            if (children.length > 0) {
                currentLevelIds = children.map(c => c._id);
                categoryIds.push(...currentLevelIds);
            } else {
                currentLevelIds = [];
            }
        }

        filter.categoryId = { $in: categoryIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
        .populate("categoryId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
            }
        }, "Products fetched successfully")
    );
});

const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const product = await Product.findById(productId).populate("categoryId", "name");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
        new ApiResponse(200, product, "Product fetched successfully")
    );
});

/**
 * GET /api/v1/products/deals
 * Returns the top deals ranked by discount percentage.
 * A "deal" is any active product where compareAtPrice > platformSellPrice.
 */
const getBestDeals = asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    const deals = await Product.aggregate([
        // Only active products with a real discount
        {
            $match: {
                status: "active",
                compareAtPrice: { $exists: true, $gt: 0 },
                $expr: { $gt: ["$compareAtPrice", "$platformSellPrice"] }
            }
        },
        // Compute discount percentage
        {
            $addFields: {
                discountPercent: {
                    $round: [
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        { $subtract: ["$compareAtPrice", "$platformSellPrice"] },
                                        "$compareAtPrice"
                                    ]
                                },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        },
        // Best discounts first
        { $sort: { discountPercent: -1 } },
        { $limit: limit },
        // Populate category name
        {
            $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "categoryId"
            }
        },
        { $unwind: { path: "$categoryId", preserveNullAndEmptyArrays: true } },
        // Shape output
        {
            $project: {
                _id: 1,
                sku: 1,
                title: 1,
                images: 1,
                platformSellPrice: 1,
                compareAtPrice: 1,
                discountPercent: 1,
                "categoryId.name": 1,
                inventory: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, deals, "Best deals fetched successfully")
    );
});

// Add this to the bottom of product.controller.js (above the export line)
const getAdminProducts = asyncHandler(async (req, res) => {
    // Fetching the latest 50 products so your demo doesn't lag from rendering 800 rows at once!
    const products = await Product.find().sort({ createdAt: -1 }).limit(50);
    return res.status(200).json(new ApiResponse(200, products, "Admin products fetched"));
});

const updateAdminProduct = asyncHandler(async (req, res) => {
    const { platformSellPrice, stock, status } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) throw new ApiError(404, "Product not found");

    if (platformSellPrice !== undefined) product.platformSellPrice = platformSellPrice;
    if (stock !== undefined) product.inventory.stock = stock;
    if (status !== undefined) product.status = status;

    await product.save();
    return res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
});

const bulkUploadProducts = asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
        throw new ApiError(400, "No file uploaded");
    }

    const filePath = file.path;
    const productsMap = new Map();

    const processRow = (row) => {
        const handle = row['Handle'] || row['handle'];
        if (!handle) return;

        if (!productsMap.has(handle)) {
            productsMap.set(handle, {
                handle,
                title: row['Title'] || row['title'],
                bodyHtml: row['Body (HTML)'] || row['bodyHtml'] || row['description'],
                vendor: row['Vendor'] || row['vendor'],
                productCategory: row['Product Category'] || row['category'],
                type: row['Type'] || row['type'],
                tags: row['Tags'] ? row['Tags'].split(',').map(t => t.trim()) : [],
                sku: row['Variant SKU'] || row['sku'],
                price: parseFloat(row['Variant Price'] || row['Price'] || row['price'] || row['Price / India']) || 0,
                compareAtPrice: parseFloat(row['Variant Compare At Price'] || row['Compare At Price / India'] || row['compareAtPrice']) || null,
                status: (row['Status'] || row['status'] || 'active').toLowerCase(),
                images: []
            });
        }

        const product = productsMap.get(handle);
        const imageSrc = row['Image Src'] || row['imageSrc'];
        if (imageSrc) {
            product.images.push({
                url: imageSrc,
                position: parseInt(row['Image Position'] || row['imagePosition'], 10) || product.images.length + 1,
                altText: row['Image Alt Text'] || row['imageAltText'] || ''
            });
        }
    };

    const importData = async () => {
        let defCat = await Category.findOne({ name: "Uncategorized", parentCategoryId: null });
        if (!defCat) defCat = await Category.create({ name: "Uncategorized", parentCategoryId: null });

        let count = 0;
        for (const [handle, data] of productsMap.entries()) {
            if (!data.title) continue;

            const categoryId = await getCategoryId(data.productCategory, defCat._id);

            const productPayload = {
                sku: data.sku || handle,
                title: data.title,
                descriptionHTML: data.bodyHtml,
                vendor: data.vendor,
                productType: data.type,
                tags: data.tags,
                categoryId: categoryId,
                images: data.images,
                platformSellPrice: data.price,
                compareAtPrice: data.compareAtPrice,
                status: data.status === 'active' || data.status === 'draft' ? data.status : 'active',
                inventory: { stock: 50, alertThreshold: 10 }
            };

            await Product.findOneAndUpdate(
                { sku: productPayload.sku },
                { $set: productPayload },
                { upsert: true }
            );
            count++;
        }
        return count;
    };

    try {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', processRow)
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
            rows.forEach(processRow);
        }

        const totalUpserted = await importData();

        // Cleanup temp file
        fs.unlinkSync(filePath);

        return res.status(200).json(
            new ApiResponse(200, { total: totalUpserted }, "Products uploaded and processed successfully")
        );
    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw new ApiError(500, "Error processing bulk upload: " + error.message);
    }
});

const generateSampleTemplate = asyncHandler(async (req, res) => {
    const headers = "Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Option1 Linked To,Option2 Name,Option2 Value,Option2 Linked To,Option3 Name,Option3 Value,Option3 Linked To,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Unit Price Total Measure,Unit Price Total Measure Unit,Unit Price Base Measure,Unit Price Base Measure Unit,Variant Barcode,Image Src,Image Position,Image Alt Text,Gift Card,SEO Title,SEO Description,Google Shopping / Google Product Category,Google Shopping / Gender,Google Shopping / Age Group,Google Shopping / MPN,Google Shopping / Condition,Google Shopping / Custom Product,Google Shopping / Custom Label 0,Google Shopping / Custom Label 1,Google Shopping / Custom Label 2,Google Shopping / Custom Label 3,Google Shopping / Custom Label 4,Variant Image,Variant Weight Unit,Variant Tax Code,Cost per item,Included / India,Price / India,Compare At Price / India,Status";
    const sampleRow = "\nwhite-waterproof-phone-pouch,\"White Waterproof Phone Pouch Bag\",\"<p>Protect your phone underwater!</p>\",Sovely,Electronics > Communications > Telephony > Mobile Phone Accessories,Mobile Covers,\"Mobile Accessories, monsoon, Waterproof\",TRUE,Title,Default Title,,,,,,,,SHIRT-001,168,shopify,deny,manual,78,234,TRUE,TRUE,,,,,,https://example.com/image1.jpg,1,,FALSE,Shop Waterproof Phone Pouch,\"Protect your phone from water!\",2353,,,,,,,,,,,,g,,,TRUE,,,active";

    const csvContent = headers + sampleRow;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample_products_template.csv');
    return res.status(200).send(csvContent);
});

export { getProducts, getProductById, getBestDeals, getAdminProducts, updateAdminProduct, bulkUploadProducts, generateSampleTemplate };
