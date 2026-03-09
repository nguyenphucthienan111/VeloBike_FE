import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Chỉ SELLER có KYC VERIFIED mới truy cập được các trang seller (dashboard, inventory, wallet, ...).
 * BUYER hoặc SELLER với KYC PENDING/REJECTED → chuyển đến /seller/kyc.
 */
export const SellerGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role === 'BUYER') return <Navigate to="/seller/kyc" replace />;
    if (user.role === 'SELLER') {
      if (user.kycStatus !== 'VERIFIED') return <Navigate to="/seller/kyc" replace />;
      return <>{children}</>;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/login" replace />;
};
