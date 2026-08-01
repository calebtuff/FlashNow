import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
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
    <div className="flex min-h-screen flex-col">
      <NotificationSocketBridge />
      <LiveAuctionSocketBridge />
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
