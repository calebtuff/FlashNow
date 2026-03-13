import express from 'express';
import { getAllAuctions, getAuctionById, createAuction, updateAuction, deleteAuction } from '../controllers/auction.controller.js';

const router = express.Router();

// Route to get all auctions

//get all auctions
router.get("/", getAllAuctions);

//get auction by id
router.get("/:id", getAuctionById);

//create auction
router.post("/", createAuction);

//update auction
router.put("/:id", updateAuction);

//delete auction
router.delete("/:id", deleteAuction);