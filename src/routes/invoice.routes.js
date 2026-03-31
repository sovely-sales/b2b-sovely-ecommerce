import { Router } from 'express';
import {
    getInvoice,
    listMyInvoices,
    markAsPaidManual,
    generateInvoicePDF,
    getAllInvoices,
    getMyInvoices,
} from '../controllers/invoice.controller.js';

import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();


router.use(verifyJWT);




router.get('/admin/all', authorizeRoles('ADMIN'), getAllInvoices);




router.get('/', listMyInvoices);
router.route('/me').get(verifyJWT, getMyInvoices);




router.get('/:id', getInvoice);
router.get('/:id/pdf', generateInvoicePDF);

router.put('/:id/manual-payment', authorizeRoles('ADMIN'), markAsPaidManual);

router.get('/order/:orderId/pdf', generateInvoicePDF);

export default router;
