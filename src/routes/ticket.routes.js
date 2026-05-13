import { Router } from 'express';
import {
    createTicket,
    getMyTickets,
    getAllTickets,
    resolveTicket,
    editTicket,
    deleteTicket,
    deleteTicketAdmin,
} from '../controllers/ticket.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { uploadImages } from '../middlewares/multer.middleware.js';

const router = Router();

// Protect all ticket routes with JWT
router.use(verifyJWT);

// User routes
router.route('/').post(uploadImages.single('attachment'), createTicket);
router.route('/my-tickets').get(getMyTickets);
router.route('/:id').put(editTicket).delete(deleteTicket);

// Admin routes
router.route('/all').get(authorizeRoles('ADMIN'), getAllTickets);
router.route('/admin/:id').delete(authorizeRoles('ADMIN'), deleteTicketAdmin);
router
    .route('/:id/resolve')
    .put(authorizeRoles('ADMIN'), uploadImages.single('adminAttachment'), resolveTicket);

export default router;
