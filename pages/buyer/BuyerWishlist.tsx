import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

interface WishlistListing {
  _id: string;
  title: string;
  type?: string;
  generalInfo?: {
    brand?: string;
    model?: string;
    year?: number;
  };
  pricing?: {
    amount: number;
    currency: string;
  };
  media?: {
    thumbnails?: string[];
  };
  sellerId?: {
    fullName?: string;
  };
}

interface WishlistItem {
  _id: string;
  listingId: WishlistListing;
  createdAt: string;
}

export const BuyerWishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in to view your wishlist.');
        setItems([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || 'Failed to load wishlist.');
        setItems([]);
        return;
      }

      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : (err.message || 'Failed to load wishlist.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
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

  const handleRemove = async (listingId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/wishlist/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setItems(prev => prev.filter(i => i.listingId?._id !== listingId));
      }
    } catch {
      // silent fail
    }
  };

  const handleClear = async () => {
    try {
      setClearing(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/wishlist/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setItems([]);
      }
    } catch {
      // silent
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wishlist</h1>
            <p className="mt-2 text-gray-600 text-sm">
              Save bikes you like to track prices and come back later.
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Clear all'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center">
            <div className="h-10 w-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading wishlist...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <p className="text-gray-600 mb-3">You haven&apos;t added any bikes to your wishlist yet.</p>
            <Link
              to="/marketplace"
              className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const listing = item.listingId;
              if (!listing) return null;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                >
                  {listing.media?.thumbnails?.[0] ? (
                    <img
                      src={listing.media.thumbnails[0]}
                      alt={listing.title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500 mb-1">
                      {listing.generalInfo?.brand} {listing.generalInfo?.model} • {listing.generalInfo?.year}
                    </div>
                    <h2 className="font-semibold text-gray-900 mb-1 line-clamp-2">{listing.title}</h2>
                    <div className="text-sm font-bold text-red-600 mb-2">
                      {formatCurrency(listing.pricing?.amount, listing.pricing?.currency)}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Seller: {listing.sellerId?.fullName || 'Unknown'}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <Link
                        to={`/bike/${listing._id}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        View details
                      </Link>
                      <button
                        onClick={() => handleRemove(listing._id)}
                        className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
