import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { handleSessionExpired } from '../utils/auth';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface ListingData {
  _id: string;
  title: string;
  type: string;
  status: string;
  generalInfo: { brand: string; model: string; year: number; size: string; condition?: string };
  pricing: { amount: number; currency: string; originalPrice?: number };
  media?: { thumbnails?: string[] };
  inspectionRequired: boolean;
  sellerId: { _id: string; fullName: string; reputation?: { score: number; reviewCount: number } | number; badge?: string; planType?: string } | null;
  sellerHasFreeInspection?: boolean;
}

export const Checkout: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
  const [listingLocked, setListingLocked] = useState(false);
  const [requestInspection, setRequestInspection] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    district: '',
    city: '',
    province: '',
    zipCode: '',
  });
  const [shippingBreakdown, setShippingBreakdown] = useState<{
    distanceKm: number; baseFee: number; weightFee: number; bulkySurcharge: number;
    total: number; weightKg: number; note: string;
  } | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            setCurrentUser(JSON.parse(userStr));
        } catch {}
    }
  }, []);

  const canPurchase = (() => {
    if (!currentUser) return true;
    return currentUser?.role === 'BUYER' || currentUser?.role === 'SELLER';
  })();

  const isOwner = currentUser && listing?.sellerId?._id === currentUser.id;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      if (!user.fullName || (user.role !== 'BUYER' && user.role !== 'SELLER')) return;
      setShippingAddress(prev => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        phone: user.phone || prev.phone,
        street: user.address?.street || prev.street,
        district: user.address?.district || prev.district,
        city: user.address?.city || prev.city,
        province: user.address?.province || prev.province,
        zipCode: user.address?.zipCode || prev.zipCode,
      }));
    } catch (_) {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login', { state: { from: `/checkout/${listingId}` } });
      return;
    }
    if (!canPurchase) {
      navigate('/marketplace');
      return;
    }

    const fetchListing = async () => {
      if (!listingId) {
        setError('Invalid listing');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        
        // Parallel fetch: Listing details AND User's existing orders
        const [listingRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/listings/${listingId}`),
          fetch(`${API_BASE_URL}/orders?role=buyer&limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!listingRes.ok) {
          const err = await listingRes.json().catch(() => ({}));
          setError(err.message || 'Product not found');
          setLoading(false);
          return;
        }
        const listingData = await listingRes.json();
        if (listingData.success && listingData.data) {
          setListing(listingData.data);
        } else {
          setError('Product not found');
        }

        // Check for existing active order (CREATED or ESCROW_LOCKED etc)
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const myActiveOrder = ordersData.data?.find((o: any) => {
            const isThisListing = o.listingId?._id === listingId || o.listingId === listingId;
            const isActiveStatus = !['CANCELLED', 'REFUNDED', 'COMPLETED'].includes(o.status);
            return isThisListing && isActiveStatus;
          });
          
          if (myActiveOrder) {
            if (myActiveOrder.status === 'CREATED') {
              setExistingOrderId(myActiveOrder._id);
              if (myActiveOrder.shippingAddress) {
                setShippingAddress((prev: any) => ({ ...prev, ...myActiveOrder.shippingAddress }));
              }
            } else {
              setHasActiveOrder(true);
            }
          } else {
            // No order from me — check if someone else locked this listing
            try {
              const availRes = await fetch(`${API_BASE_URL}/orders/listing-availability?listingId=${listingId}`);
              const availData = await availRes.json();
              if (availData.success && !availData.available) {
                setListingLocked(true);
              }
            } catch (_) {}
          }
        }

      } catch (err: any) {
        setError(err.message || 'Error loading information');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [listingId, canPurchase, navigate]);

  const handleSubmit = async () => {
    console.log('Handle submit triggered');
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      addToast('warning', 'Please sign in');
      navigate('/login');
      return;
    }
    if (!listing) return;

    const user = JSON.parse(userStr);
    if (user.role === 'ADMIN' || user.role === 'INSPECTOR') {
      addToast('error', 'Admin/Inspector accounts cannot make purchases');
      return;
    }
    if (listing.status !== 'PUBLISHED') {
      addToast('error', 'Product is not available');
      return;
    }
    if (listing.sellerId?._id === user.id) {
      addToast('error', 'You cannot purchase your own product');
      return;
    }

    const { fullName, phone, street, district, city } = shippingAddress;
    if (!fullName?.trim() || !phone?.trim() || !street?.trim() || !district?.trim() || !city?.trim()) {
      addToast('warning', 'Please enter a complete shipping address (Name, Phone, Street, District, City)');
      return;
    }

    setOrderLoading(true);
    addToast('info', 'Processing...');

    try {
      let orderId = existingOrderId;
      console.log('Existing Order ID:', orderId);

      // Only create new order if one doesn't exist
      if (!orderId) {
        const inspectionRequired = listing.inspectionRequired === false ? false : requestInspection;
        console.log('Creating new order for listing:', listing._id);

        const orderRes = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token.trim()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: listing._id,
            inspectionRequired,
            buyerCity: shippingAddress.province || shippingAddress.city || '',
          }),
        });
        const orderData = await orderRes.json();
        console.log('Order creation response:', orderData);

        if (!orderRes.ok) {
          if (orderRes.status === 401) {
            handleSessionExpired();
            return;
          }
          if (orderData.message?.includes('đã có người đặt mua') || orderData.message?.includes('already')) {
            setHasActiveOrder(true);
            addToast('info', 'Order already exists. Reloading...');
            setTimeout(() => window.location.reload(), 1500);
            return;
          }
          throw new Error(orderData.message || 'Unable to create order');
        }
        if (!orderData.success || !orderData.data) {
          throw new Error(orderData.message || 'Unable to create order');
        }

        orderId = orderData.data._id;
        const actualInspectionFee = orderData.data.financials?.inspectionFee || 0;
        if (inspectionRequired && actualInspectionFee === 0) {
          addToast('success', '🎉 Free inspection!');
        }
      }

      if (!orderId) throw new Error("Missing Order ID");

      localStorage.setItem('pendingOrderId', orderId);
      localStorage.setItem('pendingListingId', listing._id);

      const shippingPayload = {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        street: shippingAddress.street.trim(),
        district: shippingAddress.district.trim(),
        city: shippingAddress.city.trim(),
        ...(shippingAddress.province?.trim() && { province: shippingAddress.province.trim() }),
        ...(shippingAddress.zipCode?.trim() && { zipCode: shippingAddress.zipCode.trim() }),
      };
      
      console.log('Updating shipping address...');
      const addrRes = await fetch(`${API_BASE_URL}/orders/${orderId}/shipping-address`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: shippingPayload }),
      });
      if (!addrRes.ok) {
        const err = await addrRes.json().catch(() => ({}));
        console.error('Address update failed:', err);
        if (addrRes.status === 401) handleSessionExpired();
        throw new Error(err.message || 'Address update failed');
      }

      addToast('success', 'Redirecting to payment...');
      console.log('Creating payment link...');

      const paymentRes = await fetch(`${API_BASE_URL}/payment/create-link`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const paymentData = await paymentRes.json();
      console.log('Payment link response:', paymentData);

      if (!paymentRes.ok) {
        if (paymentRes.status === 401) handleSessionExpired();
        if (paymentData.message?.includes('signature') || paymentData.message?.includes('PayOS')) {
          addToast('error', 'Payment configuration error. Please contact the administrator.');
          return;
        }
        throw new Error(paymentData.message || 'Unable to create payment link');
      }
      
      const link = paymentData.paymentLink || paymentData.checkoutUrl;
      if (paymentData.success && link) {
        console.log('Redirecting to:', link);
        window.location.href = link;
      } else {
        throw new Error(paymentData.message || 'Unable to create payment link');
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      addToast('error', err.message || 'An error occurred');
    } finally {
      setOrderLoading(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const fetchShippingEstimate = async (city: string, province: string) => {
    if (!listingId || (!city && !province)) return;
    setShippingLoading(true);
    try {
      const loc = province || city;
      const res = await fetch(`${API_BASE_URL}/orders/shipping-estimate?listingId=${listingId}&buyerCity=${encodeURIComponent(loc)}&buyerProvince=${encodeURIComponent(province || '')}`);
      const data = await res.json();
      if (data.success) setShippingBreakdown(data.data);
    } catch (_) {}
    finally { setShippingLoading(false); }
  };

  // Re-estimate when buyer city/province changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shippingAddress.city || shippingAddress.province) {
        fetchShippingEstimate(shippingAddress.city, shippingAddress.province);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [shippingAddress.city, shippingAddress.province, listingId]);
  const INSPECTION_FEE = 500000;
  const DEFAULT_SHIPPING_FEE = 30000;

  const inspectionFee = requestInspection && !listing?.sellerHasFreeInspection ? INSPECTION_FEE : 0;
  const shippingFee = shippingBreakdown?.total ?? DEFAULT_SHIPPING_FEE;
  const totalAmount = (listing?.pricing?.amount || 0) + inspectionFee + shippingFee;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Product not found</h2>
          <p className="text-gray-500 mb-4">{error || 'Product does not exist or has been removed.'}</p>
          <Link to="/marketplace" className="text-accent hover:underline">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  if (listing.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Product not available</h2>
          <p className="text-gray-500 mb-4">This product can no longer be purchased.</p>
          <Link to={`/bike/${listing._id}`} className="text-accent hover:underline">View product details</Link>
        </div>
      </div>
    );
  }

  const imageUrl = listing.media?.thumbnails?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext fill='%239ca3af' x='200' y='200' font-size='20' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to={`/bike/${listingId}`} className="inline-block text-sm text-gray-500 hover:text-black mb-6">
          ← Back to product
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-sm text-gray-500 mb-8">Confirm your order and shipping address</p>

        {/* Product summary - redesigned */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
          <div className="flex">
            <div className="w-32 flex-shrink-0 aspect-square bg-gray-50">
              <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Product</p>
              {(listing.generalInfo?.brand || listing.generalInfo?.model) && (
                <p className="text-sm text-gray-500 mb-0.5">
                  {listing.generalInfo.brand} {listing.generalInfo.model}
                  {listing.generalInfo?.year && ` • ${listing.generalInfo.year}`}
                  {listing.generalInfo?.size && ` • Size ${listing.generalInfo.size}`}
                </p>
              )}
              <h2 className="font-semibold text-gray-900 truncate">{listing.title}</h2>
              <p className="text-xl font-bold text-accent mt-2">{formatPrice(listing.pricing.amount)}</p>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-bold">This is your own product</p>
                <p className="text-xs text-blue-700 mt-1">You are viewing the checkout page for a product you listed. You cannot purchase your own product.</p>
              </div>
            </div>
          </div>
        )}

        {hasActiveOrder && !isOwner && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-900 font-medium">This product has already been reserved by someone</p>
            <p className="text-xs text-amber-700 mt-1">Please choose another product</p>
          </div>
        )}

        {listingLocked && !isOwner && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-900 font-medium">⏳ This product is currently being reserved by another buyer</p>
            <p className="text-xs text-amber-700 mt-1">If they don't complete payment within 15 minutes, the product will become available again. Please try again later.</p>
          </div>
        )}

        {/* Inspection */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Inspection service</h3>

          {listing.inspectionRequired ? (
            <>
              {listing.sellerHasFreeInspection ? (
                <p className="text-sm text-green-700 mb-4">Seller sponsors the inspection fee — free for you.</p>
              ) : (
                <p className="text-sm text-gray-600 mb-4">Inspection fee: {formatPrice(INSPECTION_FEE)}</p>
              )}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="inspection" checked={requestInspection} onChange={() => setRequestInspection(true)} className="mt-0.5" />
                  <span className="text-sm text-gray-700">Yes, hire an inspector{!listing.sellerHasFreeInspection && ` (+${formatPrice(INSPECTION_FEE)})`}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="inspection" checked={!requestInspection} onChange={() => setRequestInspection(false)} className="mt-0.5" />
                  <span className="text-sm text-gray-700">No, skip inspection{!listing.sellerHasFreeInspection && ` (save ${formatPrice(INSPECTION_FEE)})`}</span>
                </label>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">Seller does not require inspection. Bike will be shipped directly.</p>
          )}
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Shipping address</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Recipient full name *"
              value={shippingAddress.fullName}
              onChange={(e) => setShippingAddress(p => ({ ...p, fullName: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
            />
            <input
              type="tel"
              placeholder="Phone number *"
              value={shippingAddress.phone}
              onChange={(e) => setShippingAddress(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
            />
            <input
              type="text"
              placeholder="Detailed address (House number, street) *"
              value={shippingAddress.street}
              onChange={(e) => setShippingAddress(p => ({ ...p, street: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="District *"
                value={shippingAddress.district}
                onChange={(e) => setShippingAddress(p => ({ ...p, district: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
              />
              <input
                type="text"
                placeholder="City *"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress(p => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Province (optional)"
                value={shippingAddress.province}
                onChange={(e) => setShippingAddress(p => ({ ...p, province: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
              />
              <input
                type="text"
                placeholder="Zip Code"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress(p => ({ ...p, zipCode: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Total & Submit */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Bike price</span>
              <span>{formatPrice(listing.pricing.amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Inspection fee</span>
              <span>{formatPrice(inspectionFee)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping fee</span>
              <span>{formatPrice(shippingFee)}</span>
            </div>
            {shippingBreakdown && (
              <div className="ml-2 mt-1 mb-1 text-xs text-gray-400 space-y-0.5 border-l-2 border-gray-100 pl-3">
                {shippingBreakdown.distanceKm > 0 && (
                  <div className="flex justify-between">
                    <span>Khoảng cách ước tính</span>
                    <span>~{shippingBreakdown.distanceKm} km</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí cơ bản ({shippingBreakdown.note})</span>
                  <span>{formatPrice(shippingBreakdown.baseFee)}</span>
                </div>
                {shippingBreakdown.weightFee > 0 && (
                  <div className="flex justify-between">
                    <span>Phí cân nặng ({shippingBreakdown.weightKg}kg)</span>
                    <span>{formatPrice(shippingBreakdown.weightFee)}</span>
                  </div>
                )}
                {shippingBreakdown.bulkySurcharge > 0 && (
                  <div className="flex justify-between">
                    <span>Phụ phí hàng cồng kềnh</span>
                    <span>{formatPrice(shippingBreakdown.bulkySurcharge)}</span>
                  </div>
                )}
              </div>
            )}
            {shippingLoading && (
              <p className="text-xs text-gray-400 ml-2">Đang tính phí vận chuyển...</p>
            )}
            <div className="flex justify-between font-bold text-base pt-4 mt-2 border-t border-gray-200">
              <span className="text-gray-900">Total payment</span>
              <span className="text-accent">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={orderLoading || (hasActiveOrder && !existingOrderId) || isOwner || listingLocked}
          className="w-full bg-accent hover:bg-red-600 text-white py-4 font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          {orderLoading ? 'PROCESSING...' : (isOwner ? 'YOUR OWN PRODUCT' : listingLocked ? 'RESERVED BY ANOTHER BUYER' : (existingOrderId ? 'CONTINUE TO PAYMENT' : (hasActiveOrder ? 'ALREADY RESERVED' : 'CHECKOUT')))}
        </button>
      </div>
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};



