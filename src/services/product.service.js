import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import * as xlsx from 'xlsx';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { UserPricing } from '../models/UserPricing.js';

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export class ProductService {
    static async getAllProducts(queryParams) {
        const {
            page = 1,
            limit = 24,
            query,
            categoryId,
            minPrice,
            maxPrice,
            saleOnly,
            shipping,
            minRating,
            sort,

            moqTier,
            marginFilter,
            inStock,
        } = queryParams;

        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.max(1, parseInt(limit, 10) || 24);

        const filter = {};

        if (query) {
            const safeSearch = escapeRegex(query);

            filter.$or = [
                { sku: { $regex: safeSearch, $options: 'i' } },

                { title: { $regex: safeSearch, $options: 'i' } },

                { vendor: { $regex: safeSearch, $options: 'i' } },

                { tags: { $regex: safeSearch, $options: 'i' } },

                { productType: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        if (categoryId && categoryId !== 'All')
            filter.categoryId = new mongoose.Types.ObjectId(categoryId);
        if (saleOnly === 'true') filter.discountPercent = { $gt: 0 };

        if (minPrice || maxPrice) {
            filter.platformSellPrice = {};
            if (minPrice) filter.platformSellPrice.$gte = Number(minPrice);
            if (maxPrice) filter.platformSellPrice.$lte = Number(maxPrice);
        }

        if (minRating) filter.averageRating = { $gte: Number(minRating) };
        if (shipping) filter.shippingDays = { $in: shipping.split(',') };

        if (inStock === 'true') {
            filter['inventory.stock'] = { $gt: 0 };
        }

        if (moqTier && moqTier !== 'all') {
            if (moqTier === 'under-50') filter.moq = { $lt: 50 };
            else if (moqTier === '50-500') filter.moq = { $gte: 50, $lte: 500 };
            else if (moqTier === 'bulk') filter.moq = { $gt: 500 };
        }

        if (marginFilter === 'high-margin') {
            filter.$expr = {
                $gte: ['$compareAtPrice', { $divide: ['$platformSellPrice', 0.6] }],
            };
        }

        let sortOption = { createdAt: -1 };

        if (sort) {
            if (sort === 'price-asc') sortOption = { platformSellPrice: 1 };
            if (sort === 'price-desc') sortOption = { platformSellPrice: -1 };
            if (sort === 'rating') sortOption = { averageRating: -1 };
            if (sort === 'margin') sortOption = { discountPercent: -1 };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(filter)
            .populate('categoryId', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(safeLimit);

        const total = await Product.countDocuments(filter);

        return {
            products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / safeLimit),
            },
        };
    }

    static async getProductById(productId, userId = null) {
        if (!mongoose.isValidObjectId(productId)) {
            throw new ApiError(400, 'Invalid product ID');
        }

        const product = await Product.findById(productId).populate('categoryId', 'name').lean();

        if (!product) throw new ApiError(404, 'Product not found');

        if (userId) {
            const customPricing = await UserPricing.findOne({
                userId: userId,
                productId: productId,
            }).lean();

            if (customPricing && customPricing.customPrice) {
                product.customPrice = customPricing.customPrice;
            }
        }

        return product;
    }

    static async getBestDeals(limitParams) {
        const limit = Math.min(parseInt(limitParams) || 6, 20);
        return await Product.find({ status: 'active', discountPercent: { $gt: 0 } })
            .sort({ discountPercent: -1 })
            .limit(limit)
            .populate('categoryId', 'name');
    }

    static async getAdminProducts(queryParams = {}) {
        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const search = queryParams.search || '';
        const status = queryParams.status || 'ALL';
        const price = queryParams.price || 'ALL';
        const stock = queryParams.stock || 'ALL';

        const filter = {};

        if (status !== 'ALL') filter.status = status;

        if (search) {
            const safeSearch = escapeRegex(search);
            filter['$or'] = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { sku: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        if (price === 'UNDER_500') filter.platformSellPrice = { $lt: 500 };
        if (price === 'OVER_1000') filter.platformSellPrice = { $gte: 1000 };

        if (stock === 'OUT_OF_STOCK') filter['inventory.stock'] = 0;
        if (stock === 'LOW_STOCK') filter['inventory.stock'] = { $gt: 0, $lte: 10 };
        if (stock === 'IN_STOCK') filter['inventory.stock'] = { $gt: 10 };

        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

        return {
            data: products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    static async updateProduct(productId, updateData) {
        const { platformSellPrice, stock, status } = updateData;
        const product = await Product.findById(productId);

        if (!product) throw new ApiError(404, 'Product not found');

        if (platformSellPrice !== undefined) product.platformSellPrice = platformSellPrice;
        if (status !== undefined) product.status = status;

        if (stock !== undefined) {
            if (!product.inventory) product.inventory = {};
            product.inventory.stock = stock;
        }

        await product.save();
        return product;
    }

    static async createProduct(productData, files) {
        const images = files
            ? files.map((file, index) => ({
                  url: `/temp/${file.filename}`,
                  position: index + 1,
                  altText: productData.title,
              }))
            : [];

        const newProduct = await Product.create({
            ...productData,
            images,
            inventory: { stock: productData.stock || 0 },
        });

        return newProduct;
    }

    static async processBulkUpload(file) {
        if (!file) throw new ApiError(400, 'No file uploaded');

        const filePath = file.path;
        const productsMap = new Map();
        const localCategoryCache = new Map();

        const parseCategories = async (categoryString) => {
            if (!categoryString) return null;
            const parts = categoryString
                .split('>')
                .map((p) => p.trim())
                .filter((p) => p);
            if (parts.length === 0) return null;

            let parentId = null;
            let lastCategoryId = null;

            for (const part of parts) {
                let cat = await Category.findOne({ name: part, parentCategoryId: parentId });
                if (!cat) cat = await Category.create({ name: part, parentCategoryId: parentId });
                parentId = cat._id;
                lastCategoryId = cat._id;
            }
            return lastCategoryId;
        };

        const processRow = (row) => {
            const handle = row['Handle'] || row['handle'];
            if (!handle) return;

            if (!productsMap.has(handle)) {
                productsMap.set(handle, {
                    handle,
                    title: row['Title'] || row['title'],
                    descriptionHTML: row['Body (HTML)'] || row['bodyHtml'] || row['description'],
                    vendor: row['Vendor'] || row['vendor'],
                    productCategory: row['Product Category'] || row['category'],
                    productType: row['Type'] || row['type'],
                    tags: row['Tags'] ? row['Tags'].split(',').map((t) => t.trim()) : [],
                    sku: row['Variant SKU'] || row['sku'] || handle,
                    platformSellPrice:
                        parseFloat(row['Variant Price'] || row['Price'] || row['price']) || 0,
                    compareAtPrice:
                        parseFloat(row['Variant Compare At Price'] || row['compareAtPrice']) ||
                        null,
                    status: (row['Status'] || row['status'] || 'active').toLowerCase(),
                    images: [],
                });
            }

            const product = productsMap.get(handle);
            const imageSrc = row['Image Src'] || row['imageSrc'];
            if (imageSrc) {
                product.images.push({
                    url: imageSrc,
                    position:
                        parseInt(row['Image Position'] || row['imagePosition'], 10) ||
                        product.images.length + 1,
                    altText: row['Image Alt Text'] || row['imageAltText'] || '',
                });
            }
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
                xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]).forEach(processRow);
            }

            let defCat = await Category.findOne({ name: 'Uncategorized' });
            if (!defCat)
                defCat = await Category.create({ name: 'Uncategorized', parentCategoryId: null });

            const bulkOperations = [];

            for (const data of productsMap.values()) {
                if (!data.title) continue;

                let finalCatId = defCat._id;
                if (data.productCategory) {
                    if (localCategoryCache.has(data.productCategory)) {
                        finalCatId = localCategoryCache.get(data.productCategory);
                    } else {
                        const parsedId = await parseCategories(data.productCategory);
                        finalCatId = parsedId || defCat._id;
                        localCategoryCache.set(data.productCategory, finalCatId);
                    }
                }

                let discountPercent = 0;
                if (data.compareAtPrice && data.compareAtPrice > data.platformSellPrice) {
                    discountPercent = Math.round(
                        ((data.compareAtPrice - data.platformSellPrice) / data.compareAtPrice) * 100
                    );
                }

                bulkOperations.push({
                    updateOne: {
                        filter: { sku: data.sku },
                        update: {
                            $set: {
                                sku: data.sku,
                                title: data.title,
                                descriptionHTML: data.descriptionHTML,
                                vendor: data.vendor,
                                productType: data.productType,
                                tags: data.tags,
                                categoryId: finalCatId,
                                images: data.images,
                                platformSellPrice: data.platformSellPrice,
                                compareAtPrice: data.compareAtPrice,
                                discountPercent: discountPercent,
                                status: data.status,
                                shippingDays: '3-5',
                                averageRating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
                                reviewCount: Math.floor(Math.random() * 50) + 5,
                            },
                            $setOnInsert: { inventory: { stock: 0, alertThreshold: 10 } },
                        },
                        upsert: true,
                    },
                });
            }

            if (bulkOperations.length > 0) {
                await Product.bulkWrite(bulkOperations);
            }

            fs.unlinkSync(filePath);
            return bulkOperations.length;
        } catch (error) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw new ApiError(500, 'Error processing bulk upload: ' + error.message);
        }
    }
}
