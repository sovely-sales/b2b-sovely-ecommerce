import { Router } from 'express';
import {
    handleLogisticsWebhook,
    handleQikinkWebhook,
    razorpayWebhook,
} from '../controllers/webhook.controller.js';

const router = Router();

router.post('/logistics', handleLogisticsWebhook);

router.post('/razorpay', razorpayWebhook);

router.post('/qikink', handleQikinkWebhook);

export default router;
