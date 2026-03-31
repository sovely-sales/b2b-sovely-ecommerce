import fs from 'fs';
import csv from 'csv-parser';
import * as xlsx from 'xlsx';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';

export class ProductService {
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
            const handle = row['Handle'] || row['handle'] || row['SKU'] || row['sku'];
            if (!handle) return;

            if (!productsMap.has(handle)) {
                productsMap.set(handle, {
                    sku: row['Variant SKU'] || row['SKU'] || row['sku'] || handle,
                    title: row['Title'] || row['title'],
                    descriptionHTML: row['Body (HTML)'] || row['bodyHtml'] || row['description'],
                    vendor: row['Vendor'] || row['vendor'] || 'Sovely',
                    productCategory: row['Product Category'] || row['category'],
                    tags: row['Tags'] ? row['Tags'].split(',').map((t) => t.trim()) : [],

                    
                    dropshipBasePrice:
                        parseFloat(row['Base Price'] || row['dropshipBasePrice']) || 0,
                    suggestedRetailPrice:
                        parseFloat(row['MRP'] || row['suggestedRetailPrice']) || 0,
                    weightGrams: parseFloat(row['Weight (g)'] || row['weightGrams']) || 500,
                    hsnCode: row['HSN Code'] || row['hsnCode'] || '0000',
                    gstSlab: parseInt(row['GST Slab'] || row['gstSlab'], 10) || 18,
                    moq: parseInt(row['MOQ'] || row['moq'], 10) || 1,

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
                if (!data.title || data.dropshipBasePrice === 0) continue; 

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

                bulkOperations.push({
                    updateOne: {
                        filter: { sku: data.sku },
                        update: {
                            $set: {
                                sku: data.sku,
                                title: data.title,
                                descriptionHTML: data.descriptionHTML,
                                vendor: data.vendor,
                                tags: data.tags,
                                categoryId: finalCatId,
                                images: data.images,

                                
                                dropshipBasePrice: data.dropshipBasePrice,
                                suggestedRetailPrice: data.suggestedRetailPrice,
                                weightGrams: data.weightGrams,
                                hsnCode: data.hsnCode,
                                gstSlab: data.gstSlab,
                                moq: data.moq,
                                status: data.status,
                                shippingDays: '3-5',
                                deletedAt: null, 
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
