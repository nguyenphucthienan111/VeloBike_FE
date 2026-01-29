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
      const analyticsRes = await fetch('http://localhost:5000/api/analytics/seller/dashboard', {
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
        setRecentTransactions(data.data?.recentTransactions || []);
      }

      // Fetch notifications
      const notifRes = await fetch('http://localhost:5000/api/notifications', {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-56 bg-white text-gray-900 p-6 sticky top-0 h-screen overflow-y-auto border-r border-gray-200">
        {/* Logo */}
        <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="text-xl font-extrabold tracking-tighter italic mb-2">
            VELO<span className="text-red-600">BIKE</span>
          </div>
          <p className="text-xs text-gray-500">Seller Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-8">
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="w-full text-left px-4 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/seller/inventory')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Inventory
          </button>
          <button
            onClick={() => navigate('/seller/analytics')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Sales
          </button>
          <button
            onClick={() => navigate('/seller/orders')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Customers
          </button>
          <button
            onClick={() => navigate('/seller/wallet')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Wallet
          </button>
          <button
            onClick={() => navigate('/seller/messages')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Messages
          </button>
          <button
            onClick={() => navigate('/seller/reviews')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Reviews
          </button>
          <button
            onClick={() => navigate('/seller/profile')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Settings
          </button>
        </nav>

        {/* Storage Status */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <p className="text-xs text-gray-500 font-semibold mb-3">STORAGE STATUS</p>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-gray-500">{stats?.totalListings || 0} of 100 listings</p>
          </div>
        </div>

        {/* Add Inventory Button */}
        <button 
          onClick={() => navigate('/seller/inventory')}
          className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold"
        >
          + ADD INVENTORY
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.fullName || 'Seller'}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <span>🔍</span>
                <input type="text" placeholder="Search..." className="outline-none text-sm w-40" />
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 relative"
                >
                  🔔
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                    </div>
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}>
                            <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                            <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">No notifications</div>
                    )}
                  </div>
                )}
              </div>
              
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

          {/* Stats Cards - From API */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+8.2%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">TOTAL REVENUE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+5.1%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">TOTAL SALES</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalSales || 0}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+3.2%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">TOTAL VIEWS</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{(stats?.totalViews || 0).toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+1.5%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">CONVERSION RATE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{(stats?.conversionRate || 0).toFixed(1)}%</p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
        </div>
      </div>
    </div>
  );
};
