import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import AuctionDetailPage from './pages/AuctionDetailPage.jsx';
import CreateAuctionPage from './pages/CreateAuctionPage.jsx';
import MyAuctionsPage from './pages/MyAuctionsPage.jsx';
import MyBidsPage from './pages/MyBidsPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="auctions/:id" element={<AuctionDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="sell"
          element={
            <ProtectedRoute>
              <CreateAuctionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-auctions"
          element={
            <ProtectedRoute>
              <MyAuctionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-bids"
          element={
            <ProtectedRoute>
              <MyBidsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="wallet"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
