import express from 'express';
import { syncUser } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/sync', requireAuth, syncUser);

export default router;
