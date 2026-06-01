import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import AuctionDetailPage from './pages/AuctionDetailPage.jsx';
import CreateAuctionPage from './pages/CreateAuctionPage.jsx';
import MyAuctionsPage from './pages/MyAuctionsPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="auctions/:id" element={<AuctionDetailPage />} />
        <Route path="sell" element={<CreateAuctionPage />} />
        <Route path="my-auctions" element={<MyAuctionsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

