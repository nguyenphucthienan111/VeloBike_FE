import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

interface Order {
  _id: string;
  buyerId: { _id: string; fullName: string; email: string };
  sellerId: { _id: string; fullName: string; email: string };
  listingId: { _id: string; title: string };
  status: string;
  amount: number;
  financials: { platformFee: number; sellerAmount: number; totalAmount?: number };
  createdAt: string;
}

// FSM: mỗi status chỉ có đúng 1 next action admin có thể trigger
const NEXT_ACTION: Record<string, { label: string; confirm: string; color: string } | null> = {
  ESCROW_LOCKED:       { label: 'Start Inspection',  confirm: 'Start inspection for this order?',          color: 'text-amber-700 border-amber-200 hover:bg-amber-50' },
  INSPECTION_PASSED:   { label: 'Mark as Shipped',   confirm: 'Mark this order as shipped?',               color: 'text-violet-700 border-violet-200 hover:bg-violet-50' },
  SHIPPING:            { label: 'Mark as Delivered',  confirm: 'Mark this order as delivered?',             color: 'text-blue-700 border-blue-200 hover:bg-blue-50' },
  DELIVERED:           { label: 'Release Payment',   confirm: 'Release payout to seller? This cannot be undone.', color: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
};

// Map action → API endpoint + method
const ACTION_API: Record<string, { url: (id: string) => string; method: string; body?: object }> = {
  ESCROW_LOCKED:     { url: (id) => `${API_BASE_URL}/orders/${id}/start-inspection`, method: 'POST' },
  INSPECTION_PASSED: { url: (id) => `${API_BASE_URL}/orders/${id}/status`,           method: 'PUT', body: { status: 'SHIPPING' } },
  SHIPPING:          { url: (id) => `${API_BASE_URL}/orders/${id}/status`,           method: 'PUT', body: { status: 'DELIVERED' } },
  DELIVERED:         { url: (id) => `${API_BASE_URL}/admin/orders/${id}/payout`,     method: 'PUT' },
};

export const AdminOrders: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString() });
      if (statusFilter) params.append('status', statusFilter);
      const response = await fetch(`${API_BASE_URL}/admin/orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data);
        setPagination(data.pagination);
      } else {
        setError('Failed to load orders');
      }
    } catch (error) {
      setError(isConnectionError(error) ? CONNECTION_ERROR_MESSAGE : 'Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async (order: Order) => {
    const action = NEXT_ACTION[order.status];
    const api = ACTION_API[order.status];
    if (!action || !api) return;
    if (!confirm(action.confirm)) return;

    setActionLoading(order._id);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(api.url(order._id), {
        method: api.method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(api.body ? { body: JSON.stringify(api.body) } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch {
      alert('Error performing action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bulk/export/orders`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'DELIVERED': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'SHIPPING': return 'text-violet-700 bg-violet-50 border-violet-200';
      case 'IN_INSPECTION': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'REJECTED': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Order management" subtitle="View, filter, and take action on orders" />
      {error && <AdminErrorBanner message={error} />}

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <button
          onClick={handleExportOrders}
          className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 bg-white"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
            >
              <option value="">All</option>
              <option value="CREATED">CREATED</option>
              <option value="ESCROW_LOCKED">ESCROW_LOCKED</option>
              <option value="IN_INSPECTION">IN_INSPECTION</option>
              <option value="INSPECTION_PASSED">INSPECTION_PASSED</option>
              <option value="SHIPPING">SHIPPING</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <AdminLoadingState message="Loading orders..." />
        ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Order ID</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Listing</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Buyer</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Seller</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Amount</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Status</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders
                        .filter((order) => order && order._id)
                        .map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-mono text-slate-900">{order._id.substring(0, 8)}...</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-900">
                              {order.listingId?.title ?? (typeof order.listingId === 'string' ? order.listingId : 'N/A')}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-medium text-slate-900">{order.buyerId?.fullName ?? 'N/A'}</p>
                              <p className="text-slate-500">{order.buyerId?.email ?? ''}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-medium text-slate-900">{order.sellerId?.fullName ?? 'N/A'}</p>
                              <p className="text-slate-500">{order.sellerId?.email ?? ''}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {formatCurrency(order.amount ?? order.financials?.totalAmount ?? 0)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Platform fee: {formatCurrency(order.financials?.platformFee ?? 0)}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              {NEXT_ACTION[order.status] ? (
                                <button
                                  onClick={() => handleNextStep(order)}
                                  disabled={actionLoading === order._id}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors disabled:opacity-50 ${NEXT_ACTION[order.status]!.color}`}
                                >
                                  {actionLoading === order._id ? (
                                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <ArrowRight size={12} />
                                  )}
                                  {NEXT_ACTION[order.status]!.label}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  {['COMPLETED','REFUNDED','CANCELLED'].includes(order.status) ? 'Finalized' : 'Awaiting action'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <p className="text-sm text-slate-600">
                    {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} orders
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.pages}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
        )}
      </div>
    </AdminPageLayout>
  );
};
