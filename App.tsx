import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { ProductDetail } from './pages/ProductDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Cart } from './pages/Cart';
import { Sell } from './pages/Sell';
import { UserProfile } from './pages/UserProfile';
import { BuyerDashboard } from './pages/buyer/BuyerDashboard';
import { BuyerOrders } from './pages/buyer/BuyerOrders';
import { BuyerWishlist } from './pages/buyer/BuyerWishlist';
import { BuyerProfile } from './pages/buyer/BuyerProfile';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { SellerInventory } from './pages/seller/SellerInventory';
import { SellerAnalytics } from './pages/seller/SellerAnalytics';
import { SellerOrders } from './pages/seller/SellerOrders';
import { SellerWallet } from './pages/seller/SellerWallet';
import { SellerMessages } from './pages/seller/SellerMessages';
import { SellerReviews } from './pages/seller/SellerReviews';
import { SellerProfile } from './pages/seller/SellerProfile';
import { SellerSubscription } from './pages/seller/SellerSubscription';
import { SellerNotifications } from './pages/seller/SellerNotifications';
import { AddProduct } from './pages/seller/AddProduct';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/bike/:id" element={<ProductDetail />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/profile" element={<UserProfile />} />
          
          {/* Buyer Routes */}
          <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
          <Route path="/buyer/orders" element={<BuyerOrders />} />
          <Route path="/buyer/wishlist" element={<BuyerWishlist />} />
          <Route path="/buyer/profile" element={<BuyerProfile />} />
          
          {/* Seller Routes */}
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/inventory" element={<SellerInventory />} />
          <Route path="/seller/add-product" element={<AddProduct />} />
          <Route path="/seller/analytics" element={<SellerAnalytics />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/wallet" element={<SellerWallet />} />
          <Route path="/seller/messages" element={<SellerMessages />} />
          <Route path="/seller/reviews" element={<SellerReviews />} />
          <Route path="/seller/profile" element={<SellerProfile />} />
          <Route path="/seller/subscription" element={<SellerSubscription />} />
          <Route path="/seller/notifications" element={<SellerNotifications />} />
          
          <Route path="/inspection" element={<div className="p-20 text-center font-bold">Inspector Dashboard Coming Soon (Mobile Phase)</div>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;