import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants';
import { Check, Sparkles, Zap, Crown, HelpCircle, Loader2, CreditCard } from 'lucide-react';

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  window.dispatchEvent(new CustomEvent('showToast', { detail: { type, message } }));
};

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

// Higher number = higher tier
const PLAN_RANK: Record<string, number> = { FREE: 0, BASIC: 1, PRO: 2, PREMIUM: 3 };

export const SellerSubscription: React.FC = () => {
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
      showToast('Failed to load subscription data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value === 0) return 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(value);
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
          showToast('Successfully switched to the free plan.', 'success');
          fetchData();
        } else {
          showToast(data.message || 'Subscription failed.', 'error');
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
        showToast(data.message || 'Failed to create payment link.', 'error');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      showToast('An error occurred while subscribing.', 'error');
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
    ? new Date(currentSubscription.endDate).toLocaleDateString()
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Subscription plans
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Upgrade your plan to post more listings, reduce commission fees, and stand out to buyers.
          </p>
          {/* Current plan pill */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm">
            <span className="text-gray-600">Current plan:</span>
            <span className="font-semibold text-gray-900">{currentPlanDisplay}</span>
            <span className="text-gray-500">· Expires {endDateStr}</span>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.planType === plan.name;
            const isPopular = plan.name === 'PRO';
            const currentRank = PLAN_RANK[currentSubscription?.planType || 'FREE'] ?? 0;
            const planRank = PLAN_RANK[plan.name] ?? 0;
            const isDowngrade = !isCurrent && planRank < currentRank;
            const isDisabled = isCurrent || isDowngrade || processing;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border-2 bg-white transition-all duration-200 ${
                  isCurrent
                    ? 'border-green-500 shadow-lg shadow-green-500/10 scale-[1.02]'
                    : isDowngrade
                    ? 'border-gray-200 opacity-50'
                    : isPopular
                    ? 'border-accent shadow-md hover:shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Active
                  </div>
                )}
                {isPopular && !isCurrent && !isDowngrade && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Most popular
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
                      <span className="text-2xl font-bold text-gray-900">Free</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {(plan.price / 1000).toLocaleString()}
                        </span>
                        <span className="text-gray-500 font-medium">k</span>
                        <span className="text-gray-500 text-sm">/month</span>
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
                    onClick={() => !isDisabled && handleSubscribe(plan.name)}
                    disabled={isDisabled}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isDowngrade
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPopular
                        ? 'bg-accent text-white hover:opacity-90'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrent
                      ? 'Current plan'
                      : isDowngrade
                      ? 'Cannot downgrade'
                      : processing
                      ? 'Processing...'
                      : plan.price === 0
                      ? 'Choose plan'
                      : 'Upgrade now'}
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
            Frequently asked questions
          </h2>
          <div className="grid gap-4 sm:grid-cols-1 max-w-3xl">
            {[
              {
                q: 'Can I change plans at any time?',
                a: 'Yes. You can upgrade your plan at any time. The new plan becomes active as soon as payment is completed.',
              },
              {
                q: 'Does the free plan expire?',
                a: 'The FREE plan has no time limit but comes with restrictions on listings and features.',
              },
              {
                q: 'How do I pay?',
                a: 'We support secure payments via QR code or bank transfer through the PayOS gateway.',
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
