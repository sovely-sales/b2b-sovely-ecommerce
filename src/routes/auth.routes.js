import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    sendOtp,
    loginWithOtp,
    getMySessions,
    revokeMySession,
    revokeOtherSessions,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authValidation } from '../validations/auth.validation.js';

const router = Router();

router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/send-otp', sendOtp);
router.post('/login-otp', loginWithOtp);
router.post('/register', registerUser);

router.post('/logout', verifyJWT, logoutUser);
router.get('/me', verifyJWT, getCurrentUser);
router.get('/sessions', verifyJWT, getMySessions);
router.delete('/sessions/others', verifyJWT, revokeOtherSessions);
router.delete('/sessions/:sessionId', verifyJWT, validate(authValidation.revokeSession), revokeMySession);

export default router;
