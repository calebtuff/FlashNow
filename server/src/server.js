import express from 'express';
import auctionRoutes from './routes/auction.routes.js';
import userRoutes from './routes/user.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import ratingRoutes from './routes/rating.routes.js';

const app = express();

app.use(express.json());

// API routes
app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ratings', ratingRoutes);
export default app;