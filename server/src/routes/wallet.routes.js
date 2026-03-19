import express from 'express';
import {
  getWallet,
  getWalletTransactions,
  topupWallet,
  withdrawWallet,
} from '../controllers/wallet.controller.js';

const router = express.Router();

// GET /api/wallet?userId=...
router.get('/', getWallet);

// GET /api/wallet/transactions?userId=...
router.get('/transactions', getWalletTransactions);

// POST /api/wallet/topup { userId, amount }
router.post('/topup', topupWallet);

// POST /api/wallet/withdraw { userId, amount }
router.post('/withdraw', withdrawWallet);

export default router;

