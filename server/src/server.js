import express from 'express';
import auctionRoutes from './routes/auction.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(express.json());

// API routes
app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);

export default app;