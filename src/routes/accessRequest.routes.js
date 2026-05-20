import { Router } from 'express';
import {
    createAccessRequest,
    getAccessRequests,
    updateAccessRequestStatus,
} from '../controllers/accessRequest.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', createAccessRequest);

router.get('/', verifyJWT, authorizeRoles('ADMIN'), getAccessRequests);

router.put('/:id/status', verifyJWT, authorizeRoles('ADMIN'), updateAccessRequestStatus);

export default router;
