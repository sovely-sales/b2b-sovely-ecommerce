import { Router } from 'express';
import {
    getProducts,
    getProductById,
    getBestDeals,
    getAdminProducts,
    updateAdminProduct,
    bulkUploadProducts,
    generateSampleTemplate,
    createProduct,
} from '../controllers/product.controller.js';
import { upload, uploadImages } from '../middlewares/multer.middleware.js';
import { verifyJWT, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { productValidation } from '../validations/product.validation.js';

const router = Router();

router.get('/deals', getBestDeals);
router.get('/', validate(productValidation.getProducts), getProducts);

router.use('/admin', verifyJWT, authorize('ADMIN'));

router.get('/admin/all', getAdminProducts);
router.get('/admin/template', generateSampleTemplate);
router.post('/admin/bulk-upload', upload.single('file'), bulkUploadProducts);
router.post('/admin/create', uploadImages.array('images', 8), createProduct);
router.put('/admin/:id', updateAdminProduct);

router.get('/:productId', validate(productValidation.getProductById), getProductById);

export default router;
