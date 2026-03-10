import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../constants';
import { SellerHeaderUserMenu } from '../../components/SellerHeaderUserMenu';

interface Order {
  _id: string;
  listingId: any;
  buyerId: any;
  status: string;
  totalAmount: number;
  inspectionRequired: boolean;
  createdAt: string;
  updatedAt: string;
  timeline?: any[];
  escrowStatus?: any;
}

export const SellerOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedShipmentOrder, setSelectedShipmentOrder] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('ghn');

  const providers = [
    { id: 'ghn', name: 'Giao Hàng Nhanh (GHN)', price: '30,000đ', time: '2-3 days' },
    { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm (GHTK)', price: '25,000đ', time: '3-4 days' },
    { id: 'viettelpost', name: 'Viettel Post', price: '28,000đ', time: '2-4 days' },
    { id: 'grab', name: 'GrabExpress (Hỏa tốc)', price: '50,000đ', time: '1-2 hours' },
  ];

  const statuses = ['ALL', 'CREATED', 'ESCROW_LOCKED', 'IN_INSPECTION', 'INSPECTION_PASSED', 'SHIPPING', 'DELIVERED', 'COMPLETED'];
  
  const statusColors: {[key: string]: string} = {
    CREATED: 'bg-blue-100 text-blue-800',
    ESCROW_LOCKED: 'bg-yellow-100 text-yellow-800',
    IN_INSPECTION: 'bg-purple-100 text-purple-800',
    INSPECTION_PASSED: 'bg-green-100 text-green-800',
    SHIPPING: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-cyan-100 text-cyan-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    DISPUTED: 'bg-red-100 text-red-800',
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      // Fix: Only fetch orders where I am the SELLER
      const response = await fetch(`${API_BASE_URL}/orders?role=seller`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (orderId: string) => {
    setSelectedShipmentOrder(orderId);
    setShowShipmentModal(true);
  };

  const confirmShipment = async () => {
    if (!selectedShipmentOrder) return;
    
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/logistics/create-shipment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: selectedShipmentOrder, serviceId: selectedProvider }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Tạo vận đơn thành công với ${providers.find(p => p.id === selectedProvider)?.name}!`);
        setShowShipmentModal(false);
        fetchOrders();
      } else {
        alert(data.message || 'Không thể tạo vận đơn');
      }
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === selectedOrder?.status) return;

    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setSelectedOrder(updatedOrder.data);
        setOrders(orders.map(o => o._id === orderId ? updatedOrder.data : o));
        alert('Order status updated successfully');
      } else {
        alert('Failed to update order status');
      }
    } catch (error: any) {
      alert('Error updating status: ' + error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
    const matchSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.listingId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
        <div className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-600">
            <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate('/seller/dashboard')}>Dashboard</span>
            <span className="mx-3">/</span>
            <span className="font-medium text-gray-900">Orders</span>
          </div>
          <SellerHeaderUserMenu user={user} />
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-2">Track and manage all customer orders.</p>
          </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by Order ID or Listing</label>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Inspection</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">{order._id.substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.listingId?.title || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">${order.totalAmount}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.inspectionRequired ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {order.inspectionRequired ? 'Required' : 'Not Required'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>

                          {/* Logistics Actions */}
                          {(order.status === 'INSPECTION_PASSED' || (order.status === 'ESCROW_LOCKED' && !order.inspectionRequired)) && (
                            <button
                              onClick={() => handleCreateShipment(order._id)}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium disabled:opacity-50"
                              title="Tạo vận đơn"
                            >
                              <Truck size={16} />
                              Gửi hàng
                            </button>
                          )}

                          {order.status === 'SHIPPING' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                              title="Xác nhận đã giao hàng"
                            >
                              <CheckCircle size={16} />
                              Đã giao
                            </button>
                          )}

                          {order.buyerId?._id && (
                            <button
                              type="button"
                              onClick={() => navigate(`/messages?contact=${order.buyerId._id}&orderId=${order._id}`)}
                              className="inline-flex items-center gap-1 text-gray-700 hover:text-black font-medium"
                            >
                              <MessageCircle size={16} />
                              Nhắn tin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Shipment Modal */}
      {showShipmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Select Shipping Provider</h2>
              <button onClick={() => setShowShipmentModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">Please choose a shipping service for this order.</p>
              <div className="space-y-3">
                {providers.map((provider) => (
                  <label 
                    key={provider.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedProvider === provider.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="provider" 
                        value={provider.id} 
                        checked={selectedProvider === provider.id}
                        onChange={() => setSelectedProvider(provider.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{provider.name}</p>
                        <p className="text-xs text-gray-500">{provider.time}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">{provider.price}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button 
                onClick={() => setShowShipmentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmShipment}
                disabled={updatingStatus}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {updatingStatus ? 'Processing...' : 'Confirm Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-900 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Order ID:</span> {selectedOrder._id}</p>
                  <p><span className="font-medium">Product:</span> {selectedOrder.listingId?.title || 'N/A'}</p>
                  <p><span className="font-medium">Amount:</span> ${selectedOrder.totalAmount}</p>
                  <p><span className="font-medium">Created:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Status Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Current Status: <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.filter(s => s !== 'ALL' && s !== selectedOrder.status).map(status => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedOrder._id, status)}
                        disabled={updatingStatus}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        → {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Timeline</h3>
                  <div className="space-y-3">
                    {selectedOrder.timeline.map((event, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-gray-900">{event.status}</p>
                          <p className="text-gray-600">{new Date(event.timestamp).toLocaleString()}</p>
                          {event.note && <p className="text-gray-500 italic">{event.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Escrow Status */}
              {selectedOrder.escrowStatus && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Escrow Status</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Status:</span> {selectedOrder.escrowStatus.status}</p>
                    <p><span className="font-medium">Amount Held:</span> ${selectedOrder.escrowStatus.amountHeld}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

