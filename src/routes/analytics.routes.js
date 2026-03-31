import { Router } from 'express';
import {
    getDashboardAnalytics,
    getResellerAnalytics, 
} from '../controllers/analytics.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();


router.route('/dashboard').get(verifyJWT, authorizeRoles('ADMIN'), getDashboardAnalytics);



router.route('/reseller').get(verifyJWT, getResellerAnalytics);

export default router;
