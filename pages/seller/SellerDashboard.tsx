import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerHeaderUserMenu } from '../../components/SellerHeaderUserMenu';
import { SellerPageLayout, SellerPageHeader } from '../../components/SellerPageLayout';
import { API_BASE_URL } from '../../constants';

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
  title: string;
  views: number;
  sales: number;
  revenue: number;
}

interface RecentTransaction {
  id: string;
  buyerName: string;
  productTitle: string;
  amount: number;
  status: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topListings, setTopListings] = useState<TopListing[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch analytics dashboard
      const analyticsRes = await fetch(`${API_BASE_URL}/analytics/seller/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Fetch recent orders for the table (richer data than transactions)
      const ordersRes = await fetch(`${API_BASE_URL}/orders?role=seller&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        
        setStats({
          totalListings: data.data?.overview?.totalListings || 0,
          totalViews: data.data?.overview?.totalViews || 0,
          totalSales: data.data?.overview?.totalSales || 0,
          totalRevenue: data.data?.overview?.totalRevenue || 0,
          averageOrderValue: data.data?.overview?.averageOrderValue || 0,
          conversionRate: data.data?.overview?.conversionRate || 0,
        });

        setTopListings(data.data?.topListings || []);
        
        // Use orders if available, otherwise fallback (though fallback is likely incomplete)
        if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            const mappedOrders = ordersData.data.map((order: any) => ({
                id: order._id,
                buyerName: order.buyerId?.fullName || 'Unknown',
                productTitle: order.listingId?.title || 'Unknown Product',
                amount: order.totalAmount || 0,
                status: order.status
            }));
            setRecentTransactions(mappedOrders);
        } else {
            setRecentTransactions(data.data?.recentTransactions || []);
        }
      }

      // Fetch notifications
      const notifRes = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'SHIPPED': 'bg-black text-white',
      'PROCESSING': 'bg-gray-400 text-white',
      'COMPLETED': 'bg-black text-white',
      'DELIVERED': 'bg-black text-white',
      'PENDING': 'bg-yellow-300 text-gray-900',
      'ON HOLD': 'bg-gray-300 text-gray-700',
      'CANCELLED': 'bg-red-300 text-gray-900',
    };
    return statusMap[status] || 'bg-gray-200';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (loading) {
    return (
      <SellerPageLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </SellerPageLayout>
    );
  }

  return (
    <SellerPageLayout>
      <SellerPageHeader
        title="Seller Dashboard"
        subtitle={`Welcome back, ${user?.fullName || 'Seller'}!`}
        rightSection={<SellerHeaderUserMenu user={user} />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <p className="text-gray-600 text-xs font-semibold mt-4">TOTAL REVENUE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats?.totalRevenue || 0)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <p className="text-gray-600 text-xs font-semibold mt-4">TOTAL SALES</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalSales || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <p className="text-gray-600 text-xs font-semibold mt-4">TOTAL VIEWS</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{(stats?.totalViews || 0).toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <p className="text-gray-600 text-xs font-semibold mt-4">CONVERSION RATE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{(stats?.conversionRate || 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                <button className="text-purple-600 text-sm font-semibold hover:underline">VIEW ALL</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">ORDER ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">BUYER</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">PRODUCT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">AMOUNT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length > 0 ? (
                      recentTransactions.slice(0, 5).map((tx, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 text-gray-900 font-semibold">{tx.id}</td>
                          <td className="py-4 px-4 text-gray-700">{tx.buyerName}</td>
                          <td className="py-4 px-4 text-gray-700">{tx.productTitle}</td>
                          <td className="py-4 px-4 text-gray-900 font-semibold">${tx.amount.toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded text-xs font-bold ${getStatusBadgeColor(tx.status)}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                          No transactions yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Top Listings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Products</h3>
                <div className="space-y-3">
                  {topListings.length > 0 ? (
                    topListings.slice(0, 3).map((listing, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <p className="font-bold text-gray-900 text-sm">{idx + 1}. {listing.title}</p>
                        <div className="flex justify-between text-xs text-gray-600 mt-2">
                          <span>{listing.views} views</span>
                          <span>{listing.sales} sales</span>
                        </div>
                        <p className="text-sm font-bold text-green-600 mt-2">{formatCurrency(listing.revenue)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No data yet</p>
                  )}
                </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => navigate('/seller/inventory')}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <p className="font-bold text-gray-900 text-sm group-hover:text-purple-600">New Listing</p>
                    <p className="text-xs text-gray-500 group-hover:text-purple-500">Add inventory</p>
                  </button>
                  <button 
                    onClick={() => navigate('/seller/orders')}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <p className="font-bold text-gray-900 text-sm group-hover:text-purple-600">View Orders</p>
                    <p className="text-xs text-gray-500 group-hover:text-purple-500">Manage sales</p>
                  </button>
                  <button 
                    onClick={() => navigate('/seller/analytics')}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <p className="font-bold text-gray-900 text-sm group-hover:text-purple-600">Analytics</p>
                    <p className="text-xs text-gray-500 group-hover:text-purple-500">View reports</p>
                  </button>
                </div>
          </div>
        </div>
      </div>
    </SellerPageLayout>
  );
};
