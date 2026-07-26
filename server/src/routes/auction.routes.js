import express from 'express';
import {
  getAllAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  getMySellingAuctions,
  getMyBids,
  getFeed,
  searchAuctions,
  placeBid,
} from '../controllers/auction.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllAuctions);
router.get('/my/selling', requireAuth, getMySellingAuctions);
router.get('/my/bids', requireAuth, getMyBids);
router.get('/feed', getFeed);
router.get('/search', searchAuctions);
router.get('/:id', optionalAuth, getAuctionById);
router.post('/:id/bids', requireAuth, placeBid);
router.post('/', requireAuth, createAuction);
router.put('/:id', updateAuction);
router.delete('/:id', requireAuth, deleteAuction);

export default router;
