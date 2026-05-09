import { Router } from 'express';
import { getSyncHistory } from '../controllers/syncHistory.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT, authorizeRoles('ADMIN'));

router.get('/', getSyncHistory);

export default router;
