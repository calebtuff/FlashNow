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
} from '../controllers/auction.controller.js';

const router = express.Router();

// Route to get all auctions

//get all auctions
router.get("/", getAllAuctions);

// Get auctions for the current seller
router.get("/my/selling", getMySellingAuctions);

// Get bids for the current buyer
router.get("/my/bids", getMyBids);

// For You feed (basic MVP)
router.get("/feed", getFeed);

// Search auctions (basic MVP)
router.get("/search", searchAuctions);

//get auction by id
router.get("/:id", getAuctionById);

//create auction
router.post("/", createAuction);

//update auction
router.put("/:id", updateAuction);

//delete auction
router.delete("/:id", deleteAuction);

export default router;