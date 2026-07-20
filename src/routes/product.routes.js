import { Router } from 'express';
import multer from 'multer';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getAllAdminProducts,
    validateBulkOrder,
    bulkAdjustPrices,
    getGlobalPriceModifier,
    updateGlobalPriceModifier,
} from '../controllers/product.controller.js';
import {
    importProductsFromCSV,
    syncInventoryFromCSV,
} from '../controllers/productImport.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { productValidation } from '../validations/product.validation.js';
import { uploadImages } from '../middlewares/multer.middleware.js';
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', route: '/products/health' }));

router.get('/', validate(productValidation.getProducts), getProducts);
router.post('/validate-bulk', verifyJWT, validateBulkOrder);

router.get('/admin/all', verifyJWT, authorizeRoles('ADMIN'), getAllAdminProducts);

router.post(
    '/import-csv',
    verifyJWT,
    authorizeRoles('ADMIN'),
    csvUpload.single('csvFile'),
    importProductsFromCSV
);

router.post(
    '/sync-inventory',
    verifyJWT,
    authorizeRoles('ADMIN'),
    csvUpload.single('csvFile'),
    syncInventoryFromCSV
);

router.post(
    '/',
    verifyJWT,
    authorizeRoles('ADMIN'),
    uploadImages.array('images', 8),
    (req, res, next) => {
        try {
            // Only parse objects/arrays. Let Zod handle the Number coercion.
            if (req.body.inventory && typeof req.body.inventory === 'string') {
                req.body.inventory = JSON.parse(req.body.inventory);
            }
            if (req.body.tieredPricing && typeof req.body.tieredPricing === 'string') {
                req.body.tieredPricing = JSON.parse(req.body.tieredPricing);
            }
            next();
        } catch (error) {
            next(error);
        }
    },
    validate(productValidation.createProduct),
    createProduct
);

router.get('/admin/global-modifier', verifyJWT, authorizeRoles('ADMIN'), getGlobalPriceModifier);
router.post(
    '/admin/global-modifier',
    verifyJWT,
    authorizeRoles('ADMIN'),
    updateGlobalPriceModifier
);

router.post(
    '/admin/bulk-adjust-price',
    verifyJWT,
    authorizeRoles('ADMIN'),
    validate(productValidation.bulkAdjustPrice),
    bulkAdjustPrices
);

router.get('/:id', getProductById);
router.put(
    '/:id',
    verifyJWT,
    authorizeRoles('ADMIN'),
    uploadImages.array('images', 8),
    (req, res, next) => {
        try {
            // Only parse objects/arrays. 
            if (req.body.inventory && typeof req.body.inventory === 'string') {
                req.body.inventory = JSON.parse(req.body.inventory);
            }
            if (req.body.tieredPricing && typeof req.body.tieredPricing === 'string') {
                req.body.tieredPricing = JSON.parse(req.body.tieredPricing);
            }
            next();
        } catch (error) {
            next(error);
        }
    },
    updateProduct
);
router.delete('/:id', verifyJWT, authorizeRoles('ADMIN'), deleteProduct);

export default router;
