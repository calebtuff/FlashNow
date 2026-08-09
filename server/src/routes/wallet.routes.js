import express from 'express';
import {
  getWallet,
  getWalletTransactions,
  topupWallet,
  withdrawWallet,
  createCheckoutSession,
  getTopupSessionStatus,
} from '../controllers/wallet.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getWallet);
router.get('/transactions', getWalletTransactions);
router.get('/checkout-status', getTopupSessionStatus);
router.post('/checkout-session', createCheckoutSession);
router.post('/topup', topupWallet);
router.post('/withdraw', withdrawWallet);

export default router;
