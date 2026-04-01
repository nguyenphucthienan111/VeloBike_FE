import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, CreditCard, XCircle, RefreshCw, AlertTriangle, CheckCircle, Truck, ShoppingBag } from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { DisputeModal } from '../../components/DisputeModal';
import { ConfirmReceivedModal } from '../../components/ConfirmReceivedModal';
import { ReviewModal } from '../../components/ReviewModal';
import { InspectorRatingModal } from '../../components/InspectorRatingModal';

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
      showToast('Creating payment link...', 'info');
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
        throw new Error(data.message || 'Unable to create payment link');
      }

      if (data.success && data.paymentLink) {
        localStorage.setItem('pendingOrderId', orderId);
        window.location.href = data.paymentLink;
      } else {
        throw new Error('Invalid response from payment system');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating payment', 'error');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      showToast('Cancelling order...', 'info');
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
        throw new Error(data.message || 'Unable to cancel order');
      }

      showToast('Order cancelled successfully', 'success');
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o._id === orderId ? { ...o, status: 'CANCELLED' } : o
      ));
    } catch (err: any) {
      showToast(err.message || 'Error while cancelling order', 'error');
    }
  };

  const [checkingPayment, setCheckingPayment] = useState<string | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showInspectorRatingModal, setShowInspectorRatingModal] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedInspectorName, setSelectedInspectorName] = useState('Inspector');
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [ratedInspectorOrderIds, setRatedInspectorOrderIds] = useState<Set<string>>(new Set());

  const handleOpenInspectorRating = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/inspections/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const inspection = data.data;
        setSelectedInspectionId(inspection._id);
        setSelectedInspectorName(inspection.inspectorId?.fullName || 'Inspector');
        setShowInspectorRatingModal(true);
      } else {
        showToast('Không tìm thấy thông tin inspection', 'error');
      }
    } catch {
      showToast('Lỗi kết nối', 'error');
    }
  };

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
        throw new Error(data.message || 'Unable to confirm receipt');
      }

      showToast('Order marked as received!', 'success');
      setShowConfirmReceivedModal(false);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Error while confirming receipt', 'error');
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

      const fetchedOrders: OrderItem[] = Array.isArray(data.data) ? data.data : [];
      setOrders(fetchedOrders);

      // Check which orders have already been reviewed
      const reviewableOrders = fetchedOrders.filter(o =>
        o.status === 'COMPLETED' || o.status === 'DELIVERED'
      );
      if (reviewableOrders.length > 0) {
        const checks = await Promise.all(
          reviewableOrders.map(o =>
            fetch(`${API_BASE_URL}/reviews/check/${o._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json()).then(d => ({ id: o._id, reviewed: d.reviewed })).catch(() => ({ id: o._id, reviewed: false }))
          )
        );
        const reviewed = new Set(checks.filter(c => c.reviewed).map(c => c.id));
        setReviewedOrderIds(reviewed);
      }

      // Check which orders have already been inspector-rated
      const inspectorRatableOrders = fetchedOrders.filter(o =>
        ['INSPECTION_PASSED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'REFUNDED'].includes(o.status) && o.inspectorId
      );
      if (inspectorRatableOrders.length > 0) {
        const checks = await Promise.all(
          inspectorRatableOrders.map(o =>
            fetch(`${API_BASE_URL}/inspector-reviews/check-by-order/${o._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json()).then(d => ({ id: o._id, rated: d.hasReviewed })).catch(() => ({ id: o._id, rated: false }))
          )
        );
        const rated = new Set(checks.filter(c => c.rated).map(c => c.id));
        setRatedInspectorOrderIds(rated);
      }
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
      if (!silent) showToast('Checking payment status...', 'info');
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // 1. Fetch full order details to get orderCode from timeline
      const orderRes = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Unable to fetch order details');

      const order = orderData.data;
      
      // If order is already paid, just refresh list
      if (order.status !== 'CREATED') {
          fetchOrders();
          if (!silent) showToast('Order has already been paid!', 'success');
          setCheckingPayment(null);
          return;
      }

      // Extract orderCode from timeline note: "Payment link created with orderCode: 123456"
      const timelineNote = order.timeline?.find((t: any) => t.note?.includes('orderCode:'))?.note;
      const orderCode = timelineNote ? timelineNote.split('orderCode: ')[1] : null;

      if (!orderCode) {
        if (!silent) showToast('Payment code not found. Please try again later.', 'error');
        setCheckingPayment(null);
        return;
      }

      // 2. Check PayOS status using orderCode
      const infoRes = await fetch(`${API_BASE_URL}/payment/info/${orderCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const infoData = await infoRes.json();

      if (!infoRes.ok) {
         throw new Error(infoData.message || 'Unable to check payment status');
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
             if (!silent) showToast('Payment status updated successfully!', 'success');
             fetchOrders(); 
         } else {
             if (!silent) showToast('Payment succeeded but order was not updated. Please try again.', 'warning');
         }
      } else {
          if (!silent) showToast('No payment was recorded for this order yet.', 'info');
      }

    } catch (err: any) {
      if (!silent) showToast(err.message || 'Error checking payment', 'error');
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header - unified with BuyerNotifications */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <ShoppingBag size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Orders</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Track your purchases, payments, and delivery status.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 text-red-700 px-6 py-4 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-sm font-medium mb-2">You have no orders yet.</p>
            <p className="text-xs mb-4">
              When you purchase a bike, it will appear here with full status tracking.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-900 transition-colors"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Order</th>
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

                  const shippingInfo =
                    order.status === 'SHIPPING' ? getShippingInfo(order.timeline || []) : null;

                  return (
                    <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50">
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
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium w-fit whitespace-nowrap ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                          {shippingInfo && (
                            <div className="flex items-start gap-1 text-xs text-gray-600 bg-blue-50 p-1.5 rounded border border-blue-100 max-w-[220px]">
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
                        <div className="flex flex-col gap-2 min-w-[160px]">
                          {order.status === 'CREATED' && (
                            <div className="flex flex-col gap-1">
                              {checkingPayment === order._id ? (
                                <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-semibold">
                                  <RefreshCw size={14} className="animate-spin" />
                                  Checking...
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handlePayment(order._id)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-accent hover:bg-red-600 px-3 py-1.5 rounded transition-colors shadow-sm"
                                  >
                                    <CreditCard size={14} />
                                    Pay
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCheckPayment(order._id)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                                    title="Check payment status if you have already paid"
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
                                Cancel order
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
                              title="Confirm that you have received the bike"
                            >
                              <CheckCircle size={14} />
                              Mark as received
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
                              Open dispute
                            </button>
                          )}
                          {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && !reviewedOrderIds.has(order._id) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForAction(order._id);
                                setShowReviewModal(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-yellow-500 hover:bg-yellow-600 px-3 py-1.5 rounded transition-colors shadow-sm"
                            >
                              <MessageCircle size={14} />
                              Review
                            </button>
                          )}
                          {(['INSPECTION_PASSED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'REFUNDED'].includes(order.status)) && order.inspectorId && !ratedInspectorOrderIds.has(order._id) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderForAction(order._id);
                                handleOpenInspectorRating(order._id);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                            >
                              ⭐ Rate Inspector
                            </button>
                          )}
                          <div className="flex flex-wrap gap-2 items-center">
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
                                onClick={() =>
                                  navigate(
                                    `/messages?contact=${order.sellerId!._id}&orderId=${order._id}`
                                  )
                                }
                                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-black"
                              >
                                <MessageCircle size={14} />
                                Message
                              </button>
                            ) : null}
                          </div>
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

      {showDisputeModal && selectedOrderForAction && (
        <DisputeModal
          orderId={selectedOrderForAction}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => {
            showToast('Dispute submitted successfully', 'success');
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
            showToast('Review submitted successfully', 'success');
            setReviewedOrderIds(prev => new Set(prev).add(selectedOrderForAction!));
          }}
        />
      )}

      {showInspectorRatingModal && selectedInspectionId && (
        <InspectorRatingModal
          inspectionId={selectedInspectionId}
          inspectorName={selectedInspectorName}
          onClose={() => setShowInspectorRatingModal(false)}
          onSuccess={() => {
            showToast('Đánh giá inspector thành công', 'success');
            if (selectedOrderForAction) setRatedInspectorOrderIds(prev => new Set(prev).add(selectedOrderForAction!));
          }}
        />
      )}
    </div>
  );
};
