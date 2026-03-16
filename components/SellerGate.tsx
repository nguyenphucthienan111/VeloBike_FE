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
      // Chấp nhận cả VERIFIED và APPROVED (đề phòng BE trả về khác nhau)
      if (user.kycStatus === 'VERIFIED' || user.kycStatus === 'APPROVED') {
        return <>{children}</>;
      }
      // Nếu PENDING, REJECTED hoặc null -> chặn
      return <Navigate to="/seller/kyc" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/login" replace />;
};
