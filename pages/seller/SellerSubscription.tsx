import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants';
import { useToast } from '../../components/Toast';
import { Toast } from '../../components/Toast';

interface Plan {
  name: string;
  displayName: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

interface Subscription {
  planType: string;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
}

export const SellerSubscription: React.FC = () => {
  const { toast, showToast, hideToast } = useToast();
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Fetch plans
      const plansRes = await fetch(`${API_BASE_URL}/subscriptions/plans`);
      const plansData = await plansRes.json();
      
      // Fetch current subscription
      const subRes = await fetch(`${API_BASE_URL}/subscriptions/my-subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const subData = await subRes.json();

      if (plansData.success) {
        setPlans(plansData.data);
      }
      
      if (subData.success) {
        setCurrentSubscription(subData.data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      showToast('Error loading subscription data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleSubscribe = async (planType: string) => {
    if (planType === currentSubscription?.planType) return;
    
    try {
      setProcessing(true);
      const token = localStorage.getItem('accessToken');

      // If free plan, subscribe directly
      if (planType === 'FREE') {
        const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ planType })
        });
        
        const data = await response.json();
        if (data.success) {
          showToast('Đăng ký gói miễn phí thành công!', 'success');
          fetchData();
        } else {
          showToast(data.message || 'Failed to subscribe', 'error');
        }
        return;
      }

      // For paid plans, create payment link
      const response = await fetch(`${API_BASE_URL}/subscriptions/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planType })
      });

      const data = await response.json();
      if (data.success && data.data.paymentLink) {
        // Redirect to payment gateway
        window.location.href = data.data.paymentLink;
      } else {
        showToast(data.message || 'Failed to create payment link', 'error');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      showToast('Error processing subscription', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Gói Đăng Ký</h1>
          <p className="text-gray-600 mt-1">Nâng cấp để mở rộng khả năng của bạn</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Current Plan Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <p className="font-medium text-blue-900 mb-1">Gói Hiện Tại</p>
              <p className="text-sm text-blue-800">
                Bạn đang sử dụng gói <strong>{plans.find(p => p.name === currentSubscription?.planType)?.displayName || currentSubscription?.planType}</strong>.
                {currentSubscription?.endDate && (
                  <span> Hết hạn vào <strong>{new Date(currentSubscription.endDate).toLocaleDateString('vi-VN')}</strong>.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.planType === plan.name;
            const isPopular = plan.name === 'PRO'; // Assuming PRO is popular

            return (
              <div
                key={plan.name}
                className={`relative rounded-lg overflow-hidden transition-all bg-white flex flex-col h-full ${
                  isCurrent
                    ? 'ring-2 ring-green-500 shadow-lg scale-105 z-10'
                    : isPopular
                    ? 'ring-2 ring-blue-300 shadow-md'
                    : 'shadow border border-gray-200'
                }`}
              >
                {/* Badge */}
                {isPopular && !isCurrent && (
                  <div className="bg-blue-500 text-white px-4 py-1 text-center font-bold text-xs uppercase tracking-wider">
                    Phổ biến nhất
                  </div>
                )}
                {isCurrent && (
                  <div className="bg-green-500 text-white px-4 py-1 text-center font-bold text-xs uppercase tracking-wider">
                    Đang sử dụng
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.price === 0 ? '0' : (plan.price / 1000).toLocaleString()}
                      </span>
                      {plan.price > 0 && <span className="text-gray-500 text-sm">k/tháng</span>}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={isCurrent || processing}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors text-sm ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrent ? 'Đang sử dụng' : processing ? 'Đang xử lý...' : 'Đăng ký ngay'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Câu Hỏi Thường Gặp</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Tôi có thể thay đổi gói bất cứ lúc nào không?',
                a: 'Có, bạn có thể nâng cấp gói bất cứ lúc nào. Gói mới sẽ có hiệu lực ngay lập tức sau khi thanh toán thành công.',
              },
              {
                q: 'Gói miễn phí có thời hạn không?',
                a: 'Gói miễn phí (FREE) có thời hạn vĩnh viễn nhưng bị giới hạn tính năng và số lượng tin đăng.',
              },
              {
                q: 'Thanh toán như thế nào?',
                a: 'Chúng tôi hỗ trợ thanh toán qua chuyển khoản ngân hàng (QR Code) thông qua cổng thanh toán PayOS an toàn và tiện lợi.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5">
                <p className="font-bold text-gray-900 mb-2">{item.q}</p>
                <p className="text-gray-600 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
