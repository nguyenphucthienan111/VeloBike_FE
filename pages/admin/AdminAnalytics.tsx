import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';

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
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/admin/analytics?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        setError('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Error loading analytics');
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
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Orders</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.orders}</p>
                <p className="text-xs text-gray-500 mt-2">In {period}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.revenue)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Platform fees</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">New Sellers</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.newSellers}</p>
                <p className="text-xs text-gray-500 mt-2">Registered in {period}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-2">Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.reviews}</p>
                <p className="text-xs text-gray-500 mt-2">In {period}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
