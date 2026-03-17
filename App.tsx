import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SellerLayout } from './components/SellerLayout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { ProductDetail } from './pages/ProductDetail';
import { InspectionService } from './pages/InspectionService';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Cart } from './pages/Cart';
import { Sell } from './pages/Sell';
import { UserProfile } from './pages/UserProfile';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentCancel } from './pages/PaymentCancel';
import { Checkout } from './pages/Checkout';
import { BuyerOrders } from './pages/buyer/BuyerOrders';
import { BuyerWishlist } from './pages/buyer/BuyerWishlist';
import { BuyerProfile } from './pages/buyer/BuyerProfile';
import { Messages } from './pages/Messages';
import { BuyerNotifications } from './pages/buyer/BuyerNotifications';
import { BuyerPaymentHistory } from './pages/buyer/BuyerPaymentHistory';
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
import { SellerKyc } from './pages/seller/SellerKyc';
import { SubscriptionSuccess } from './pages/seller/SubscriptionSuccess';
import { AddProduct } from './pages/seller/AddProduct';
import { EditProduct } from './pages/seller/EditProduct';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminListings } from './pages/admin/AdminListings';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminInspectors } from './pages/admin/AdminInspectors';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminCatalog } from './pages/admin/AdminCatalog';
import { AdminDisputes } from './pages/admin/AdminDisputes';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminWithdrawals } from './pages/admin/AdminWithdrawals';
import { AdminTransactions } from './pages/admin/AdminTransactions';
import { AdminSubscriptions } from './pages/admin/AdminSubscriptions';
import { AdminLayout } from './components/AdminLayout';
import { InspectorDashboard } from './pages/inspector/InspectorDashboard';
import { PendingInspections } from './pages/inspector/PendingInspections';
import { InspectionForm } from './pages/inspector/InspectionForm';
import { MyInspections } from './pages/inspector/MyInspections';
import { InspectionDetail } from './pages/inspector/InspectionDetail';
import { InspectorProfile } from './pages/inspector/InspectorProfile';
import { InspectorWallet } from './pages/inspector/InspectorWallet';
import { InspectorReviews } from './pages/inspector/InspectorReviews';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SellerGate } from './components/SellerGate';
import { BuyerSellerOnlyGate } from './components/BuyerSellerOnlyGate';
import { ScrollToTop } from './components/ScrollToTop';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<BuyerSellerOnlyGate><Home /></BuyerSellerOnlyGate>} />
          <Route path="/marketplace" element={<BuyerSellerOnlyGate><Marketplace /></BuyerSellerOnlyGate>} />
          <Route path="/bike/:id" element={<BuyerSellerOnlyGate><ProductDetail /></BuyerSellerOnlyGate>} />
          <Route path="/product/:id" element={<BuyerSellerOnlyGate><ProductDetail /></BuyerSellerOnlyGate>} />
          <Route path="/checkout/:listingId" element={<BuyerSellerOnlyGate><Checkout /></BuyerSellerOnlyGate>} />
          <Route path="/inspection" element={<BuyerSellerOnlyGate><InspectionService /></BuyerSellerOnlyGate>} />
          <Route path="/messages" element={<BuyerSellerOnlyGate><Messages /></BuyerSellerOnlyGate>} />
          
          {/* Payment Routes */}
          <Route path="/payment/success" element={<BuyerSellerOnlyGate><PaymentSuccess /></BuyerSellerOnlyGate>} />
          <Route path="/payment/cancel" element={<BuyerSellerOnlyGate><PaymentCancel /></BuyerSellerOnlyGate>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cart" element={<BuyerSellerOnlyGate><Cart /></BuyerSellerOnlyGate>} />
          <Route path="/sell" element={<BuyerSellerOnlyGate><Sell /></BuyerSellerOnlyGate>} />
          <Route path="/profile" element={<BuyerSellerOnlyGate><UserProfile /></BuyerSellerOnlyGate>} />
          
          {/* Buyer Routes */}
          <Route path="/buyer/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/buyer/orders" element={
            <ProtectedRoute allowedRoles={['BUYER', 'SELLER']}>
              <BuyerOrders />
            </ProtectedRoute>
          } />
          <Route path="/buyer/wishlist" element={
            <ProtectedRoute allowedRoles={['BUYER', 'SELLER']}>
              <BuyerWishlist />
            </ProtectedRoute>
          } />
          <Route path="/buyer/profile" element={
            <ProtectedRoute allowedRoles={['BUYER', 'SELLER']}>
              <BuyerProfile />
            </ProtectedRoute>
          } />
          <Route path="/buyer/messages" element={<Navigate to="/messages" replace />} />
          <Route path="/buyer/notifications" element={
            <ProtectedRoute allowedRoles={['BUYER', 'SELLER']}>
              <BuyerNotifications />
            </ProtectedRoute>
          } />
          <Route path="/buyer/payment-history" element={
            <ProtectedRoute allowedRoles={['BUYER', 'SELLER']}>
              <BuyerPaymentHistory />
            </ProtectedRoute>
          } />
          
          {/* Seller Routes: KYC full page (không sidebar), còn lại dùng SellerLayout như Admin */}
          <Route path="/seller/kyc" element={
            <ProtectedRoute allowedRoles={['BUYER', 'SELLER']}>
              <SellerKyc />
            </ProtectedRoute>
          } />
          <Route path="/subscription/success" element={
            <ProtectedRoute allowedRoles={['BUYER', 'SELLER']}>
              <SubscriptionSuccess />
            </ProtectedRoute>
          } />
          <Route path="/subscription/cancel" element={<Navigate to="/seller/subscription" replace />} />
          <Route path="/seller" element={
            <ProtectedRoute allowedRoles={['BUYER', 'SELLER']}>
              <SellerGate>
                <SellerLayout />
              </SellerGate>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/seller/dashboard" replace />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="inventory" element={<SellerInventory />} />
            <Route path="add-product" element={<AddProduct />} />
            <Route path="edit-listing/:id" element={<EditProduct />} />
            <Route path="analytics" element={<SellerAnalytics />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="wallet" element={<SellerWallet />} />
            <Route path="messages" element={<SellerMessages />} />
            <Route path="reviews" element={<SellerReviews />} />
            <Route path="profile" element={<SellerProfile />} />
            <Route path="subscription" element={<SellerSubscription />} />
            <Route path="notifications" element={<SellerNotifications />} />
          </Route>
          
          {/* Admin Routes: sidebar cố định trái, nội dung đổi bên phải (không mở trang mới) */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="inspectors" element={<AdminInspectors />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
          
          {/* Inspector Routes */}
          <Route path="/inspector/dashboard" element={
            <ProtectedRoute allowedRoles={['INSPECTOR']}>
              <InspectorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/inspector/pending" element={
            <ProtectedRoute allowedRoles={['INSPECTOR']}>
              <PendingInspections />
            </ProtectedRoute>
          } />
          <Route path="/inspector/inspect/:orderId" element={
            <ProtectedRoute allowedRoles={['INSPECTOR']}>
              <InspectionForm />
            </ProtectedRoute>
          } />
          <Route path="/inspector/history" element={
            <ProtectedRoute allowedRoles={['INSPECTOR']}>
              <MyInspections />
            </ProtectedRoute>
          } />
          <Route path="/inspector/inspection/:orderId" element={
            <ProtectedRoute allowedRoles={['INSPECTOR']}>
              <InspectionDetail />
            </ProtectedRoute>
          } />
          <Route path="/inspector/wallet" element={
            <ProtectedRoute allowedRoles={['INSPECTOR']}>
              <InspectorWallet />
            </ProtectedRoute>
          } />
          <Route path="/inspector/reviews" element={
            <ProtectedRoute allowedRoles={['INSPECTOR']}>
              <InspectorReviews />
            </ProtectedRoute>
          } />
          <Route path="/inspector/profile" element={
            <ProtectedRoute allowedRoles={['INSPECTOR']}>
              <InspectorProfile />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;