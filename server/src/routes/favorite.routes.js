import express from 'express';
import {
  addFavorite,
  getFavoriteIds,
  listFavorites,
  removeFavorite,
} from '../controllers/favorite.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/ids', requireAuth, getFavoriteIds);
router.get('/', requireAuth, listFavorites);
router.post('/:auctionId', requireAuth, addFavorite);
router.delete('/:auctionId', requireAuth, removeFavorite);

export default router;
