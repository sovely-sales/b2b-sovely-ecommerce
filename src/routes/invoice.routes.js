import { Router } from 'express';
import {
    getInvoice,
    listMyInvoices,
    markAsPaidManual,
    generateInvoicePDF,
} from '../controllers/invoice.controller.js';
import { verifyJWT, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', listMyInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', generateInvoicePDF);

router.put('/:id/manual-payment', authorize('ADMIN'), markAsPaidManual);

export default router;
