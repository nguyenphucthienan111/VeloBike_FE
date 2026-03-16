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
  const { toast, showToast } = useToast();

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
          fetch(`${API_BASE_URL}/orders?role=buyer&limit=50`, { // Fetch all recent orders, filter client-side
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!listingRes.ok) {
          const err = await listingRes.json().catch(() => ({}));
          setError(err.message || 'Không tìm thấy sản phẩm');
          setLoading(false);
          return;
        }
        const listingData = await listingRes.json();
        if (listingData.success && listingData.data) {
          setListing(listingData.data);
        } else {
          setError('Không tìm thấy sản phẩm');
        }

        // Check for existing active order (CREATED or ESCROW_LOCKED etc)
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          // Find any order for this listing that is NOT cancelled/refunded/completed
          const activeOrder = ordersData.data?.find((o: any) => {
            const isThisListing = o.listingId?._id === listingId || o.listingId === listingId;
            const isActiveStatus = !['CANCELLED', 'REFUNDED', 'COMPLETED'].includes(o.status);
            return isThisListing && isActiveStatus;
          });
          
          if (activeOrder) {
            // If we found an active order, we should resume it (if CREATED) or show status
            if (activeOrder.status === 'CREATED') {
                setExistingOrderId(activeOrder._id);
                // Pre-fill address
                if (activeOrder.shippingAddress) {
                    setShippingAddress(prev => ({
                        ...prev,
                        ...activeOrder.shippingAddress
                    }));
                }
            } else {
                // If order exists but is not CREATED (e.g. PAID), we should probably redirect or show message
                // For now, let's just mark hasActiveOrder to disable new creation
                setHasActiveOrder(true);
            }
          }
        }

      } catch (err: any) {
        setError(err.message || 'Lỗi tải thông tin');
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
      showToast('Vui lòng đăng nhập', 'warning');
      navigate('/login');
      return;
    }
    if (!listing) return;

    const user = JSON.parse(userStr);
    if (user.role === 'ADMIN' || user.role === 'INSPECTOR') {
      showToast('Tài khoản Admin/Inspector không thể mua hàng', 'error');
      return;
    }
    if (listing.status !== 'PUBLISHED') {
      showToast('Sản phẩm không khả dụng', 'error');
      return;
    }
    if (listing.sellerId?._id === user.id) {
      showToast('Bạn không thể mua sản phẩm của chính mình', 'error');
      return;
    }

    const { fullName, phone, street, district, city } = shippingAddress;
    if (!fullName?.trim() || !phone?.trim() || !street?.trim() || !district?.trim() || !city?.trim()) {
      showToast('Vui lòng nhập đủ địa chỉ giao hàng (Tên, SĐT, Đường, Quận/Huyện, TP)', 'warning');
      return;
    }

    setOrderLoading(true);
    showToast('Đang xử lý...', 'info');

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
          body: JSON.stringify({ listingId: listing._id, inspectionRequired }),
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
            showToast('Đơn hàng đã tồn tại. Đang tải lại...', 'info');
            setTimeout(() => window.location.reload(), 1500);
            return;
          }
          throw new Error(orderData.message || 'Không thể tạo đơn hàng');
        }
        if (!orderData.success || !orderData.data) {
          throw new Error(orderData.message || 'Không thể tạo đơn hàng');
        }

        orderId = orderData.data._id;
        const actualInspectionFee = orderData.data.financials?.inspectionFee || 0;
        if (inspectionRequired && actualInspectionFee === 0) {
          showToast('🎉 Miễn phí kiểm định!', 'success');
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
        throw new Error(err.message || 'Cập nhật địa chỉ thất bại');
      }

      showToast('Đang chuyển đến thanh toán...', 'success');
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
          showToast('Lỗi cấu hình thanh toán. Liên hệ quản trị viên.', 'error');
          return;
        }
        throw new Error(paymentData.message || 'Không tạo được link thanh toán');
      }
      
      const link = paymentData.paymentLink || paymentData.checkoutUrl;
      if (paymentData.success && link) {
        console.log('Redirecting to:', link);
        window.location.href = link;
      } else {
        throw new Error(paymentData.message || 'Không tạo được link thanh toán');
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setOrderLoading(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const inspectionFee = requestInspection && !listing?.sellerHasFreeInspection ? 1000 : 0;
  const shippingFee = 1000;
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
          <h2 className="text-xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-500 mb-4">{error || 'Sản phẩm không tồn tại hoặc đã bị xóa.'}</p>
          <Link to="/marketplace" className="text-accent hover:underline">Quay lại Marketplace</Link>
        </div>
      </div>
    );
  }

  if (listing.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sản phẩm không khả dụng</h2>
          <p className="text-gray-500 mb-4">Sản phẩm này không còn có thể mua.</p>
          <Link to={`/bike/${listing._id}`} className="text-accent hover:underline">Xem chi tiết sản phẩm</Link>
        </div>
      </div>
    );
  }

  const imageUrl = listing.media?.thumbnails?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext fill='%239ca3af' x='200' y='200' font-size='20' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to={`/bike/${listingId}`} className="inline-block text-sm text-gray-500 hover:text-black mb-6">
          ← Quay lại sản phẩm
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán</h1>
        <p className="text-sm text-gray-500 mb-8">Xác nhận đơn hàng và địa chỉ giao hàng</p>

        {/* Product summary - redesigned */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
          <div className="flex">
            <div className="w-32 flex-shrink-0 aspect-square bg-gray-50">
              <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sản phẩm</p>
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
                <p className="text-sm text-blue-900 font-bold">Đây là sản phẩm của bạn</p>
                <p className="text-xs text-blue-700 mt-1">Bạn đang xem trang thanh toán cho sản phẩm do chính bạn đăng bán. Bạn không thể tự mua sản phẩm của mình.</p>
              </div>
            </div>
          </div>
        )}

        {hasActiveOrder && !isOwner && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-900 font-medium">Sản phẩm này đã có người đặt mua</p>
            <p className="text-xs text-amber-700 mt-1">Vui lòng chọn sản phẩm khác</p>
          </div>
        )}

        {/* Inspection */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Dịch vụ kiểm định</h3>

          {listing.inspectionRequired ? (
            <>
              {listing.sellerHasFreeInspection ? (
                <p className="text-sm text-green-700 mb-4">Seller tài trợ phí kiểm định — miễn phí cho bạn.</p>
              ) : (
                <p className="text-sm text-gray-600 mb-4">Phí kiểm định: 1,000 VND</p>
              )}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="inspection" checked={requestInspection} onChange={() => setRequestInspection(true)} className="mt-0.5" />
                  <span className="text-sm text-gray-700">Có, thuê inspector kiểm định{!listing.sellerHasFreeInspection && ' (+1,000 VND)'}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="inspection" checked={!requestInspection} onChange={() => setRequestInspection(false)} className="mt-0.5" />
                  <span className="text-sm text-gray-700">Không, bỏ qua kiểm định{!listing.sellerHasFreeInspection && ' (tiết kiệm 1,000 VND)'}</span>
                </label>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">Seller không yêu cầu kiểm định. Xe sẽ giao trực tiếp.</p>
          )}
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Họ tên người nhận *"
              value={shippingAddress.fullName}
              onChange={(e) => setShippingAddress(p => ({ ...p, fullName: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
            />
            <input
              type="tel"
              placeholder="Số điện thoại *"
              value={shippingAddress.phone}
              onChange={(e) => setShippingAddress(p => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
            />
            <input
              type="text"
              placeholder="Địa chỉ chi tiết (Số nhà, đường) *"
              value={shippingAddress.street}
              onChange={(e) => setShippingAddress(p => ({ ...p, street: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Quận/Huyện *"
                value={shippingAddress.district}
                onChange={(e) => setShippingAddress(p => ({ ...p, district: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
              />
              <input
                type="text"
                placeholder="Thành phố *"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress(p => ({ ...p, city: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Tỉnh (tùy chọn)"
                value={shippingAddress.province}
                onChange={(e) => setShippingAddress(p => ({ ...p, province: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-gray-900"
              />
              <input
                type="text"
                placeholder="Mã bưu điện"
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
              <span>Giá xe</span>
              <span>{formatPrice(listing.pricing.amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí kiểm định</span>
              <span>{inspectionFee === 0 ? '0 ₫' : '1.000 ₫'}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span>1.000 ₫</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-4 mt-2 border-t border-gray-200">
              <span className="text-gray-900">Tổng thanh toán</span>
              <span className="text-accent">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={orderLoading || (hasActiveOrder && !existingOrderId) || isOwner}
          className="w-full bg-accent hover:bg-red-600 text-white py-4 font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          {orderLoading ? 'ĐANG XỬ LÝ...' : (isOwner ? 'SẢN PHẨM CỦA BẠN' : (existingOrderId ? 'TIẾP TỤC THANH TOÁN' : (hasActiveOrder ? 'ĐÃ CÓ NGƯỜI ĐẶT' : 'THANH TOÁN')))}
        </button>
      </div>
      <Toast />
    </div>
  );
};
