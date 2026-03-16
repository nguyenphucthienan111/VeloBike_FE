import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const PaymentCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [listingId, setListingId] = useState<string | null>(null);

  useEffect(() => {
    const cancelOrder = async () => {
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      const savedListingId = localStorage.getItem('pendingListingId');
      const token = localStorage.getItem('accessToken');

      if (savedListingId) {
        setListingId(savedListingId);
      }

      if (pendingOrderId && token) {
        try {
          // Cancel the order
          await fetch(`${API_BASE_URL}/orders/${pendingOrderId}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'CANCELLED',
              note: 'Người dùng hủy thanh toán trên PayOS',
            }),
          });

          // Clear pending order
          localStorage.removeItem('pendingOrderId');
          localStorage.removeItem('pendingListingId');
        } catch (err) {
          console.error('Error cancelling order:', err);
        }
      }
    };

    cancelOrder();
  }, []);

  const handleBackToProduct = () => {
    if (listingId) {
      navigate(`/bike/${listingId}`);
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cancel Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thanh toán đã bị hủy
          </h1>
          <p className="text-gray-600">
            Đơn hàng của bạn đã được hủy và chưa có khoản thanh toán nào được thực hiện
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Điều gì đã xảy ra?</h2>
          <p className="text-gray-600 mb-4">
            Bạn đã hủy giao dịch thanh toán trên cổng thanh toán PayOS. 
            Đơn hàng đã được tự động hủy và không có khoản phí nào được tính.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Lưu ý:</strong> Nếu bạn vẫn muốn mua sản phẩm này, 
              vui lòng quay lại trang sản phẩm và thực hiện thanh toán lại.
            </p>
          </div>
        </div>

        {/* Reasons */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Một số lý do phổ biến:</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Bạn đã thay đổi ý định mua hàng</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Bạn muốn kiểm tra lại thông tin đơn hàng</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Bạn gặp vấn đề với phương thức thanh toán</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Bạn muốn thêm/bớt sản phẩm trong đơn hàng</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleBackToProduct}
            className="flex-1 bg-accent text-white py-3 px-6 rounded-lg font-semibold hover:bg-accent/90 transition flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại sản phẩm
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Xem sản phẩm khác
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Cần hỗ trợ? {' '}
            <a href="/contact" className="text-accent hover:underline font-medium">
              Liên hệ với chúng tôi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
