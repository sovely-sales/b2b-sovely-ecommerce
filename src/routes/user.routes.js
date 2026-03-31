import { Router } from 'express';
import {
    sendSignupOtp,
    sendLoginOtp,
    loginWithOtp,
    getAllUsers,
    updateKycStatus,
    toggleUserStatus,
    updateMyProfile,
    updatePassword,
    updateKycDetails,
    updateUserRole,
    updateAvatar,
} from '../controllers/user.controller.js';
import { uploadImages } from '../middlewares/multer.middleware.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();




router.post('/send-otp', sendSignupOtp);
router.post('/send-login-otp', sendLoginOtp);
router.post('/login-otp', loginWithOtp);




router.get('/admin/all', verifyJWT, authorizeRoles('ADMIN'), getAllUsers);
router.put('/admin/:id/kyc-status', verifyJWT, authorizeRoles('ADMIN'), updateKycStatus);
router.put('/admin/:id/toggle-status', verifyJWT, authorizeRoles('ADMIN'), toggleUserStatus);
router.put('/admin/:id/role', verifyJWT, authorizeRoles('ADMIN'), updateUserRole);




router.post('/avatar', verifyJWT, uploadImages.single('avatar'), updateAvatar);
router.put('/profile', verifyJWT, updateMyProfile);
router.put('/security/password', verifyJWT, updatePassword);
router.put('/kyc-update', verifyJWT, updateKycDetails);

export default router;
