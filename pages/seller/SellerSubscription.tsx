import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants';
import { useToast } from '../../components/Toast';
import { Toast } from '../../components/Toast';
import { Check, Sparkles, Zap, Crown, HelpCircle, Loader2, CreditCard } from 'lucide-react';

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

const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <CreditCard size={20} className="text-gray-500" />,
  BASIC: <Zap size={20} className="text-amber-500" />,
  PRO: <Sparkles size={20} className="text-blue-500" />,
  PREMIUM: <Crown size={20} className="text-amber-600" />,
};

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
      const plansRes = await fetch(`${API_BASE_URL}/subscriptions/plans`);
      const plansData = await plansRes.json();
      const subRes = await fetch(`${API_BASE_URL}/subscriptions/my-subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const subData = await subRes.json();
      if (plansData.success) setPlans(plansData.data);
      if (subData.success) setCurrentSubscription(subData.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      showToast('Không tải được dữ liệu gói đăng ký', 'error');
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
      if (planType === 'FREE') {
        const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ planType })
        });
        const data = await response.json();
        if (data.success) {
          showToast('Đăng ký gói miễn phí thành công!', 'success');
          fetchData();
        } else {
          showToast(data.message || 'Đăng ký thất bại', 'error');
        }
        return;
      }
      const response = await fetch(`${API_BASE_URL}/subscriptions/create-payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planType })
      });
      const data = await response.json();
      if (data.success && data.data.paymentLink) {
        window.location.href = data.data.paymentLink;
      } else {
        showToast(data.message || 'Tạo link thanh toán thất bại', 'error');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      showToast('Có lỗi xảy ra', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  const currentPlanDisplay = plans.find(p => p.name === currentSubscription?.planType)?.displayName || currentSubscription?.planType;
  const endDateStr = currentSubscription?.endDate
    ? new Date(currentSubscription.endDate).toLocaleDateString('vi-VN')
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Gói đăng ký
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Nâng cấp để đăng thêm tin, giảm phí hoa hồng và nổi bật hơn với buyer.
          </p>
          {/* Current plan pill */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm">
            <span className="text-gray-600">Gói hiện tại:</span>
            <span className="font-semibold text-gray-900">{currentPlanDisplay}</span>
            <span className="text-gray-500">· Hết hạn {endDateStr}</span>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.planType === plan.name;
            const isPopular = plan.name === 'PRO';

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border-2 bg-white transition-all duration-200 ${
                  isCurrent
                    ? 'border-green-500 shadow-lg shadow-green-500/10 scale-[1.02]'
                    : isPopular
                    ? 'border-accent shadow-md hover:shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Đang dùng
                  </div>
                )}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Phổ biến
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-600">
                      {PLAN_ICONS[plan.name] || <CreditCard size={20} />}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{plan.displayName}</h3>
                  </div>

                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <span className="text-2xl font-bold text-gray-900">Miễn phí</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {(plan.price / 1000).toLocaleString()}
                        </span>
                        <span className="text-gray-500 font-medium">k</span>
                        <span className="text-gray-500 text-sm">/tháng</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span className="text-gray-700 text-sm leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={isCurrent || processing}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPopular
                        ? 'bg-accent text-white hover:opacity-90'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrent
                      ? 'Đang sử dụng'
                      : processing
                      ? 'Đang xử lý...'
                      : plan.price === 0
                      ? 'Chọn gói'
                      : 'Nâng cấp ngay'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <section className="mt-16 pt-12 border-t border-gray-200">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
            <HelpCircle className="w-6 h-6 text-accent" />
            Câu hỏi thường gặp
          </h2>
          <div className="grid gap-4 sm:grid-cols-1 max-w-3xl">
            {[
              {
                q: 'Tôi có thể thay đổi gói bất cứ lúc nào không?',
                a: 'Có, bạn có thể nâng cấp gói bất cứ lúc nào. Gói mới có hiệu lực ngay sau khi thanh toán thành công.',
              },
              {
                q: 'Gói miễn phí có thời hạn không?',
                a: 'Gói miễn phí (FREE) không giới hạn thời gian nhưng bị giới hạn số tin đăng và tính năng.',
              },
              {
                q: 'Thanh toán như thế nào?',
                a: 'Chúng tôi hỗ trợ thanh toán qua QR Code / chuyển khoản qua cổng PayOS an toàn.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors"
              >
                <p className="font-semibold text-gray-900 mb-1.5">{item.q}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
