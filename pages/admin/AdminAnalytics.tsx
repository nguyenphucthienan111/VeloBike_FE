import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

interface AnalyticsData {
  period: string;
  orders: number;
  revenue: number;
  newSellers: number;
  reviews: number;
}

export const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState('month');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not logged in');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/analytics?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setAnalytics(data.data ?? null);
      } else {
        setError(data?.message || data?.error || `Failed to load analytics (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(isConnectionError(error) ? CONNECTION_ERROR_MESSAGE : 'Error loading analytics');
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

  return (
    <AdminPageLayout>
      <div className="flex justify-between items-center mb-8">
        <AdminPageHeader title="Phân tích" subtitle="Thống kê theo thời gian" />
        <div className="flex-1 max-w-[200px] ml-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
          >
            <option value="day">24 giờ qua</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
            <option value="year">1 năm qua</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <span>{error}</span>
          <button onClick={() => fetchAnalytics()} className="px-3 py-1.5 text-sm font-medium border border-red-300 rounded-lg hover:bg-red-100">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <AdminLoadingState message="Loading analytics..." />
      ) : analytics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.orders}</p>
            <p className="text-xs text-slate-500 mt-1">In period</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(analytics.revenue)}</p>
            <p className="text-xs text-slate-500 mt-1">Platform fees</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New sellers</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.newSellers}</p>
            <p className="text-xs text-slate-500 mt-1">Registered in period</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviews</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.reviews}</p>
            <p className="text-xs text-slate-500 mt-1">In period</p>
          </div>
        </div>
      ) : null}
    </AdminPageLayout>
  );
};
