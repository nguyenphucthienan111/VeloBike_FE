import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Chặn Admin và Inspector truy cập giao diện Buyer/Seller.
 * Admin → /admin/dashboard
 * Inspector → /inspector/dashboard
 * BUYER, SELLER, chưa đăng nhập → hiển thị children
 */
export const BuyerSellerOnlyGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <>{children}</>;

  try {
    const user = JSON.parse(userStr);
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'INSPECTOR') return <Navigate to="/inspector/dashboard" replace />;
  } catch {
    return <>{children}</>;
  }

  return <>{children}</>;
};
