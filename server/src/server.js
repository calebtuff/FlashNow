import express from 'express';
import auctionRoutes from './routes/auction.routes.js';

const app = express();


// Mount the routes to the files
app.use("/auctions", auctionRoutes);

export default app;