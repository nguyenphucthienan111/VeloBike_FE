import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../constants';
import { SellerHeaderUserMenu } from '../../components/SellerHeaderUserMenu';
import { SellerPageLayout, SellerPageHeader } from '../../components/SellerPageLayout';
import { formatStatus } from '../../utils/statusLabels';

interface Order {
  _id: string;
  listingId: any;
  buyerId: any;
  status: string;
  totalAmount: number;
  financials?: { inspectionFee?: number; totalAmount?: number };
  inspectionRequired: boolean;
  shippingInfo?: { carrier?: string; trackingNumber?: string; trackingUrl?: string };
  createdAt: string;
  updatedAt: string;
  timeline?: any[];
  escrowStatus?: any;
  inspectionVerdict?: string; // populated client-side
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
  const [selectedProvider, setSelectedProvider] = useState('GHN_STD');
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ orderId: string; title: string } | null>(null);

  const providers = [
    { id: 'GHN_STD', name: 'Giao Hàng Nhanh (GHN)' },
    { id: 'VTP_FAST', name: 'Viettel Post' },
  ];

  const statuses = ['ALL', 'CREATED', 'ESCROW_LOCKED', 'IN_INSPECTION', 'INSPECTION_PASSED', 'SHIPPING', 'DELIVERED', 'COMPLETED'];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

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
        const fetchedOrders: Order[] = data.data || [];

        // For IN_INSPECTION orders, fetch inspection verdict to detect SUGGEST_ADJUSTMENT
        const inInspectionOrders = fetchedOrders.filter(o => o.status === 'IN_INSPECTION');
        const verdictMap: Record<string, string> = {};
        await Promise.all(inInspectionOrders.map(async (o) => {
          try {
            const r = await fetch(`${API_BASE_URL}/inspections/${o._id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (r.ok) {
              const d = await r.json();
              if (d.data?.overallVerdict) verdictMap[o._id] = d.data.overallVerdict;
            }
          } catch { /* ignore */ }
        }));

        setOrders(fetchedOrders.map(o => ({ ...o, inspectionVerdict: verdictMap[o._id] })));
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSellerDecision = async (orderId: string, decision: 'PROCEED' | 'CANCEL') => {
    setDecisionLoading(`${orderId}-${decision}`);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/seller-decision`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        await fetchOrders();
      } else {
        const d = await res.json();
        alert(d.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setDecisionLoading(null);
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
        setShowShipmentModal(false);
        fetchOrders(); // Refresh to get updated shippingInfo + status
      } else {
        alert(data.message || 'Unable to create shipment');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
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
      <SellerPageLayout>
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </SellerPageLayout>
    );
  }

  return (
    <SellerPageLayout>
      <SellerPageHeader
        title="Orders"
        subtitle="Track and manage all customer orders."
        rightSection={<SellerHeaderUserMenu user={user} />}
      />

        {/* Filters & search */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
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
                    <option key={status} value={status}>{status === 'ALL' ? 'All' : formatStatus(status)}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders table */}
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Inspection</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tracking</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">{order._id.substring(0, 8)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.listingId?.title || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatCurrency(order.financials?.totalAmount ?? order.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[order.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {(() => {
                          // inspectionRequired field (new orders), or infer from status/fee for old orders
                          const hasInspection = order.inspectionRequired === true ||
                            ['IN_INSPECTION','INSPECTION_PASSED','INSPECTION_FAILED','SHIPPING','DELIVERED','COMPLETED'].includes(order.status) ||
                            (order.financials?.inspectionFee ?? 0) > 0;
                          return (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              hasInspection ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {hasInspection ? 'Required' : 'Not Required'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.shippingInfo?.trackingNumber ? (
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{order.shippingInfo.carrier}</p>
                            {order.shippingInfo.trackingUrl ? (
                              <a
                                href={order.shippingInfo.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-mono text-xs"
                              >
                                {order.shippingInfo.trackingNumber}
                              </a>
                            ) : (
                              <p className="font-mono text-xs text-gray-700">{order.shippingInfo.trackingNumber}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
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
                          {order.status === 'IN_INSPECTION' && order.inspectionVerdict === 'SUGGEST_ADJUSTMENT' && (
                            <button
                              onClick={() => setDecisionModal({ orderId: order._id, title: order.listingId?.title || 'this order' })}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-300 text-orange-700 text-xs font-semibold rounded-lg hover:bg-orange-100 transition"
                            >
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                              Action Required
                            </button>
                          )}
                          {(order.status === 'INSPECTION_PASSED' ||
                            (order.status === 'ESCROW_LOCKED' && !order.inspectionRequired)) && (
                            <button
                              onClick={() => handleCreateShipment(order._id)}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium disabled:opacity-50"
                              title="Create shipment"
                            >
                              <Truck size={16} />
                              Ship
                            </button>
                          )}
                          {order.status === 'SHIPPING' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                              title="Confirm delivery"
                            >
                              <CheckCircle size={16} />
                              Delivered
                            </button>
                          )}
                          {order.buyerId?._id && (
                            <button
                              type="button"
                              onClick={() => navigate(`/messages?contact=${order.buyerId._id}&orderId=${order._id}`)}
                              className="inline-flex items-center gap-1 text-gray-700 hover:text-black font-medium"
                            >
                              <MessageCircle size={16} />
                              Message
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
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedProvider === provider.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="provider" 
                      value={provider.id} 
                      checked={selectedProvider === provider.id}
                      onChange={() => setSelectedProvider(provider.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="font-medium text-gray-900">{provider.name}</p>
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
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Order Details</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">#{selectedOrder._id}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Status + Product */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.listingId?.title || 'N/A'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-700'}`}>
                  {formatStatus(selectedOrder.status)}
                </span>
              </div>

              {/* Buyer */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Buyer</p>
                <p className="font-medium text-gray-900">{selectedOrder.buyerId?.fullName || selectedOrder.buyerId?.name || 'N/A'}</p>
                {selectedOrder.buyerId?.email && <p className="text-gray-500 text-xs">{selectedOrder.buyerId.email}</p>}
              </div>

              {/* Shipping */}
              {selectedOrder.shippingInfo?.trackingNumber && (
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Shipping</p>
                  <p className="font-medium text-gray-900">{selectedOrder.shippingInfo.carrier}</p>
                  {selectedOrder.shippingInfo.trackingUrl ? (
                    <a href={selectedOrder.shippingInfo.trackingUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-xs">
                      {selectedOrder.shippingInfo.trackingNumber}
                    </a>
                  ) : (
                    <p className="font-mono text-xs text-gray-700">{selectedOrder.shippingInfo.trackingNumber}</p>
                  )}
                </div>
              )}

              {/* Payment Breakdown */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Payment</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Sale price</span>
                    <span className="font-medium">{formatCurrency((selectedOrder as any).financials?.itemPrice ?? 0)}</span>
                  </div>
                  {((selectedOrder as any).financials?.inspectionFee ?? 0) > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Inspection fee</span>
                      <span>{formatCurrency((selectedOrder as any).financials.inspectionFee)}</span>
                    </div>
                  )}
                  {((selectedOrder as any).financials?.shippingFee ?? 0) > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping fee</span>
                      <span>{formatCurrency((selectedOrder as any).financials.shippingFee)}</span>
                    </div>
                  )}
                  {((selectedOrder as any).financials?.platformFee ?? 0) > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Commission fee</span>
                      <span className="font-medium">-{formatCurrency((selectedOrder as any).financials.platformFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
                    <span>{selectedOrder.status === 'COMPLETED' ? 'You received' : 'Total'}</span>
                    <span className={selectedOrder.status === 'COMPLETED' ? 'text-green-600' : ''}>
                      {selectedOrder.status === 'COMPLETED'
                        ? formatCurrency(((selectedOrder as any).financials?.itemPrice ?? 0) - ((selectedOrder as any).financials?.platformFee ?? 0))
                        : formatCurrency((selectedOrder as any).financials?.totalAmount ?? selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Timeline</p>
                  <div className="space-y-2">
                    {[...selectedOrder.timeline].reverse().map((event: any, idx: number) => (
                      <div key={idx} className="flex gap-3 text-xs">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium text-gray-800">{event.status}</span>
                          <span className="text-gray-400 ml-2">{new Date(event.timestamp).toLocaleString('vi-VN')}</span>
                          {event.note && <p className="text-gray-400 italic">{event.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Adjustment Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Inspector Suggests Adjustment</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{decisionModal.title}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                The inspector has reviewed this bike and recommends some adjustments before proceeding. Please check the inspection report for details, then choose how to proceed.
              </p>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={() => { handleSellerDecision(decisionModal.orderId, 'PROCEED'); setDecisionModal(null); }}
                disabled={!!decisionLoading}
                className="w-full flex items-center gap-4 px-4 py-4 border-2 border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition disabled:opacity-50 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle size={17} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Proceed with sale</p>
                  <p className="text-xs text-gray-500 mt-0.5">Accept the adjustments and move to shipping</p>
                </div>
              </button>
              <button
                onClick={() => { handleSellerDecision(decisionModal.orderId, 'CANCEL'); setDecisionModal(null); }}
                disabled={!!decisionLoading}
                className="w-full flex items-center gap-4 px-4 py-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition disabled:opacity-50 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-red-600 font-bold text-sm">✕</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Cancel order</p>
                  <p className="text-xs text-gray-500 mt-0.5">Buyer will be refunded item price + shipping. Inspection fee goes to the inspector.</p>
                </div>
              </button>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setDecisionModal(null)} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition">
                Decide later
              </button>
            </div>
          </div>
        </div>
      )}
    </SellerPageLayout>
  );
};

