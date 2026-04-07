import { Router } from 'express';
import {
    getDashboardAnalytics,
    getResellerAnalytics,
    getSmartRestockPredictions,
} from '../controllers/analytics.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/dashboard').get(verifyJWT, authorizeRoles('ADMIN'), getDashboardAnalytics);
router.get('/restock-predictions', verifyJWT, getSmartRestockPredictions);

router.route('/reseller').get(verifyJWT, getResellerAnalytics);

export default router;
