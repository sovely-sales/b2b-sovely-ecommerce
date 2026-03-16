import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/analytics.controller.js";
import { verifyJWT, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Secure this heavily. Only admins get to see the telemetry.
router.use(verifyJWT, authorize('ADMIN'));

router.get("/admin", getDashboardAnalytics);

export default router;