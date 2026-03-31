import { Router } from 'express';
import { handleLogisticsWebhook, razorpayWebhook } from '../controllers/webhook.controller.js';

const router = Router();


router.post('/logistics', handleLogisticsWebhook);


router.post('/razorpay', razorpayWebhook);

export default router;
