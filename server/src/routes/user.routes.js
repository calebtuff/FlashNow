import express from 'express';
import {
  getUserById,
  getCurrentUser,
  updateCurrentUser,
} from '../controllers/user.controller.js';

const router = express.Router();

// Get current user (me)
router.get('/me', getCurrentUser);

// Update current user profile
router.patch('/me', updateCurrentUser);

// Public profile by id
router.get('/:id', getUserById);

export default router;

