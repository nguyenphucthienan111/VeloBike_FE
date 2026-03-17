import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
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
        window.dispatchEvent(new Event('wishlistRefresh'));
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
        window.dispatchEvent(new Event('wishlistRefresh'));
      }
    } catch {
      // silent
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header - unified with BuyerNotifications */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Heart size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wishlist</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Save bikes you love and come back to them later.
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {clearing ? 'Clearing...' : 'Clear all'}
          </button>
        )}
      </div>

      {/* Content card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {error && (
          <div className="bg-red-50 text-red-700 px-6 py-4 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
            <p className="text-sm">Loading wishlist...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-sm font-medium mb-2">
              You haven&apos;t added any bikes to your wishlist yet.
            </p>
            <p className="text-xs mb-4">
              Tap the heart icon on a listing to save it here.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-900 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="px-4 py-6 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {items.map((item) => {
                const listing = item.listingId;
                if (!listing) return null;

                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-xs"
                  >
                    {listing.media?.thumbnails?.[0] ? (
                      <img
                        src={listing.media.thumbnails[0]}
                        alt={listing.title}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="text-[11px] text-gray-500 mb-1">
                        {listing.generalInfo?.brand} {listing.generalInfo?.model} •{' '}
                        {listing.generalInfo?.year}
                      </div>
                      <h2 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                        {listing.title}
                      </h2>
                      <div className="text-sm font-bold text-accent mb-2">
                        {formatCurrency(listing.pricing?.amount, listing.pricing?.currency)}
                      </div>
                      <div className="text-[11px] text-gray-500 mb-3">
                        Seller: {listing.sellerId?.fullName || 'Unknown'}
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <Link
                          to={`/bike/${listing._id}`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold border border-gray-300 rounded-full hover:bg-gray-50"
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
          </div>
        )}
      </div>
    </div>
  );
};
