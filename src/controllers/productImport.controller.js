import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toNum = (val) => {
    if (!val) return 0;
    
    const str = String(val).replace(/[^\d.-]/g, '');
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
};
const parseTags = (tagStr) => {
    if (!tagStr) return [];
    return tagStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
};
const parseDimensions = (html) => {
    if (!html) return { length: 1, width: 1, height: 1 };
    const get = (label) => {
        const m = html.match(new RegExp(`${label}\\s*\\(Cm\\)\\s*:-\\s*([\\d.]+)`, 'i'));
        return m ? parseFloat(m[1]) : 1;
    };
    return { length: get('Length') || 1, width: get('Breadth') || 1, height: get('Height') || 1 };
};
const parseWeightFromHTML = (html, fallback) => {
    if (!html) return fallback || 100;
    const m = html.match(/Product Weight\s*\(Gm\)\s*:-\s*([\d.]+)/i);
    return m ? parseFloat(m[1]) : fallback || 100;
};

export const importProductsFromCSV = asyncHandler(async (req, res) => {
    console.log('🚀 [DRY-RUN] CSV Import Process Started');
    if (!req.file) {
        console.error('❌ No file uploaded');
        throw new ApiError(
            400,
            'No CSV file uploaded. Please attach a file with field name "csvFile".'
        );
    }

    console.log(
        `📦 File received: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`
    );
    
    const productMap = new Map();
    await new Promise((resolve, reject) => {
        const readable = Readable.from(req.file.buffer.toString('utf8'));
        readable
            .pipe(csvParser())
            .on('data', (row) => {
                const handle = (row['Handle'] || '').trim();
                if (!handle) return;

                if (!productMap.has(handle)) {
                    productMap.set(handle, {
                        handle,
                        title: (row['Title'] || '').trim(),
                        description: row['Body (HTML)'] || '',
                        vendor: (row['Vendor'] || '').trim() || 'Your Brand',
                        type: (row['Type'] || '').trim() || 'General',
                        tags: parseTags(row['Tags']),
                        sku: (row['Variant SKU'] || '').trim(),
                        weightGrams: toNum(row['Variant Grams']) || 100,
                        price: toNum(row['Variant Price']),
                        cost: toNum(row['Cost per item']),
                        status: (row['Status'] || 'active').toLowerCase(),
                        images: [],
                    });
                }

                const imgSrc = (row['Image Src'] || '').trim();
                if (imgSrc) {
                    const product = productMap.get(handle);
                    if (!product.images.find((i) => i.url === imgSrc)) {
                        product.images.push({
                            url: imgSrc,
                            position: toNum(row['Image Position']) || product.images.length + 1,
                            altText: (row['Image Alt Text'] || '').trim(),
                        });
                    }
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    if (productMap.size === 0) {
        throw new ApiError(
            400,
            'CSV file contained no valid product rows. Ensure column headers match the Shopify export format.'
        );
    }

    
    const categoryNames = [...new Set([...productMap.values()].map((p) => p.type || 'General'))];
    const categoryIdMap = new Map();
    for (const name of categoryNames) {
        let cat = await Category.findOne({ name });
        if (!cat) cat = await Category.create({ name });
        categoryIdMap.set(name, cat._id);
    }

    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const p of productMap.values()) {
        if (!p.title || p.price <= 0) {
            skipped++;
            continue;
        }

        const catId = categoryIdMap.get(p.type) || categoryIdMap.get('General');
        const srp = p.price;
        const basePrice = p.cost > 0 ? p.cost : Math.round(srp * 0.8);
        const sku = p.sku || `SOV-${p.handle.substring(0, 20).toUpperCase()}`;
        const dimensions = parseDimensions(p.description);
        const weightGrams = parseWeightFromHTML(p.description, p.weightGrams) || 100;

        const productData = {
            title: p.title,
            descriptionHTML: p.description,
            vendor: p.vendor,
            tags: p.tags,
            categoryId: catId,
            images: p.images.sort((a, b) => a.position - b.position),
            dropshipBasePrice: basePrice,
            suggestedRetailPrice: srp,
            tieredPricing: [
                { minQty: 10, maxQty: 49, pricePerUnit: Math.round(basePrice * 0.95) },
                { minQty: 50, maxQty: 99, pricePerUnit: Math.round(basePrice * 0.9) },
                { minQty: 100, pricePerUnit: Math.round(basePrice * 0.85) },
            ],
            weightGrams,
            dimensions,
            hsnCode: '39239090',
            gstSlab: 18,
            shippingDays: '3-5',
            moq: 1,
            inventory: { stock: 500, alertThreshold: 20 },
            status: p.status === 'active' ? 'active' : 'draft',
            returnPolicy: 'NO_RETURNS',
        };

        try {
            const existing = await Product.findOne({ sku });
            if (existing) {
                await Product.updateOne({ sku }, { $set: productData });
                updated++;
            } else {
                await Product.create({ ...productData, sku });
                inserted++;
            }
        } catch (err) {
            skipped++;
            errors.push(`${sku}: ${err.message}`);
        }
    }

    console.log(
        `✅ Import Finished: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { inserted, updated, skipped, errors: errors.slice(0, 10) },
                `Import complete: ${inserted} new products, ${updated} updated, ${skipped} skipped.`
            )
        );
});
