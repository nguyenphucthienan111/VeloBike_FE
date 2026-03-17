import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertTriangle, Crown } from 'lucide-react';
import { API_BASE_URL } from '../../constants';

const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  window.dispatchEvent(new CustomEvent('showToast', { detail: { type, message } }));
};

export const SubscriptionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'timeout'>('loading');
  const [planName, setPlanName] = useState<string>('');
  const pollCount = useRef(0);
  const maxPolls = 15;
  const activated = useRef(false);

  useEffect(() => {
    const orderCode = searchParams.get('orderCode');

    if (!orderCode) {
      navigate('/seller/subscription', { replace: true });
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const tryActivate = async (): Promise<boolean> => {
      try {
        const res = await fetch(`${API_BASE_URL}/subscriptions/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderCode: Number(orderCode) }),
        });
        const data = await res.json();
        if (data.success) {
          setPlanName(data.data?.planName || '');
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const poll = async () => {
      if (activated.current) return;
      if (pollCount.current >= maxPolls) {
        setStatus('timeout');
        showToast('Payment received — subscription may take a moment to activate.', 'info');
        return;
      }
      pollCount.current++;
      const ok = await tryActivate();
      if (ok && !activated.current) {
        activated.current = true;
        setStatus('success');
        showToast('Subscription activated successfully!', 'success');
        window.dispatchEvent(new Event('authStatusChanged'));
      }
    };

    poll();
    const interval = setInterval(async () => {
      if (activated.current || pollCount.current >= maxPolls) {
        clearInterval(interval);
        return;
      }
      await poll();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Activating your subscription...</h2>
          <p className="text-gray-500 text-sm">Please wait, do not close this tab.</p>
          <p className="text-xs text-gray-400 mt-3">({pollCount.current}/{maxPolls})</p>
        </div>
      </div>
    );
  }

  if (status === 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment received</h2>
          <p className="text-gray-600 mb-6">
            Your payment was processed but the subscription may take a moment to activate. Please check your subscription page.
          </p>
          <button
            onClick={() => navigate('/seller/subscription')}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            Go to Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <Crown className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h2>
        {planName && (
          <p className="text-gray-600 mb-1">
            You are now on <span className="font-semibold text-gray-900">{planName}</span>.
          </p>
        )}
        <p className="text-gray-500 text-sm mb-8">Your new plan is active and ready to use.</p>
        <button
          onClick={() => navigate('/seller/subscription')}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
        >
          View My Subscription
        </button>
      </div>
    </div>
  );
};
