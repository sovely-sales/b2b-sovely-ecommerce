import { Router } from 'express';
import {
    createOrder,
    getMyOrders,
    updateOrderStatus,
    resellerActionOnNDR,
    getOrderById,
    getAllAdminOrders,
    exportAdminOrdersToCsv,
    exportMyOrdersToCsv,
    exportCourierOrdersToCsv,
    createBulkDropshipOrders,
    adminDispatchOrder,
    adminAuthorizeOrder,
    exportUntrackedWukusyOrders,
    importWukusyStatusesCsv,
    deleteOrder,
} from '../controllers/order.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { orderValidation } from '../validations/order.validation.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/all', authorizeRoles('ADMIN'), getAllAdminOrders);
router.get('/export', authorizeRoles('ADMIN'), exportAdminOrdersToCsv);
router.get('/export-me', exportMyOrdersToCsv);
router.get('/export-courier', authorizeRoles('ADMIN'), exportCourierOrdersToCsv);
router.route('/bulk-dropship').post(verifyJWT, createBulkDropshipOrders);
router.put('/:id/status', authorizeRoles('ADMIN'), updateOrderStatus);
router.post('/:id/dispatch', authorizeRoles('ADMIN'), adminDispatchOrder);
router.put('/:id/authorize', authorizeRoles('ADMIN'), adminAuthorizeOrder);
router.delete('/:id', authorizeRoles('ADMIN'), deleteOrder);
router.post('/', createOrder);
router.get('/export-wukusy', authorizeRoles('ADMIN'), exportUntrackedWukusyOrders);
router.post(
    '/import-wukusy',
    authorizeRoles('ADMIN'),
    upload.single('file'),
    importWukusyStatusesCsv
);
router.get('/', validate(orderValidation.getMyOrders), getMyOrders);

router.post('/:id/ndr-action', resellerActionOnNDR);

router.get('/:id', getOrderById);

export default router;
