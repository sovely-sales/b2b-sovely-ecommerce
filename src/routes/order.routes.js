import { Router } from 'express';
import {
    createOrder,
    getMyOrders,
    updateOrderStatus,
    resellerActionOnNDR,
    getOrderById,
    getAllAdminOrders,
    createBulkDropshipOrders,
} from '../controllers/order.controller.js';
import { verifyJWT, authorizeRoles, requireKycApproved } from '../middlewares/auth.middleware.js';

const router = Router();


router.use(verifyJWT);



router.get('/all', authorizeRoles('ADMIN'), getAllAdminOrders);
router.route('/bulk-dropship').post(verifyJWT, createBulkDropshipOrders);
router.put('/:id/status', authorizeRoles('ADMIN'), updateOrderStatus);



router.post('/', requireKycApproved, createOrder);


router.get('/', getMyOrders);


router.post('/:id/ndr-action', resellerActionOnNDR);


router.get('/:id', getOrderById);

export default router;
