import React, { useState } from 'react';

interface AnalyticsData {
  period: string;
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

export const SellerAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const analyticsData: { [key: string]: AnalyticsData[] } = {
    '7d': [
      { period: 'T2', views: 145, sales: 2, revenue: 31000000, conversionRate: 1.38 },
      { period: 'T3', views: 189, sales: 3, revenue: 46500000, conversionRate: 1.59 },
      { period: 'T4', views: 156, sales: 1, revenue: 10800000, conversionRate: 0.64 },
      { period: 'T5', views: 213, sales: 2, revenue: 24600000, conversionRate: 0.94 },
      { period: 'T6', views: 178, sales: 2, revenue: 30600000, conversionRate: 1.12 },
      { period: 'T7', views: 182, sales: 1, revenue: 12300000, conversionRate: 0.55 },
      { period: 'CN', views: 187, sales: 1, revenue: 15500000, conversionRate: 0.53 },
    ],
    '30d': [
      { period: 'Tuần 1', views: 450, sales: 6, revenue: 92100000, conversionRate: 1.33 },
      { period: 'Tuần 2', views: 520, sales: 8, revenue: 115200000, conversionRate: 1.54 },
      { period: 'Tuần 3', views: 480, sales: 5, revenue: 78900000, conversionRate: 1.04 },
      { period: 'Tuần 4', views: 510, sales: 7, revenue: 98700000, conversionRate: 1.37 },
    ],
    '90d': [
      { period: 'Tháng 1', views: 1850, sales: 24, revenue: 356200000, conversionRate: 1.30 },
      { period: 'Tháng 2', views: 1620, sales: 18, revenue: 268500000, conversionRate: 1.11 },
      { period: 'Tháng 3', views: 1950, sales: 22, revenue: 412800000, conversionRate: 1.13 },
    ],
  };

  const currentData = analyticsData[selectedPeriod];
  const maxViews = Math.max(...currentData.map(d => d.views));
  const maxRevenue = Math.max(...currentData.map(d => d.revenue));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const totals = {
    views: currentData.reduce((sum, d) => sum + d.views, 0),
    sales: currentData.reduce((sum, d) => sum + d.sales, 0),
    revenue: currentData.reduce((sum, d) => sum + d.revenue, 0),
    avgConversionRate: (currentData.reduce((sum, d) => sum + d.conversionRate, 0) / currentData.length).toFixed(2),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Phân Tích Bán Hàng</h1>
          <p className="text-gray-600 mt-1">Theo dõi hiệu suất bán hàng của bạn</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === '7d' ? '7 Ngày' : period === '30d' ? '30 Ngày' : '90 Ngày'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tổng Lượt Xem</p>
            <p className="text-3xl font-bold text-gray-900">{totals.views.toLocaleString()}</p>
            <p className="text-green-600 text-sm mt-2">+15% so với kỳ trước</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tổng Đơn Hàng</p>
            <p className="text-3xl font-bold text-gray-900">{totals.sales}</p>
            <p className="text-green-600 text-sm mt-2">+22% so với kỳ trước</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tổng Doanh Thu</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.revenue)}</p>
            <p className="text-green-600 text-sm mt-2">+18% so với kỳ trước</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tỉ Lệ Chuyển Đổi</p>
            <p className="text-3xl font-bold text-gray-900">{totals.avgConversionRate}%</p>
            <p className="text-green-600 text-sm mt-2">Tốt hơn trung bình +3%</p>
          </div>
        </div>

        {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Views Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📊 Lượt Xem
            </h2>
            <div className="space-y-4">
              {currentData.map((data) => (
                <div key={data.period} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{data.period}</span>
                    <span className="text-sm text-gray-600">{data.views}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(data.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              📈 Doanh Thu
            </h2>
            <div className="space-y-4">
              {currentData.map((data) => (
                <div key={data.period} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{data.period}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(data.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Chi Tiết Phân Tích</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kỳ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Lượt Xem</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Đơn Hàng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Doanh Thu</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tỉ Lệ Chuyển Đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentData.map((data, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{data.period}</td>
                    <td className="px-6 py-4 text-gray-600">{data.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{data.sales}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(data.revenue)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {data.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
