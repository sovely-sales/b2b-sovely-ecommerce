import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validate } from '../middlewares/validate.middleware.js';
import { chatSchema } from '../validations/chat.validation.js';
import { askDropshippingBot } from '../controllers/chat.controller.js';

const router = Router();

// Public endpoint, so keep it tight: each message costs a Gemini call.
const chatLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: 'Too many messages. Please wait a few minutes or message us on WhatsApp.',
    },
});

router.post('/dropshipping', chatLimiter, validate(chatSchema), askDropshippingBot);

export default router;
