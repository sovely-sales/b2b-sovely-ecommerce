import { Router } from 'express';
import { sendOtp, loginWithOtp } from '../controllers/auth.controller.js';
import {
    getAllUsers,
    toggleUserStatus,
    updateMyProfile,
    updatePassword,
    processUpdateRequest,
    requestProfileUpdate,
    updateUserRole,
    updateAvatar,
    getSavedCustomers,
    saveCustomerToAddressBook,
    getMyNotifications,
    markNotificationsAsRead,
} from '../controllers/user.controller.js';
import { uploadImages } from '../middlewares/multer.middleware.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { userValidation } from '../validations/user.validation.js';
import { deleteSavedCustomer } from '../controllers/user.controller.js';
import { addBranch, updateBranch, deleteBranch } from '../controllers/user.controller.js';
import { createUser } from '../controllers/user.controller.js';

const router = Router();

router.post('/send-otp', (req, res, next) => {
    req.body.isLogin = false;
    return sendOtp(req, res, next);
});

router.post('/send-login-otp', (req, res, next) => {
    req.body.isLogin = true;
    return sendOtp(req, res, next);
});

router.post('/login-otp', loginWithOtp);

router.get('/admin/all', verifyJWT, authorizeRoles('ADMIN'), getAllUsers);
router.put('/admin/:id/toggle-status', verifyJWT, authorizeRoles('ADMIN'), toggleUserStatus);
router.put('/admin/:id/role', verifyJWT, authorizeRoles('ADMIN'), updateUserRole);
router.post('/admin/create', verifyJWT, authorizeRoles('ADMIN'), createUser);

router.post('/avatar', verifyJWT, uploadImages.single('avatar'), updateAvatar);
router.put('/profile', verifyJWT, validate(userValidation.updateMyProfile), updateMyProfile);
router.put(
    '/security/password',
    verifyJWT,
    validate(userValidation.updatePassword),
    updatePassword
);
router.post('/profile/branches', verifyJWT, addBranch);
router.put('/profile/branches/:branchId', verifyJWT, updateBranch);
router.delete('/profile/branches/:branchId', verifyJWT, deleteBranch);
router.put('/admin/:id/update-request', verifyJWT, authorizeRoles('ADMIN'), processUpdateRequest);
router.put('/profile/request-update', verifyJWT, requestProfileUpdate);

router.get('/saved-customers', verifyJWT, getSavedCustomers);
router.post('/saved-customers', verifyJWT, saveCustomerToAddressBook);
router.route('/saved-customers/:phone').delete(verifyJWT, deleteSavedCustomer);
router.route('/notifications').get(verifyJWT, getMyNotifications);
router.route('/notifications/read').put(verifyJWT, markNotificationsAsRead);

export default router;
