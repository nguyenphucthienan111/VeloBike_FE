import React, { useState } from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular: boolean;
  current: boolean;
}

export const SellerSubscription: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState('professional');

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      features: [
        'Tối đa 10 sản phẩm',
        'Hỗ trợ cơ bản',
        'Thanh toán thường xuyên',
      ],
      isPopular: false,
      current: currentPlan === 'basic',
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 299000,
      features: [
        'Tối đa 100 sản phẩm',
        'Hỗ trợ ưu tiên',
        'Xem chi tiết khách hàng',
        'Marketing tools',
        'Lên hạng tìm kiếm',
      ],
      isPopular: true,
      current: currentPlan === 'professional',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 999000,
      features: [
        'Sản phẩm không giới hạn',
        'Hỗ trợ VIP 24/7',
        'Xem chi tiết khách hàng',
        'Marketing tools nâng cao',
        'Lên hạng tìm kiếm toàn bộ',
        'API access',
        'Custom branding',
      ],
      isPopular: false,
      current: currentPlan === 'premium',
    },
  ];

  const formatCurrency = (value: number) => {
    if (value === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleUpgrade = (planId: string) => {
    if (planId === currentPlan) return;
    alert(`Nâng cấp lên ${plans.find(p => p.id === planId)?.name} thành công!`);
    setCurrentPlan(planId);
  };

  const handleDowngrade = (planId: string) => {
    alert(`Hạ cấp xuống ${plans.find(p => p.id === planId)?.name} thành công!`);
    setCurrentPlan(planId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                Bạn đang sử dụng gói <strong>{plans.find(p => p.current)?.name}</strong>. Gia hạn vào <strong>28/02/2026</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-lg overflow-hidden transition-all ${
                plan.current
                  ? 'ring-2 ring-accent scale-105'
                  : plan.isPopular
                  ? 'ring-2 ring-blue-300'
                  : ''
              }`}
            >
              {/* Card */}
              <div className={`${plan.isPopular ? 'bg-white' : 'bg-white'} shadow-lg rounded-lg overflow-hidden h-full flex flex-col`}>
                {/* Badge */}
                {plan.isPopular && (
                  <div className="bg-gradient-to-r from-accent to-red-600 text-white px-4 py-2 text-center font-bold text-sm">
                    PHỔ BIẾN NHẤT
                  </div>
                )}
                {plan.current && (
                  <div className="bg-green-500 text-white px-4 py-2 text-center font-bold text-sm">
                    GÓI HIỆN TẠI
                  </div>
                )}

                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                  {/* Plan Name */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price === 0 ? '0' : (plan.price / 1000).toFixed(0)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-600">K/tháng</span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  {plan.current ? (
                    <button disabled className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium cursor-not-allowed">
                      Gói Hiện Tại
                    </button>
                  ) : plan.id === 'basic' || (currentPlan === 'professional' && plan.id === 'basic') ? (
                    <button
                      onClick={() => handleDowngrade(plan.id)}
                      className="w-full px-4 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    >
                      Hạ Cấp
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                        plan.isPopular
                          ? 'bg-accent text-white hover:bg-red-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {currentPlan === 'basic' ? 'Nâng Cấp' : 'Nâng Cấp'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Comparison */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-8 py-6 bg-gray-50 border-b">
            <h2 className="text-xl font-bold text-gray-900">So Sánh Tính Năng</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Tính Năng</th>
                  <th className="px-8 py-4 text-center text-sm font-semibold text-gray-900">Basic</th>
                  <th className="px-8 py-4 text-center text-sm font-semibold text-gray-900">Professional</th>
                  <th className="px-8 py-4 text-center text-sm font-semibold text-gray-900">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { feature: 'Số Sản Phẩm', basic: '10', pro: '100', premium: 'Không giới hạn' },
                  { feature: 'Hỗ Trợ', basic: 'Email', pro: 'Ưu tiên', premium: 'VIP 24/7' },
                  { feature: 'Xem Chi Tiết Khách', basic: '❌', pro: '✅', premium: '✅' },
                  { feature: 'Marketing Tools', basic: '❌', pro: '✅', premium: '✅ Nâng cao' },
                  { feature: 'API Access', basic: '❌', pro: '❌', premium: '✅' },
                  { feature: 'Custom Branding', basic: '❌', pro: '❌', premium: '✅' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-8 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                    <td className="px-8 py-4 text-center text-sm text-gray-700">{row.basic}</td>
                    <td className="px-8 py-4 text-center text-sm text-gray-700">{row.pro}</td>
                    <td className="px-8 py-4 text-center text-sm text-gray-700">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Câu Hỏi Thường Gặp</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Tôi có thể thay đổi gói bất cứ lúc nào không?',
                a: 'Có, bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Thay đổi sẽ được áp dụng ngay lập tức.',
              },
              {
                q: 'Hoàn tiền như thế nào nếu tôi hạ cấp?',
                a: 'Không hoàn tiền, nhưng bạn sẽ được hoàn lại tỷ lệ dùng đúng cho kỳ tiếp theo.',
              },
              {
                q: 'Gói nào phù hợp nhất với tôi?',
                a: 'Nếu bạn vừa bắt đầu, chọn Basic. Nếu bạn bán thường xuyên, chọn Professional. Premium dành cho những người bán quy mô lớn.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6">
                <p className="font-bold text-gray-900 mb-2">{item.q}</p>
                <p className="text-gray-700">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
