import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  totalOrders: number;
  totalRevenue: number;
  openDisputes: number;
}

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        setError('Failed to load dashboard');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError(isConnectionError(error) ? CONNECTION_ERROR_MESSAGE : 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminPageLayout>
        <AdminLoadingState message="Đang tải dashboard..." />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Dashboard" subtitle="Tổng quan thống kê và thao tác nhanh" />
      {error && <AdminErrorBanner message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tin đăng</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalListings || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng đơn hàng</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh thu</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : '0 ₫'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tranh chấp mở</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.openDisputes || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <h2 className="text-lg font-semibold text-slate-900">Thao tác nhanh</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="#/admin/listings?status=PENDING_APPROVAL" className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <p className="font-semibold text-slate-900">Duyệt tin đăng</p>
              <p className="text-sm text-slate-500 mt-1">Phê duyệt hoặc từ chối tin</p>
            </a>
            <a href="#/admin/users?role=SELLER&status=active" className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <p className="font-semibold text-slate-900">Quản lý seller</p>
              <p className="text-sm text-slate-500 mt-1">Xem và quản lý tài khoản seller</p>
            </a>
            <a href="#/admin/orders?status=DELIVERED" className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <p className="font-semibold text-slate-900">Giải phóng thanh toán</p>
              <p className="text-sm text-slate-500 mt-1">Xử lý thanh toán cho seller</p>
            </a>
            <a href="#/admin/reports?status=PENDING" className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <p className="font-semibold text-slate-900">Xử lý báo cáo</p>
              <p className="text-sm text-slate-500 mt-1">Xem và xử lý báo cáo từ users</p>
            </a>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};
