import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';

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

      const response = await fetch(`http://localhost:5000/api/admin/orders?${params}`, {
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
      setError('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayout = async (orderId: string) => {
    if (!confirm('Are you sure you want to release payout for this order?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/payout`, {
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
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders Management</h1>

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
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="text-sm font-mono text-gray-900">{order._id.substring(0, 8)}...</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{order.listingId.title}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{order.buyerId.fullName}</p>
                              <p className="text-sm text-gray-600">{order.buyerId.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{order.sellerId.fullName}</p>
                              <p className="text-sm text-gray-600">{order.sellerId.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
                              <p className="text-xs text-gray-600">
                                Platform: {formatCurrency(order.financials.platformFee)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {order.status === 'DELIVERED' && (
                              <button
                                onClick={() => handleReleasePayout(order._id)}
                                className="px-3 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 rounded transition-colors"
                              >
                                Release Payout
                              </button>
                            )}
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
    </div>
  );
};
