import { Router } from 'express';
import { verifyPaymentSignature, createRazorpayOrder } from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/create-order', createRazorpayOrder);

router.post('/verify', verifyPaymentSignature);

export default router;
