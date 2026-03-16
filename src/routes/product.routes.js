import { Router } from "express";
import { getProducts, getProductById, getBestDeals, getAdminProducts, updateAdminProduct, bulkUploadProducts, generateSampleTemplate, createProduct } from "../controllers/product.controller.js";
import { upload, uploadImages } from "../middlewares/multer.middleware.js";
import { verifyJWT, authorize } from '../middlewares/auth.middleware.js';
import { validate } from "../middlewares/validate.middleware.js";
import { productValidation } from "../validations/product.validation.js";

const router = Router();

// Public Routes
router.get("/deals", getBestDeals);
router.get("/", getProducts);

// 🚨 SECURED ADMIN ROUTES (Must be above dynamic routes) 🚨
// Apply both JWT verification AND Admin role authorization to all /admin routes
router.use('/admin', verifyJWT, authorize('ADMIN'));
router.get("/", validate(productValidation.getProducts), getProducts);
router.get("/:productId", validate(productValidation.getProductById), getProductById);
router.get("/admin/all", getAdminProducts);
router.put("/admin/:id", updateAdminProduct);
router.post("/admin/bulk-upload", upload.single("file"), bulkUploadProducts);
router.get("/admin/template", generateSampleTemplate);

router.post("/admin/create", uploadImages.array("images", 8), createProduct);

// Dynamic Parameter Route (Must be last)
router.get("/:productId", getProductById);

export default router;