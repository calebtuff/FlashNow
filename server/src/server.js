import cors from 'cors';
import express from 'express';
import stripeRoutes from './routes/stripe.routes.js';
import auctionRoutes from './routes/auction.routes.js';
import userRoutes from './routes/user.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import ratingRoutes from './routes/rating.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Stripe webhooks require the raw request body for signature verification.
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeRoutes);

app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/favorites', favoriteRoutes);
export default app;