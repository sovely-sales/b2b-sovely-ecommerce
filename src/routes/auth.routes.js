import { Router } from 'express';
import {
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    sendOtp,
    loginWithOtp,
    forgotPassword,
    resetPassword,
    getMySessions,
    revokeMySession,
    revokeOtherSessions,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authValidation } from '../validations/auth.validation.js';
import { rateLimit } from 'express-rate-limit';
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

router.post('/login', authLimiter, loginUser);
router.post('/send-otp', authLimiter, sendOtp);
router.post('/login-otp', authLimiter, loginWithOtp);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', forgotPassword);

router.post('/logout', verifyJWT, logoutUser);
router.get('/me', verifyJWT, getCurrentUser);
router.get('/sessions', verifyJWT, getMySessions);
router.delete('/sessions/others', verifyJWT, revokeOtherSessions);
router.delete(
    '/sessions/:sessionId',
    verifyJWT,
    validate(authValidation.revokeSession),
    revokeMySession
);

export default router;
