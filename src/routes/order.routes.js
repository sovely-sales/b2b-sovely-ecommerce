import { Router } from 'express';
import { verifyJWT, authorize } from '../middlewares/auth.middleware.js';
import {
    placeOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    getAllOrders,
} from '../controllers/order.controller.js';

const router = Router();

router.use(verifyJWT);

router.post('/', placeOrder);
router.get('/', getMyOrders);

router.get('/admin/all', authorize('ADMIN'), getAllOrders);
router.put('/:id/status', authorize('ADMIN'), updateOrderStatus);

router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

export default router;
