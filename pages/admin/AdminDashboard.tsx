import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, Package, DollarSign, AlertTriangle, Clock, CreditCard, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  totalOrders: number;
  totalRevenue: number;
  commissionRevenue: number;
  pendingCommission: number;
  subscriptionRevenue: number;
  openDisputes: number;
  pendingListings: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  recentOrders: Array<{
    _id: string;
    status: string;
    financials: { totalAmount: number; itemPrice: number };
    createdAt: string;
    buyerId?: { fullName: string };
    sellerId?: { fullName: string };
  }>;
  ordersByStatus: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-700',
  ESCROW_LOCKED: 'bg-blue-100 text-blue-700',
  IN_INSPECTION: 'bg-yellow-100 text-yellow-700',
  INSPECTION_PASSED: 'bg-green-100 text-green-700',
  INSPECTION_FAILED: 'bg-red-100 text-red-700',
  SHIPPING: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  DISPUTED: 'bg-orange-100 text-orange-700',
  REFUNDED: 'bg-pink-100 text-pink-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) { setError('Not authenticated'); setLoading(false); return; }
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        setError('Failed to load dashboard');
      }
    } catch (err) {
      setError(isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B VND`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M VND`;
    return new Intl.NumberFormat('vi-VN').format(n) + ' VND';
  };

  if (loading) return <AdminPageLayout><AdminLoadingState message="Loading dashboard..." /></AdminPageLayout>;

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Dashboard" subtitle="Platform overview" />
      {error && <AdminErrorBanner message={error} />}

      {/* Main stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
          <div className="p-2.5 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{stats?.totalUsers ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
          <div className="p-2.5 bg-violet-50 rounded-lg"><ShoppingBag size={20} className="text-violet-600" /></div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Listings</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{stats?.totalListings ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
          <div className="p-2.5 bg-emerald-50 rounded-lg"><Package size={20} className="text-emerald-600" /></div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{stats?.totalOrders ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
          <div className="p-2.5 bg-amber-50 rounded-lg"><DollarSign size={20} className="text-amber-600" /></div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Revenue</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-900">{fmt(stats?.totalRevenue ?? 0)}</p>
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-slate-400">Commission: {fmt(stats?.commissionRevenue ?? 0)}{(stats?.pendingCommission ?? 0) > 0 && <span className="text-amber-500 ml-1">(+{fmt(stats?.pendingCommission ?? 0)} pending)</span>}</p>
              <p className="text-xs text-slate-400">Subscriptions: {fmt(stats?.subscriptionRevenue ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending action cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to="/admin/listings?status=PENDING_APPROVAL"
          className="bg-orange-50 border border-orange-200 rounded-xl p-4 hover:bg-orange-100 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Pending Listings</p>
            <p className="text-2xl font-bold text-orange-700 mt-0.5">{stats?.pendingListings ?? 0}</p>
            <p className="text-xs text-orange-500 mt-1">Awaiting approval</p>
          </div>
          <ArrowRight size={16} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link to="/admin/withdrawals?status=PENDING"
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:bg-blue-100 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Pending Withdrawals</p>
            <p className="text-2xl font-bold text-blue-700 mt-0.5">{stats?.pendingWithdrawals ?? 0}</p>
            <p className="text-xs text-blue-500 mt-1">Awaiting processing</p>
          </div>
          <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link to="/admin/users?kycStatus=PENDING"
          className="bg-purple-50 border border-purple-200 rounded-xl p-4 hover:bg-purple-100 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">KYC Pending</p>
            <p className="text-2xl font-bold text-purple-700 mt-0.5">{stats?.pendingKyc ?? 0}</p>
            <p className="text-xs text-purple-500 mt-1">Needs verification</p>
          </div>
          <ArrowRight size={16} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link to="/admin/disputes"
          className="bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Open Disputes</p>
            <p className="text-2xl font-bold text-red-700 mt-0.5">{stats?.openDisputes ?? 0}</p>
            <p className="text-xs text-red-500 mt-1">Requires attention</p>
          </div>
          <ArrowRight size={16} className="text-red-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Clock size={16} /> Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(stats?.recentOrders ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No orders yet</p>
            ) : (stats?.recentOrders ?? []).map(order => (
              <div key={order._id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {(order.buyerId as any)?.fullName || 'Unknown'} → {(order.sellerId as any)?.fullName || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-US')}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{fmt(order.financials.itemPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><TrendingUp size={16} /> Orders by Status</h2>
          </div>
          <div className="p-5 space-y-3">
            {Object.entries(stats?.ordersByStatus ?? {}).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data</p>
            ) : Object.entries(stats?.ordersByStatus ?? {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                  {status.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-bold text-slate-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};
