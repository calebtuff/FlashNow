import 'dotenv/config';

import cron from 'node-cron';
import app from './server.js';
import { runAuctionLifecycleTick } from './services/auctionEngine.js';

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);

  // Promote scheduled auctions and settle expired ones every minute.
  cron.schedule('* * * * *', () => {
    runAuctionLifecycleTick().catch((err) => {
      console.error('auction lifecycle tick failed:', err);
    });
  });

  // Run once on startup so restarts don't wait a full minute.
  runAuctionLifecycleTick().catch((err) => {
    console.error('auction lifecycle startup tick failed:', err);
  });
});
