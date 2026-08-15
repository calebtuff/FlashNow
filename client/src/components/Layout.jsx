import { Outlet } from 'react-router-dom';
import Bezel from './Bezel.jsx';
import BottomNav from './BottomNav.jsx';
import CategoryRail from './CategoryRail.jsx';
import Footer from './Footer.jsx';
import useNotificationSocket from '../hooks/useNotificationSocket.js';
import useLiveAuctionSync from '../hooks/useLiveAuctionSync.js';

function NotificationSocketBridge() {
  useNotificationSocket();
  return null;
}

function LiveAuctionSocketBridge() {
  useLiveAuctionSync();
  return null;
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-dial">
      <NotificationSocketBridge />
      <LiveAuctionSocketBridge />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-t4 focus:top-t4 focus:z-50 focus:bg-lume focus:px-4 focus:py-2 focus:text-body focus:font-bold focus:text-dial"
      >
        Skip to content
      </a>

      <Bezel />
      <CategoryRail />

      {/* `main-pad` clears the fixed bottom navigation on small screens so the
          last register is never trapped underneath it, and relaxes at md
          where that bar no longer exists. */}
      <main id="main" className="main-pad mx-auto w-full max-w-[1600px] flex-1 px-t4 pt-t6">
        <Outlet />
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
