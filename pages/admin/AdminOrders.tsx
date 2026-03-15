import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

interface Order {
  _id: string;
  buyerId: {
    _id: string;
    fullName: string;
    email: string;
  };
  sellerId: {
    _id: string;
    fullName: string;
    email: string;
  };
  listingId: {
    _id: string;
    title: string;
  };
  status: string;
  amount: number;
  financials: {
    platformFee: number;
    sellerAmount: number;
  };
  createdAt: string;
}

export const AdminOrders: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
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
      console.error('Error fetching orders:', error);
      setError(isConnectionError(error) ? CONNECTION_ERROR_MESSAGE : 'Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayout = async (orderId: string) => {
    if (!confirm('Are you sure you want to release payout for this order?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/payout`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Payout released successfully');
        fetchOrders();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to release payout');
      }
    } catch (error) {
      console.error('Error releasing payout:', error);
      alert('Error releasing payout');
    }
  };

  const handleStartInspection = async (orderId: string) => {
    if (!confirm('Bắt đầu kiểm định thủ công cho đơn này? (Admin only - for debugging)')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/start-inspection`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Inspection started');
        fetchOrders();
      } else {
        alert(data.message || 'Failed to start inspection');
      }
    } catch (error) {
      console.error('Error starting inspection:', error);
      alert('Error starting inspection');
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
    } catch (e) {
      console.error(e);
      alert('Export failed');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'DELIVERED': return 'text-blue-600 bg-blue-50';
      case 'SHIPPING': return 'text-purple-600 bg-purple-50';
      case 'IN_INSPECTION': return 'text-yellow-600 bg-yellow-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders Management</h1>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <button
              onClick={handleExportOrders}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Export CSV
            </button>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                >
                  <option value="">All Status</option>
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

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading orders...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Listing</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Buyer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Seller</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders
                        .filter((order) => order && order._id)
                        .map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="text-sm font-mono text-gray-900">{order._id.substring(0, 8)}...</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">
                              {order.listingId?.title ?? (typeof order.listingId === 'string' ? order.listingId : 'N/A')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{order.buyerId?.fullName ?? 'N/A'}</p>
                              <p className="text-sm text-gray-600">{order.buyerId?.email ?? ''}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{order.sellerId?.fullName ?? 'N/A'}</p>
                              <p className="text-sm text-gray-600">{order.sellerId?.email ?? ''}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(order.amount ?? order.financials?.totalAmount ?? 0)}
                              </p>
                              <p className="text-xs text-gray-600">
                                Platform: {formatCurrency(order.financials?.platformFee ?? 0)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {order.status === 'ESCROW_LOCKED' && (
                                <button
                                  onClick={() => handleStartInspection(order._id)}
                                  className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors text-left"
                                >
                                  Start Inspection
                                </button>
                              )}
                              {order.status === 'DELIVERED' && (
                                <button
                                  onClick={() => handleReleasePayout(order._id)}
                                  className="px-3 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 rounded transition-colors text-left"
                                >
                                  Release Payout
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  );
};
