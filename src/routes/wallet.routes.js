import { Router } from 'express';
import {
    getBalance,
    getTransactionHistory,
    createTopUpInvoice,
    requestWithdrawal,
    getAllWithdrawalRequests,
    processWithdrawalRequest,
} from '../controllers/wallet.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/balance', getBalance);
router.get('/transactions', getTransactionHistory);
router.post('/topup', createTopUpInvoice);
router.post('/withdraw', requestWithdrawal);

router.get('/withdrawals', authorizeRoles('ADMIN'), getAllWithdrawalRequests);
router.put('/withdrawals/:id/process', authorizeRoles('ADMIN'), processWithdrawalRequest);

export default router;
