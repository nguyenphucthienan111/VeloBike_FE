import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalListings: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface TopListing {
  id: string;
  name: string;
  views: number;
  sales: number;
  revenue: number;
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
}

export const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 24,
    totalViews: 1250,
    totalSales: 12,
    totalRevenue: 45200000,
    averageOrderValue: 3766667,
    conversionRate: 3.2,
  });

  const [topListings, setTopListings] = useState<TopListing[]>([
    { id: '1', name: 'Trek X-Caliber', views: 245, sales: 3, revenue: 46500000 },
    { id: '2', name: 'Giant Talon', views: 189, sales: 2, revenue: 24600000 },
    { id: '3', name: 'Specialized Rockhopper', views: 156, sales: 1, revenue: 10800000 },
  ]);

  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([
    { id: '1', type: 'Sale', amount: 15500000, date: '28/01/2026', status: 'Completed' },
    { id: '2', type: 'Withdrawal', amount: 5000000, date: '26/01/2026', status: 'Pending' },
    { id: '3', type: 'Sale', amount: 12300000, date: '25/01/2026', status: 'Completed' },
  ]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    // Simulate API call
    setTimeout(() => setLoading(false), 500);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bảng Điều Khiển Bán Hàng
              </h1>
              <p className="mt-2 text-gray-600">
                Chào mừng, {user?.fullName || 'Bán hàng viên'}!
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Cập nhật lần cuối: Hôm nay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Listings */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm font-medium">Tổng Sản Phẩm</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalListings}</p>
            <p className="text-green-600 text-sm mt-2">+3 tuần này</p>
          </div>

          {/* Total Views */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm font-medium">Tổng Lượt Xem</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalViews.toLocaleString()}</p>
            <p className="text-green-600 text-sm mt-2">+15% tuần này</p>
          </div>

          {/* Total Sales */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm font-medium">Tổng Bán</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSales}</p>
            <p className="text-green-600 text-sm mt-2">+5 tuần này</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm font-medium">Doanh Thu</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-green-600 text-sm mt-2">+12% tuần này</p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm font-medium">Tỉ Lệ Chuyển Đổi</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.conversionRate}%</p>
            <p className="text-green-600 text-sm mt-2">Tốt hơn so với trung bình</p>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <p className="text-gray-500 text-sm font-medium">Giá Trị Đơn Trung Bình</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.averageOrderValue)}</p>
            <p className="text-green-600 text-sm mt-2">+8% từ tháng trước</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hành Động Nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/seller/inventory')}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Quản Lý Kho
            </button>
            <button
              onClick={() => navigate('/seller/analytics')}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Xem Phân Tích
            </button>
            <button
              onClick={() => navigate('/seller/orders')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Đơn Hàng Mới
            </button>
            <button
              onClick={() => navigate('/seller/messages')}
              className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Tin Nhắn
            </button>
          </div>
        </div>

        {/* Top Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Listings Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Sản Phẩm</h2>
            <div className="space-y-4">
              {topListings.map((listing, idx) => (
                <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{listing.name}</p>
                      <p className="text-xs text-gray-500">{listing.views} lượt xem</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(listing.revenue)}</p>
                    <p className="text-xs text-green-600">{listing.sales} đơn</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/seller/inventory')}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Xem Tất Cả →
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Giao Dịch Gần Đây</h2>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold text-white ${
                      tx.type === 'Sale' ? 'bg-green-500' : 'bg-orange-500'
                    }`}>
                      {tx.type === 'Sale' ? 'S' : 'W'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.type}</p>
                      <p className="text-xs text-gray-500">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(tx.amount)}</p>
                    <p className={`text-xs font-medium ${tx.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/seller/wallet')}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Xem Ví →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
