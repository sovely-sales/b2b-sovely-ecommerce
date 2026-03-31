import { Router } from 'express';
import {
    createOrder,
    getMyOrders,
    updateOrderStatus,
    resellerActionOnNDR,
    getOrderById,
    getAllAdminOrders,
    exportAdminOrdersToCsv,
    createBulkDropshipOrders,
} from '../controllers/order.controller.js';
import { verifyJWT, authorizeRoles, requireKycApproved } from '../middlewares/auth.middleware.js';

const router = Router();


router.use(verifyJWT);

// --- Admin Only Routes ---
// Must come BEFORE /:id so Express doesn't think "all" or "export" is an order ID


router.get('/all', authorizeRoles('ADMIN'), getAllAdminOrders);
router.get('/export', authorizeRoles('ADMIN'), exportAdminOrdersToCsv);
router.route('/bulk-dropship').post(verifyJWT, createBulkDropshipOrders);
router.put('/:id/status', authorizeRoles('ADMIN'), updateOrderStatus);



router.post('/', requireKycApproved, createOrder);


router.get('/', getMyOrders);


router.post('/:id/ndr-action', resellerActionOnNDR);


router.get('/:id', getOrderById);

export default router;
