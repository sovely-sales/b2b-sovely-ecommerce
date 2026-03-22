import { Router } from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getAllAdminProducts
} from '../controllers/product.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { productValidation } from '../validations/product.validation.js';

const router = Router();

// --- Public / Reseller Browsing ---
router.get('/', getProducts);
router.get('/:id', getProductById);

// --- Admin Only Routes (Platform Management) ---
router.get('/admin/all', verifyJWT, authorizeRoles('ADMIN'), getAllAdminProducts);

router.post(
    '/',
    verifyJWT,
    authorizeRoles('ADMIN'),
    validate(productValidation.createProduct), // Validation now correctly applied
    createProduct
);

router.put('/:id', verifyJWT, authorizeRoles('ADMIN'), updateProduct);
router.delete('/:id', verifyJWT, authorizeRoles('ADMIN'), deleteProduct);

export default router;