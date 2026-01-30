import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SellerSidebar } from '../../components/SellerSidebar';

interface PerformanceData {
  date: string;
  orders: number;
  revenue: number;
}

interface TopListing {
  id: string;
  title: string;
  views: number;
  status: string;
  price: number;
}

interface ListingMetrics {
  id: string;
  title: string;
  views: number;
  inquiries: number;
  sales: number;
  conversionRate: number;
  salesRate: number;
}

interface DashboardOverview {
  totalListings: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
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
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [topListings, setTopListings] = useState<TopListing[]>([]);
  const [listingMetrics, setListingMetrics] = useState<ListingMetrics[]>([]);

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

      // Fetch dashboard overview
      const dashRes = await fetch('http://localhost:5000/api/analytics/seller/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (dashRes.ok) {
        const data = await dashRes.json();
        setOverview(data.data?.overview);
        setTopListings(data.data?.topListings || []);

        // Fetch detailed analytics for each top listing
        const listings = data.data?.topListings || [];
        const metricsPromises = listings.map((listing: TopListing) =>
          fetch(`http://localhost:5000/api/analytics/listing/${listing.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => ({
              id: listing.id,
              title: listing.title,
              views: data.data?.metrics?.views || 0,
              inquiries: data.data?.metrics?.inquiries || 0,
              sales: data.data?.metrics?.sales || 0,
              conversionRate: data.data?.metrics?.conversionRate || 0,
              salesRate: data.data?.metrics?.salesRate || 0,
            }))
            .catch(err => {
              console.error('Error fetching listing analytics:', err);
              return {
                id: listing.id,
                title: listing.title,
                views: 0,
                inquiries: 0,
                sales: 0,
                conversionRate: 0,
                salesRate: 0,
              };
            })
        );

        const metricsData = await Promise.all(metricsPromises);
        setListingMetrics(metricsData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <SellerSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
              <p className="text-sm text-gray-600 mt-1">Track your sales performance and metrics</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Period Selector */}
              <div className="flex gap-2 bg-white rounded-lg shadow-sm p-1">
                <button
                  onClick={() => setPeriod('7d')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    period === '7d'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setPeriod('30d')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    period === '30d'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setPeriod('90d')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    period === '90d'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  90 Days
                </button>
              </div>

              {/* Profile Section */}
              <button 
                onClick={() => navigate('/seller/profile')}
                className="flex items-center gap-3 pl-4 border-l border-gray-300 hover:opacity-80 transition-opacity"
              >
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-gray-500">SELLER</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center font-bold text-white text-sm">
                  {user?.fullName?.charAt(0) || 'S'}
                </div>
              </button>
            </div>
          </div>

          {/* Overview Stats - From Dashboard API */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 text-xs font-semibold">TOTAL VIEWS</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{(overview?.totalViews || 0).toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 text-xs font-semibold">TOTAL SALES</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{overview?.totalSales || 0}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 text-xs font-semibold">TOTAL REVENUE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(overview?.totalRevenue || 0)}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 text-xs font-semibold">CONVERSION RATE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{(overview?.conversionRate || 0).toFixed(2)}%</p>
            </div>
          </div>

          {/* Period Performance & Best Products */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Period Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Performance ({period})</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Revenue</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.totalRevenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Orders</span>
                  <span className="text-2xl font-bold text-gray-900">{metrics?.totalOrders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Order Value</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {metrics?.totalOrders ? formatCurrency((metrics.totalRevenue / metrics.totalOrders) || 0) : '0 đ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Best Performing Products */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Best Performing Products</h2>
              {topListings.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {topListings.slice(0, 5).map((listing, index) => (
                    <div key={listing.id} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{index + 1}. {listing.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{listing.views.toLocaleString()} views</p>
                      </div>
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {listing.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No products yet</p>
              )}
            </div>
          </div>

          {/* Listing Performance Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Listing Performance Details</h2>
            {listingMetrics && listingMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">PRODUCT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">VIEWS</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">INQUIRIES</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">SALES</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">CONVERSION RATE</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">SALES RATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listingMetrics.map((metric, index) => (
                      <tr key={metric.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900 font-semibold">{metric.title}</td>
                        <td className="py-4 px-4 text-gray-700">{metric.views.toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-700">{metric.inquiries}</td>
                        <td className="py-4 px-4 text-gray-700">{metric.sales}</td>
                        <td className="py-4 px-4 text-gray-700">{metric.conversionRate.toFixed(2)}%</td>
                        <td className="py-4 px-4 text-gray-700">{metric.salesRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No listing data available</p>
            )}
          </div>

          {/* Daily Performance Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Daily Performance ({period})</h2>
            </div>
            {performanceData && performanceData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">DATE</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">REVENUE</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">ORDERS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900 font-semibold">{item.date}</td>
                        <td className="py-4 px-4 text-gray-900 font-semibold">{formatCurrency(item.revenue)}</td>
                        <td className="py-4 px-4 text-gray-700">{item.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 text-sm">
                No data available for this period
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
