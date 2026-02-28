import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

/**
 * Layout cho khu vực Admin: sidebar trái cố định, nội dung bên phải đổi theo route (Outlet).
 * Không cần mở trang mới — chỉ phần bên phải thay đổi.
 */
export const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
