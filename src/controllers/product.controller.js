import { ProductService } from "../services/product.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getProducts = asyncHandler(async (req, res) => {
    const result = await ProductService.getAllProducts(req.query);
    return res.status(200).json(
        new ApiResponse(200, result, "Products fetched successfully")
    );
});

const getProductById = asyncHandler(async (req, res) => {
    const product = await ProductService.getProductById(req.params.productId);
    return res.status(200).json(
        new ApiResponse(200, product, "Product fetched successfully")
    );
});

const getBestDeals = asyncHandler(async (req, res) => {
    const deals = await ProductService.getBestDeals(req.query.limit);
    return res.status(200).json(
        new ApiResponse(200, deals, "Best deals fetched successfully")
    );
});

const getAdminProducts = asyncHandler(async (req, res) => {
    // Pass req.query down to the service so it knows about page, limit, etc.
    const result = await ProductService.getAdminProducts(req.query);
    return res.status(200).json(
        new ApiResponse(200, result, "Admin products fetched")
    );
});

export const updateAdminProduct = asyncHandler(async (req, res) => {
    const updatedProduct = await ProductService.updateProduct(req.params.id, req.body);
    return res.status(200).json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
    );
});

const bulkUploadProducts = asyncHandler(async (req, res) => {
    const totalProcessed = await ProductService.processBulkUpload(req.file);
    return res.status(200).json(
        new ApiResponse(200, { total: totalProcessed }, "Products uploaded successfully")
    );
});

const generateSampleTemplate = asyncHandler(async (req, res) => {
    const headers = "Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Option1 Linked To,Option2 Name,Option2 Value,Option2 Linked To,Option3 Name,Option3 Value,Option3 Linked To,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Unit Price Total Measure,Unit Price Total Measure Unit,Unit Price Base Measure,Unit Price Base Measure Unit,Variant Barcode,Image Src,Image Position,Image Alt Text,Gift Card,SEO Title,SEO Description,Google Shopping / Google Product Category,Google Shopping / Gender,Google Shopping / Age Group,Google Shopping / MPN,Google Shopping / Condition,Google Shopping / Custom Product,Google Shopping / Custom Label 0,Google Shopping / Custom Label 1,Google Shopping / Custom Label 2,Google Shopping / Custom Label 3,Google Shopping / Custom Label 4,Variant Image,Variant Weight Unit,Variant Tax Code,Cost per item,Included / India,Price / India,Compare At Price / India,Status";
    const sampleRow = "\nwhite-waterproof-phone-pouch,\"White Waterproof Phone Pouch Bag\",\"<p>Protect your phone underwater!</p>\",Sovely,Electronics > Communications > Telephony > Mobile Phone Accessories,Mobile Covers,\"Mobile Accessories, monsoon, Waterproof\",TRUE,Title,Default Title,,,,,,,,SHIRT-001,168,shopify,deny,manual,78,234,TRUE,TRUE,,,,,,https://example.com/image1.jpg,1,,FALSE,Shop Waterproof Phone Pouch,\"Protect your phone from water!\",2353,,,,,,,,,,,,g,,,TRUE,,,active";
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample_products_template.csv');
    return res.status(200).send(headers + sampleRow);
});

const createProduct = asyncHandler(async (req, res) => {
    // req.body contains text fields, req.files contains the images
    const newProduct = await ProductService.createProduct(req.body, req.files);
    return res.status(201).json(
        new ApiResponse(201, newProduct, "Product created successfully")
    );
});

export { getProducts, getProductById, getBestDeals, getAdminProducts, bulkUploadProducts, generateSampleTemplate, createProduct };