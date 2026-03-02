import React from 'react';
import { Outlet } from 'react-router-dom';
import { SellerSidebar } from './SellerSidebar';

/**
 * Layout cho khu vực Seller: sidebar trái cố định (không đổi khi chuyển trang),
 * nội dung bên phải đổi theo route (Outlet) — giống Admin.
 */
export const SellerLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SellerSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
