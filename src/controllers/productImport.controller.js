import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logSync } from '../utils/syncLogger.js';

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

const KNOWN_BRANDS = [
  'Eyelet',
  'Bellavita',
  'Liger',
  'Badz',
  'Apex',
  'OG Beauty',
  'Chocotown',
  'Home Chef',
  'Konvex',
  'Oracle',
  'Ved Sanjeevani',
  'Supermom',
  'Maniarrs',
  "In' Lief",
  'Funwood',
  'Orbit',
  'Wagtail',
  'IKI',
  'Zequz',
  'Ganesh',
  'Ritu',
  'Nekza',
  'Konex',
  'Freshee',
  'Aditi',
  'Live Touch',
  'Beautiful Basics',
  'Camel',
  'Kangaro',
  'Electro Play',
  'Lapcare',
  'Pro Clean',
  'Vegnar',
  'Truzo',
  'Sameo',
  'Signature',
  'Next',
  'Pexpo',
  'Prexo',
];

const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// ─── 1. CATALOG IMPORT (Products, Pricing, Images) ───────────────────────────

export const importProductsFromCSV = asyncHandler(async (req, res) => {
  console.log('🚀 [BULK] CSV Catalog Import Started');
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
          // Extract exact numbers from the CSV
          const variantPrice = toNum(row['Variant Price']);
          const costPerItem = toNum(row['Cost per item']);

          const baseCost = costPerItem > 0 ? costPerItem : Math.round(variantPrice * 0.6);

          productMap.set(handle, {
            handle,
            title: (row['Title'] || '').trim(),
            description: row['Body (HTML)'] || '',
            vendor: (row['Vendor'] || '').trim() || 'Your Brand',
            type: (row['Type'] || '').trim() || 'General',
            tags: parseTags(row['Tags']),
            sku: (row['Variant SKU'] || '').trim(),
            weightGrams: toNum(row['Variant Grams']) || 100,
            cost: baseCost,
            srp: variantPrice > 0 ? variantPrice : baseCost,
            status: (row['Status'] || 'active').toLowerCase(),
            hsnCode: (row['HSN Code'] || row['HSN'] || row['hsn'] || '').trim(),
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

  let skipped = 0;
  const bulkOps = [];

  for (const p of productMap.values()) {
    if (!p.title || p.cost <= 0) {
      skipped++;
      continue;
    }

    const searchString = normalizeString(`${p.sku} ${p.title}`);
    let finalBrand = 'Your Brand';

    for (const brand of KNOWN_BRANDS) {
      if (searchString.includes(normalizeString(brand))) {
        finalBrand = brand;
        break;
      }
    }

    const catId = categoryIdMap.get(p.type) || categoryIdMap.get('General');

    const basePrice = p.cost;
    const srp = p.srp;
    const estimatedMarginPercent = 0;

    const sku = p.sku || `SOV-${p.handle.substring(0, 20).toUpperCase()}`;
    const dimensions = parseDimensions(p.description);
    const weightGrams = parseWeightFromHTML(p.description, p.weightGrams) || 100;

    const productData = {
      sku,
      title: p.title,
      descriptionHTML: p.description,
      vendor: finalBrand,
      tags: p.tags,
      categoryId: catId,
      images: p.images.sort((a, b) => a.position - b.position),
      dropshipBasePrice: basePrice,
      suggestedRetailPrice: srp,
      estimatedMarginPercent,
      tieredPricing: [],
      weightGrams,
      dimensions,
      hsnCode: p.hsnCode || '39239090',
      gstSlab: 18,
      shippingDays: '3-5',
      moq: 1,
      inventory: { stock: 0, alertThreshold: 10 },
      status: p.status === 'active' ? 'active' : 'draft',
      returnPolicy: 'NO_RETURNS',
    };

    bulkOps.push({
      updateOne: {
        filter: { sku },
        update: { $set: productData },
        upsert: true,
      },
    });
  }

  let inserted = 0;
  let updated = 0;
  const errors = [];

  try {
    if (bulkOps.length > 0) {
      const result = await Product.bulkWrite(bulkOps);
      inserted = result.upsertedCount || 0;
      updated = result.modifiedCount || 0;
    }
  } catch (err) {
    errors.push(`Bulk write error: ${err.message}`);
  }

  console.log(
    `✅ Import Finished: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`
  );

  await logSync({
    adminId: req.user._id,
    type: 'IMPORT',
    purpose: 'Product Catalog Import',
    filename: req.file.originalname,
    fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
    status: errors.length > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
    details: { inserted, updated, skipped, errors: errors.slice(0, 10) },
  });

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
export const syncInventoryFromCSV = asyncHandler(async (req, res) => {
  console.log('📦 [BULK] Inventory & HSN Sync Started');
  if (!req.file) {
    throw new ApiError(400, 'No CSV file uploaded.');
  }

  const inventoryUpdates = new Map();

  await new Promise((resolve, reject) => {
    const readable = Readable.from(req.file.buffer.toString('utf8'));
    readable
      .pipe(csvParser())
      .on('data', (row) => {
        const sku = (row['SKU'] || '').trim();
        if (!sku) return;

        let stockStr = row['On hand (new)'] || row['On hand (current)'];
        let stock = parseInt(stockStr, 10);

        // NEW: Grab the HSN code if it exists in the row
        let hsnCode = (row['HSN Code'] || row['HSN'] || row['hsn'] || '').trim();

        // Proceed if there is either a valid stock number OR an HSN code
        if (!isNaN(stock) || hsnCode) {
          inventoryUpdates.set(sku, {
            stock: !isNaN(stock) ? stock : null,
            hsnCode: hsnCode || null
          });
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  if (inventoryUpdates.size === 0) {
    throw new ApiError(400, 'No valid SKUs, stock numbers, or HSN codes found in the CSV.');
  }

  const skusFromCsv = Array.from(inventoryUpdates.keys());
  const existingProducts = await Product.find({ sku: { $in: skusFromCsv } }, { sku: 1 }).lean();
  const existingSkus = new Set(existingProducts.map((p) => p.sku));

  let notFound = 0;
  const errors = [];
  const bulkOps = [];

  for (const [sku, updates] of inventoryUpdates.entries()) {
    if (existingSkus.has(sku)) {
      const updateFields = {};

      // Build the update query dynamically based on what was in the CSV
      if (updates.stock !== null) updateFields['inventory.stock'] = updates.stock;
      if (updates.hsnCode !== null) updateFields['hsnCode'] = updates.hsnCode;

      if (Object.keys(updateFields).length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { sku },
            update: { $set: updateFields },
          },
        });
      }
    } else {
      notFound++;
      errors.push(`SKU ${sku} not found in database.`);
    }
  }

  let updated = 0;
  try {
    if (bulkOps.length > 0) {
      const result = await Product.bulkWrite(bulkOps);
      updated = result.modifiedCount || 0;
    }
  } catch (err) {
    errors.push(`Bulk write error: ${err.message}`);
  }

  console.log(`✅ Inventory/HSN Sync Finished: ${updated} updated, ${notFound} SKUs not found.`);

  await logSync({
    adminId: req.user._id,
    type: 'SYNC',
    purpose: 'Inventory and HSN Bulk Sync',
    filename: req.file.originalname,
    fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
    status: errors.length > 0 ? (updated > 0 ? 'PARTIAL_SUCCESS' : 'FAILURE') : 'SUCCESS',
    details: { updated, notFound, errors: errors.slice(0, 10) },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updated, notFound, errors: errors.slice(0, 10) },
        `Inventory Sync complete: ${updated} products updated.`
      )
    );
});
