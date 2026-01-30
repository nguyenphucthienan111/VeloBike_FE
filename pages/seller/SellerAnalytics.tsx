import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SellerSidebar } from '../../components/SellerSidebar';

interface PerformanceData {
  date: string;
  orders: number;
  revenue: number;
}

interface PerformanceMetrics {
  totalRevenue: number;
  totalOrders: number;
}

export const SellerAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch performance analytics
      const perfRes = await fetch(`http://localhost:5000/api/analytics/seller/performance?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (perfRes.ok) {
        const data = await perfRes.json();
        const perfData = data.data?.performanceData || [];
        
        // Calculate totals from performance data
        const totalRevenue = perfData.reduce((sum: number, item: PerformanceData) => sum + (item.revenue || 0), 0);
        const totalOrders = perfData.reduce((sum: number, item: PerformanceData) => sum + (item.orders || 0), 0);

        setMetrics({
          totalRevenue,
          totalOrders,
        });

        setPerformanceData(perfData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
              <p className="text-gray-600 mt-1">Track your sales performance and metrics</p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('7d')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === '7d'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === '30d'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setPeriod('90d')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === '90d'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Total Revenue */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </p>
                </div>

                {/* Total Orders */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-gray-600 text-sm mb-2">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.totalOrders || 0}
                  </p>
                </div>
              </div>

              {/* Performance Timeline */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Performance</h2>
                {performanceData && performanceData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-bold text-gray-900">Date</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900">Revenue</th>
                          <th className="text-left py-3 px-4 font-bold text-gray-900">Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceData.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-700">{item.date}</td>
                            <td className="py-3 px-4 text-gray-900 font-medium">{formatCurrency(item.revenue)}</td>
                            <td className="py-3 px-4 text-gray-700">{item.orders}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No data available for this period</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
