import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, CreditCard, XCircle, RefreshCw, AlertTriangle, CheckCircle, Truck } from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { DisputeModal } from '../../components/DisputeModal';
import { ConfirmReceivedModal } from '../../components/ConfirmReceivedModal';
import { ReviewModal } from '../../components/ReviewModal';

const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  const t = type === 'warning' ? 'info' : type;
  window.dispatchEvent(new CustomEvent('showToast', { detail: { type: t, message } }));
};

interface OrderListing {
  _id: string;
  title: string;
  generalInfo?: {
    brand?: string;
    model?: string;
  };
  pricing?: {
    amount: number;
    currency: string;
  };
  media?: {
    thumbnails?: string[];
  };
}

interface OrderItem {
  _id: string;
  listingId: OrderListing;
  sellerId?: { _id: string; fullName?: string };
  status: string;
  createdAt: string;
  financials?: {
    totalAmount: number;
    itemPrice: number;
    inspectionFee: number;
    shippingFee: number;
  };
  timeline?: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
}

export const BuyerOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (orderId: string) => {
    try {
      showToast('Đang tạo link thanh toán...', 'info');
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/payment/create-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tạo link thanh toán');
      }

      if (data.success && data.paymentLink) {
        localStorage.setItem('pendingOrderId', orderId);
        window.location.href = data.paymentLink;
      } else {
        throw new Error('Phản hồi không hợp lệ từ hệ thống thanh toán');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo thanh toán', 'error');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn huỷ đơn hàng này không?')) return;

    try {
      showToast('Đang huỷ đơn hàng...', 'info');
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'CANCELLED', note: 'Buyer cancelled order' })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Không thể huỷ đơn hàng');
      }

      showToast('Đã huỷ đơn hàng thành công', 'success');
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, status: 'CANCELLED' } : o
      ));
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi huỷ đơn hàng', 'error');
    }
  };

  const [checkingPayment, setCheckingPayment] = useState<string | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleConfirmReceived = async () => {
    if (!selectedOrderForAction) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/orders/${selectedOrderForAction}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'DELIVERED', note: 'Buyer confirmed receipt' })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Không thể xác nhận đã nhận hàng');
      }

      showToast('Đã xác nhận nhận hàng thành công!', 'success');
      setShowConfirmReceivedModal(false);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xác nhận', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in to view your orders.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/orders?role=buyer&page=1&limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Failed to load orders.');
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : (err.message || 'Failed to load orders.'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const onRefresh = () => fetchOrders();
    window.addEventListener('ordersAndNotificationsRefresh', onRefresh);
    return () => window.removeEventListener('ordersAndNotificationsRefresh', onRefresh);
  }, []);

  // Refetch when user returns to this tab (e.g. after paying in same/different tab) so status is up to date
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchOrders(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const handleCheckPayment = async (orderId: string, silent = false) => {
    try {
      if (!silent) setCheckingPayment(orderId);
      if (!silent) showToast('Đang kiểm tra trạng thái thanh toán...', 'info');
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // 1. Fetch full order details to get orderCode from timeline
      const orderRes = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Không thể lấy thông tin đơn hàng');

      const order = orderData.data;
      
      // If order is already paid, just refresh list
      if (order.status !== 'CREATED') {
          fetchOrders();
          if (!silent) showToast('Đơn hàng đã được thanh toán!', 'success');
          setCheckingPayment(null);
          return;
      }

      // Extract orderCode from timeline note: "Payment link created with orderCode: 123456"
      const timelineNote = order.timeline?.find((t: any) => t.note?.includes('orderCode:'))?.note;
      const orderCode = timelineNote ? timelineNote.split('orderCode: ')[1] : null;

      if (!orderCode) {
        if (!silent) showToast('Không tìm thấy mã thanh toán. Vui lòng thử lại sau.', 'error');
        setCheckingPayment(null);
        return;
      }

      // 2. Check PayOS status using orderCode
      const infoRes = await fetch(`${API_BASE_URL}/payment/info/${orderCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const infoData = await infoRes.json();

      if (!infoRes.ok) {
         throw new Error(infoData.message || 'Không thể kiểm tra trạng thái thanh toán');
      }

      if (infoData.data?.status === 'PAID') {
         // 3. Trigger Webhook manually
         const webhookBody = {
             code: "00000",
             orderCode: Number(orderCode),
             data: infoData.data
         };
         
         const webhookRes = await fetch(`${API_BASE_URL}/payment/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookBody)
         });
         
         if (webhookRes.ok) {
             if (!silent) showToast('Đã cập nhật trạng thái thanh toán thành công!', 'success');
             fetchOrders(); 
         } else {
             if (!silent) showToast('Thanh toán thành công nhưng chưa cập nhật được đơn hàng. Vui lòng thử lại.', 'warning');
         }
      } else {
          if (!silent) showToast('Chưa ghi nhận thanh toán cho đơn hàng này.', 'info');
      }

    } catch (err: any) {
      if (!silent) showToast(err.message || 'Lỗi khi kiểm tra thanh toán', 'error');
    } finally {
        setCheckingPayment(null);
    }
  };

  // Auto-check payment for recent CREATED orders
  useEffect(() => {
      if (orders.length > 0) {
          const createdOrders = orders.filter(o => o.status === 'CREATED');
          // Check the most recent created order automatically
          if (createdOrders.length > 0) {
              const latestOrder = createdOrders[0]; // Assuming sorted by date desc
              handleCheckPayment(latestOrder._id, true);
          }
      }
  }, [orders]); // Only run when orders list changes/loads

  const formatCurrency = (amount: number | undefined, currency?: string) => {
    if (!amount) return '-';
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency || 'VND',
      }).format(amount);
    } catch {
      return `${amount.toLocaleString('vi-VN')} ${currency || 'VND'}`;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'CREATED':
        return { label: 'Awaiting payment', className: 'bg-yellow-100 text-yellow-800' };
      case 'ESCROW_LOCKED':
        return { label: 'Paid', className: 'bg-blue-100 text-blue-800' };
      case 'IN_INSPECTION':
        return { label: 'In inspection', className: 'bg-purple-100 text-purple-800' };
      case 'INSPECTION_PASSED':
        return { label: 'Inspection passed', className: 'bg-green-100 text-green-800' };
      case 'INSPECTION_FAILED':
        return { label: 'Inspection failed', className: 'bg-red-100 text-red-800' };
      case 'SHIPPING':
        return { label: 'Shipping', className: 'bg-blue-100 text-blue-800' };
      case 'DELIVERED':
        return { label: 'Delivered', className: 'bg-green-100 text-green-800' };
      case 'COMPLETED':
        return { label: 'Completed', className: 'bg-green-100 text-green-800' };
      case 'DISPUTED':
        return { label: 'Disputed', className: 'bg-orange-100 text-orange-800' };
      case 'REFUNDED':
        return { label: 'Refunded', className: 'bg-gray-100 text-gray-800' };
      case 'CANCELLED':
        return { label: 'Cancelled', className: 'bg-gray-100 text-gray-600' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-700' };
    }
  };

  const getShippingInfo = (timeline: any[]) => {
    if (!timeline) return null;
    // Find the SHIPPING event
    const event = timeline.find((t: any) => t.status === 'SHIPPING');
    return event?.note;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-gray-600 text-sm">
            View order history, status and payments.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-4" />
              <p className="text-gray-500 text-sm">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600 mb-3">You have no orders yet.</p>
              <Link
                to="/marketplace"
                className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const listing = order.listingId;
                    const statusInfo = formatStatus(order.status);
                    const amount =
                      order.financials?.totalAmount ||
                      order.financials?.itemPrice ||
                      listing?.pricing?.amount;
                    
                    const shippingInfo = order.status === 'SHIPPING' ? getShippingInfo(order.timeline || []) : null;

                    return (
                      <tr key={order._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-mono text-xs">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {listing?.media?.thumbnails?.[0] && (
                              <img
                                src={listing.media.thumbnails[0]}
                                alt={listing.title}
                                className="w-12 h-12 rounded object-cover border border-gray-200"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {listing?.title || 'Listing removed'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {listing?.generalInfo?.brand} {listing?.generalInfo?.model}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {formatCurrency(amount, listing?.pricing?.currency)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex px-2 py-1 rounded text-xs font-medium w-fit ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>
                            {shippingInfo && (
                              <div className="flex items-start gap-1 text-xs text-gray-600 bg-blue-50 p-1.5 rounded border border-blue-100 max-w-[200px]">
                                <Truck size={12} className="mt-0.5 flex-shrink-0 text-blue-600" />
                                <span className="break-words">{shippingInfo}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {order.status === 'CREATED' && (
                              <div className="flex flex-col gap-1">
                                {checkingPayment === order._id ? (
                                    <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-semibold">
                                        <RefreshCw size={14} className="animate-spin" />
                                        Đang kiểm tra...
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handlePayment(order._id)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-accent hover:bg-red-600 px-3 py-1.5 rounded transition-colors shadow-sm"
                                    >
                                        <CreditCard size={14} />
                                        Thanh toán
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCheckPayment(order._id)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                                        title="Kiểm tra trạng thái thanh toán nếu bạn đã thanh toán"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                    </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(order._id)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors shadow-sm w-full justify-center"
                                >
                                  <XCircle size={14} />
                                  Huỷ đơn
                                </button>
                              </div>
                            )}
                            {order.status === 'SHIPPING' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedOrderForAction(order._id);
                                        setShowConfirmReceivedModal(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                                    title="Xác nhận đã nhận được hàng"
                                >
                                    <CheckCircle size={14} />
                                    Đã nhận hàng
                                </button>
                            )}
                            {(order.status === 'SHIPPING' || order.status === 'DELIVERED') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedOrderForAction(order._id);
                                        setShowDisputeModal(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                                >
                                    <AlertTriangle size={14} />
                                    Khiếu nại
                                </button>
                            )}
                            {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedOrderForAction(order._id);
                                        setShowReviewModal(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1.5 rounded transition-colors shadow-sm"
                                >
                                    <MessageCircle size={14} />
                                    Đánh giá
                                </button>
                            )}
                            {listing?._id && (
                              <Link
                                to={`/bike/${listing._id}`}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                              >
                                View bike
                              </Link>
                            )}
                            {order.sellerId?._id ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/messages?contact=${order.sellerId!._id}&orderId=${order._id}`)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-black"
                              >
                                <MessageCircle size={14} />
                                Nhắn tin
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDisputeModal && selectedOrderForAction && (
        <DisputeModal
          orderId={selectedOrderForAction}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => {
            showToast('Đã gửi khiếu nại thành công', 'success');
            fetchOrders();
          }}
        />
      )}

      {showConfirmReceivedModal && selectedOrderForAction && (
        <ConfirmReceivedModal
          orderId={selectedOrderForAction}
          onClose={() => setShowConfirmReceivedModal(false)}
          onConfirm={handleConfirmReceived}
          loading={actionLoading}
        />
      )}

      {showReviewModal && selectedOrderForAction && (
        <ReviewModal
          orderId={selectedOrderForAction}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            showToast('Đã gửi đánh giá thành công', 'success');
          }}
        />
      )}
    </div>
  );
};
