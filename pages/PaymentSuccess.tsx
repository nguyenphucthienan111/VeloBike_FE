import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(true);
  const { toast, showToast, hideToast } = useToast();
  const pollCount = useRef(0);
  const maxPolls = 20; // 20 * 2s = 40s timeout

  const fetchOrderDetails = async () => {
    // const orderCode = searchParams.get('orderCode'); // Ignore URL orderCode as it might be tempOrderCode
    const token = localStorage.getItem('accessToken');
    const pendingOrderId = localStorage.getItem('pendingOrderId');

    if (!token || !pendingOrderId) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch order details from our DB
      const response = await fetch(`${API_BASE_URL}/orders/${pendingOrderId}`, {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const order = data.data;
        setOrderDetails(order);

        // If order is already paid/locked, stop polling
        if (order.status === 'ESCROW_LOCKED' || order.status === 'IN_INSPECTION' || order.status === 'INSPECTION_PASSED') {
          setIsPolling(false);
          setLoading(false);
          showToast('Thanh toán đơn hàng thành công!', 'success');
          localStorage.removeItem('pendingOrderId');
          localStorage.removeItem('pendingListingId');
          window.dispatchEvent(new Event('ordersAndNotificationsRefresh'));
          return;
        }

        if (order.status === 'CREATED') {
            // PayOS redirects to ?status=PAID&orderCode=xxx#/payment/success - query is BEFORE hash, so use window.location.search (HashRouter doesn't see it)
            const mainSearch = new URLSearchParams(window.location.search);
            const urlPaid = mainSearch.get('status') === 'PAID';
            const urlOrderCode = mainSearch.get('orderCode');
            const timelineNote = order.timeline?.find((t: any) => t.note?.includes('orderCode:'))?.note;
            const timelineOrderCode = timelineNote ? timelineNote.split('orderCode: ')[1]?.trim() : null;
            const realOrderCode = (urlPaid && urlOrderCode) ? urlOrderCode.trim() : timelineOrderCode;
            if (realOrderCode) {
                const synced = await checkPayOSAndSync(realOrderCode, pendingOrderId, token);
                if (synced) {
                  const refetch = await fetch(`${API_BASE_URL}/orders/${pendingOrderId}`, {
                    headers: { 'Authorization': `Bearer ${token.trim()}` }
                  });
                  if (refetch.ok) {
                    const refetchData = await refetch.json();
                    const updated = refetchData.data;
                    if (updated?.status === 'ESCROW_LOCKED' || updated?.status === 'IN_INSPECTION' || updated?.status === 'INSPECTION_PASSED') {
                      setOrderDetails(updated);
                      setIsPolling(false);
                      setLoading(false);
                      showToast('Thanh toán đơn hàng thành công!', 'success');
                      localStorage.removeItem('pendingOrderId');
                      localStorage.removeItem('pendingListingId');
                      window.dispatchEvent(new Event('ordersAndNotificationsRefresh'));
                    }
                  }
                }
            }
        }
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    }
  };

  const checkPayOSAndSync = async (orderCode: string, orderId: string, token: string): Promise<boolean> => {
      try {
          const infoRes = await fetch(`${API_BASE_URL}/payment/info/${orderCode}`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!infoRes.ok) return false;
          const infoData = await infoRes.json();
          if (infoData.data?.status !== 'PAID') return false;
          const webhookBody = {
              code: "00000",
              orderCode: Number(orderCode),
              data: infoData.data
          };
          const webhookRes = await fetch(`${API_BASE_URL}/payment/webhook`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(webhookBody)
          });
          return webhookRes.ok;
      } catch (e) {
          console.error("Sync failed", e);
          return false;
      }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
        if (pollCount.current >= maxPolls) {
            setIsPolling(false);
            setLoading(false);
            showToast('Thanh toán có thể đã thành công nhưng hệ thống chưa cập nhật kịp. Vui lòng kiểm tra lại sau.', 'warning');
            return;
        }

        await fetchOrderDetails();
        pollCount.current++;
    };

    // Initial fetch
    poll();

    // Start polling
    if (isPolling) {
        intervalId = setInterval(poll, 2000);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [searchParams, isPolling]);

  if (loading || (orderDetails && orderDetails.status === 'CREATED' && isPolling)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xử lý thanh toán...</h2>
          <p className="text-gray-600 mb-6">
            Vui lòng không tắt trình duyệt. Hệ thống đang xác nhận giao dịch của bạn.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
             <div className="bg-accent h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
          <p className="text-xs text-gray-400">Đang đồng bộ dữ liệu ({pollCount.current}/{maxPolls})</p>
        </div>
      </div>
    );
  }

  const isSuccess = orderDetails?.status === 'ESCROW_LOCKED' || 
                    orderDetails?.status === 'IN_INSPECTION' || 
                    orderDetails?.status === 'INSPECTION_PASSED';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      <div className="max-w-2xl mx-auto">
        {/* Status Icon */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${isSuccess ? 'bg-green-100' : 'bg-yellow-100'}`}>
            {isSuccess ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
                <AlertTriangle className="w-12 h-12 text-yellow-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSuccess ? 'Thanh toán thành công!' : 'Đang chờ cập nhật...'}
          </h1>
          <p className="text-gray-600">
            {isSuccess 
                ? 'Đơn hàng của bạn đã được xác nhận và đang được xử lý' 
                : 'Chúng tôi đã ghi nhận giao dịch nhưng hệ thống cần thêm thời gian để cập nhật trạng thái.'}
          </p>
        </div>

        {/* Order Details Card */}
        {orderDetails && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-accent" />
              Thông tin đơn hàng
            </h2>
            
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <span className="font-semibold">#{orderDetails._id.slice(-8).toUpperCase()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isSuccess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isSuccess ? 'Đã thanh toán' : 'Chờ cập nhật'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Giá sản phẩm:</span>
                <span className="font-semibold">
                  {orderDetails.financials.itemPrice.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              {orderDetails.financials.inspectionFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí kiểm định:</span>
                  <span className="font-semibold">
                    {orderDetails.financials.inspectionFee.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="font-semibold">
                  {orderDetails.financials.shippingFee.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              <div className="flex justify-between pt-3 border-t">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-lg font-bold text-accent">
                  {orderDetails.financials.totalAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Bước tiếp theo:</h3>
          <ul className="space-y-2 text-blue-800">
            {orderDetails?.inspectionRequired ? (
              <>
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Đơn hàng sẽ được chuyển đến inspector để kiểm định</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Sau khi kiểm định pass, seller sẽ giao hàng</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Bạn sẽ nhận được thông báo qua email khi có cập nhật</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Seller sẽ chuẩn bị và giao hàng cho bạn</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Bạn sẽ nhận được thông báo qua email khi có cập nhật</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/buyer/orders')}
            className="flex-1 bg-accent text-white py-3 px-6 rounded-lg font-semibold hover:bg-accent/90 transition flex items-center justify-center"
          >
            Xem đơn hàng của tôi
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
};