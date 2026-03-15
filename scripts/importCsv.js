import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './src/models/Product.js';
import { Category } from './src/models/Category.js';
import connectDB from './src/db/index.js';

dotenv.config();

const parseCategories = async (categoryString) => {
    if (!categoryString) return null;
    const parts = categoryString.split('>').map(p => p.trim()).filter(p => p);
    if (parts.length === 0) return null;

    let parentId = null;
    let lastCategoryId = null;

    // In a high volume script, querying the DB in a loop is slow, but we need the exact hierarchy.
    // For 62k lines but limited unique categories, it might be fine, but we should cache it.
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

// Simple cache for category strings to IDs to speed up the import
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

const importData = async () => {
    await connectDB();

    const productsMap = new Map();

    console.log("Reading CSV...");

    fs.createReadStream('Reference_products_export_1 Complete.csv')
        .pipe(csv())
        .on('data', (row) => {
            const handle = row['Handle'];
            if (!handle) return;

            if (!productsMap.has(handle)) {
                productsMap.set(handle, {
                    handle,
                    title: row['Title'],
                    bodyHtml: row['Body (HTML)'],
                    vendor: row['Vendor'],
                    productCategory: row['Product Category'],
                    type: row['Type'],
                    tags: row['Tags'] ? row['Tags'].split(',').map(t => t.trim()) : [],
                    published: row['Published'] === 'TRUE',
                    sku: row['Variant SKU'],
                    weightGrams: parseFloat(row['Variant Grams']) || 0,
                    price: parseFloat(row['Variant Price']) || 0,
                    compareAtPrice: parseFloat(row['Variant Compare At Price']) || null,
                    seoTitle: row['SEO Title'],
                    seoDescription: row['SEO Description'],
                    status: row['Status']?.toLowerCase() || 'active',
                    images: []
                });
            }

            const product = productsMap.get(handle);

            // If the first row was missing SKU/Title 
            if (!product.sku && row['Variant SKU']) product.sku = row['Variant SKU'];
            if (!product.title && row['Title']) product.title = row['Title'];

            const imageSrc = row['Image Src'];
            if (imageSrc) {
                product.images.push({
                    url: imageSrc,
                    position: parseInt(row['Image Position'], 10) || product.images.length + 1,
                    altText: row['Image Alt Text'] || ''
                });
            }
        })
        .on('end', async () => {
            console.log(`CSV parsed. Found ${productsMap.size} unique products.`);

            try {
                let count = 0;
                let defCat = await Category.findOne({ name: "Uncategorized", parentCategoryId: null });
                if (!defCat) defCat = await Category.create({ name: "Uncategorized", parentCategoryId: null });

                for (const [handle, data] of productsMap.entries()) {
                    if (!data.title) {
                        console.log(`Skipping handle ${handle} (No Title)`);
                        continue;
                    }

                    const categoryId = await getCategoryId(data.productCategory, defCat._id);

                    let status = data.status === 'active' ? 'active' : (data.status === 'draft' ? 'draft' : 'archived');

                    const productPayload = {
                        sku: data.sku || handle, // fallback to handle if sku is missing
                        title: data.title,
                        descriptionHTML: data.bodyHtml,
                        vendor: data.vendor,
                        productType: data.type,
                        tags: data.tags,
                        categoryId: categoryId,
                        images: data.images,
                        platformSellPrice: data.price,
                        compareAtPrice: data.compareAtPrice,
                        weightGrams: data.weightGrams,
                        seoTitle: data.seoTitle,
                        seoDescription: data.seoDescription,
                        status: status,
                        inventory: { stock: 50, alertThreshold: 10 }
                    };

                    try {
                        await Product.findOneAndUpdate(
                            { sku: productPayload.sku },
                            { $set: productPayload },
                            { upsert: true, new: true }
                        );
                        count++;
                        if (count % 100 === 0) console.log(`Upserted ${count} products...`);
                    } catch (innerErr) {
                        console.error(`Failed to upsert product ${productPayload.sku}`, innerErr.message);
                    }
                }
                console.log(`Import Complete! Total upserted: ${count}`);
                process.exit(0);
            } catch (err) {
                console.error("Error during DB import:", err);
                process.exit(1);
            }
        });
};

importData();
