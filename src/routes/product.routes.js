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
} from '../controllers/product.controller.js';
import { importProductsFromCSV } from '../controllers/productImport.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { productValidation } from '../validations/product.validation.js';


const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();


router.get('/health', (req, res) => res.json({ status: 'ok', route: '/products/health' }));


router.get('/', getProducts);
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
    '/',
    verifyJWT,
    authorizeRoles('ADMIN'),
    validate(productValidation.createProduct),
    createProduct
);


router.get('/:id', getProductById);
router.put('/:id', verifyJWT, authorizeRoles('ADMIN'), updateProduct);
router.delete('/:id', verifyJWT, authorizeRoles('ADMIN'), deleteProduct);

export default router;
