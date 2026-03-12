import { Router } from "express";
import { getProducts, getProductById, getBestDeals, getAdminProducts, updateAdminProduct, bulkUploadProducts, generateSampleTemplate } from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/deals", getBestDeals);
router.get("/", getProducts);

// Admin Routes MUST go above /:productId, otherwise Express gets confused!
router.get("/admin/all", getAdminProducts);
router.put("/admin/:id", updateAdminProduct);
router.post("/admin/bulk-upload", upload.single("file"), bulkUploadProducts);
router.get("/admin/template", generateSampleTemplate);

router.get("/:productId", getProductById);

export default router;