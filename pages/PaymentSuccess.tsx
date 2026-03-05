import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const orderCode = searchParams.get('orderCode');
      const token = localStorage.getItem('accessToken');
      const pendingOrderId = localStorage.getItem('pendingOrderId');

      if (!token || !pendingOrderId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch order details
        const response = await fetch(`${API_BASE_URL}/orders/${pendingOrderId}`, {
          headers: {
            'Authorization': `Bearer ${token.trim()}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data.data);
        }

        // Clear pending order
        localStorage.removeItem('pendingOrderId');
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600">
            Đơn hàng của bạn đã được xác nhận và đang được xử lý
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
                <span className="font-semibold">#{orderDetails._id.slice(-8)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {orderDetails.status === 'ESCROW_LOCKED' ? 'Đã thanh toán' : orderDetails.status}
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
