import express from 'express';
import { createRating, getUserRatings } from '../controllers/rating.controller.js';

const router = express.Router();

// Create a rating (review) for an auction
// POST /api/ratings
router.post('/', createRating);

// Get ratings/reviews received by a user (profile page)
// GET /api/ratings/user/:userId
router.get('/user/:userId', getUserRatings);

export default router;

