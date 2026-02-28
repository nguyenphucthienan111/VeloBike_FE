import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

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
  status: string;
  createdAt: string;
  financials?: {
    totalAmount: number;
    itemPrice: number;
    inspectionFee: number;
    shippingFee: number;
  };
}

export const BuyerOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchOrders();
  }, []);

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
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {listing?._id ? (
                            <Link
                              to={`/bike/${listing._id}`}
                              className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                              View bike
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
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
    </div>
  );
};
