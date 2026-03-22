import { Router } from 'express';
import {
    sendSignupOtp,
    sendLoginOtp,
    loginWithOtp,
    getAllUsers,
    updateKycStatus,
    toggleUserStatus,
    updateMyProfile,
    updatePassword // <-- NEW Import
} from '../controllers/user.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// ==========================================
// PUBLIC AUTHENTICATION ROUTES
// ==========================================
router.post('/send-otp', sendSignupOtp);
router.post('/send-login-otp', sendLoginOtp);
router.post('/login-otp', loginWithOtp);

// ==========================================
// ADMIN ROUTES
// ==========================================
router.get('/admin/all', verifyJWT, authorizeRoles('ADMIN'), getAllUsers);
router.put('/admin/:id/kyc-status', verifyJWT, authorizeRoles('ADMIN'), updateKycStatus);
router.put('/admin/:id/toggle-status', verifyJWT, authorizeRoles('ADMIN'), toggleUserStatus);

// ==========================================
// LOGGED-IN USER (RESELLER) ROUTES
// ==========================================
router.put('/profile', verifyJWT, updateMyProfile);
router.put('/security/password', verifyJWT, updatePassword); // <-- NEW Route

export default router;