import express from 'express';
import {
  getUserById,
  getUserAuctions,
  getCurrentUser,
  updateCurrentUser,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, getCurrentUser);
router.patch('/me', requireAuth, updateCurrentUser);
router.get('/:id/auctions', getUserAuctions);
router.get('/:id', getUserById);

export default router;
