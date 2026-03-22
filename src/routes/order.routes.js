import { Router } from 'express';
import {
    createOrder,
    getMyOrders,
    updateOrderStatus,
    resellerActionOnNDR,
    getOrderById,
    getAllAdminOrders,
} from '../controllers/order.controller.js';
import { verifyJWT, authorizeRoles, requireKycApproved } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply JWT verification to ALL order routes
router.use(verifyJWT);

// --- Admin Only Routes ---
// Must come BEFORE /:id so Express doesn't think "all" is an order ID
router.get('/all', authorizeRoles('ADMIN'), getAllAdminOrders);
router.put('/:id/status', authorizeRoles('ADMIN'), updateOrderStatus);

// --- Reseller / User Routes ---
// Reseller placing an order (Requires Approved KYC)
router.post('/', requireKycApproved, createOrder);

// Reseller viewing their order history
router.get('/', getMyOrders);

// Reseller taking action on an NDR (Non-Delivery Report)
router.post('/:id/ndr-action', resellerActionOnNDR);

// Fetch specific order details
router.get('/:id', getOrderById);

export default router;