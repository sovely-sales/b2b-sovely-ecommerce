import { Router } from 'express';
import {
    registerUser,
    sendSignupOtp,
    sendLoginOtp,
    loginWithOtp,
    getAllUsers,
    updateUserRole,
} from '../controllers/user.controller.js';
import { verifyJWT, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/send-otp', sendSignupOtp);
router.post('/send-login-otp', sendLoginOtp);
router.post('/login-otp', loginWithOtp);
router.post('/register', registerUser);

router.get('/admin/all', verifyJWT, authorize('ADMIN'), getAllUsers);
router.put('/admin/:id/role', verifyJWT, authorize('ADMIN'), updateUserRole);

export default router;
