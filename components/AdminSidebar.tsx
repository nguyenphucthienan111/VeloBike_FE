import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../constants';

interface Counts {
  listings: number;
  orders: number;
  disputes: number;
  withdrawals: number;
}

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState<Counts>({ listings: 0, orders: 0, disputes: 0, withdrawals: 0 });

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const fetchCounts = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const h = { Authorization: `Bearer ${token}` };
      try {
        const [listingsRes, ordersRes, disputesRes, withdrawalsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/listings?status=PENDING_APPROVAL&limit=1`, { headers: h }),
          fetch(`${API_BASE_URL}/admin/orders?status=ESCROW_LOCKED&limit=1`, { headers: h }),
          fetch(`${API_BASE_URL}/disputes/admin/all?status=OPEN&limit=1`, { headers: h }),
          fetch(`${API_BASE_URL}/admin/withdrawals?status=PENDING&limit=1`, { headers: h }),
        ]);
        const [l, o, d, w] = await Promise.all([
          listingsRes.ok ? listingsRes.json() : null,
          ordersRes.ok ? ordersRes.json() : null,
          disputesRes.ok ? disputesRes.json() : null,
          withdrawalsRes.ok ? withdrawalsRes.json() : null,
        ]);
        setCounts({
          listings: l?.pagination?.total ?? 0,
          orders: o?.pagination?.total ?? 0,
          disputes: d?.pagination?.total ?? 0,
          withdrawals: w?.pagination?.total ?? 0,
        });
      } catch { /* silent */ }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', count: 0 },
    { path: '/admin/users', label: 'Users', count: 0 },
    { path: '/admin/listings', label: 'Listings', count: counts.listings },
    { path: '/admin/orders', label: 'Orders', count: counts.orders },
    { path: '/admin/disputes', label: 'Disputes', count: counts.disputes },
    { path: '/admin/withdrawals', label: 'Withdrawals', count: counts.withdrawals },
    { path: '/admin/transactions', label: 'Transactions', count: 0 },
    { path: '/admin/subscriptions', label: 'Subscriptions', count: 0 },
    { path: '/admin/analytics', label: 'Analytics', count: 0 },
    { path: '/admin/profile', label: 'My Profile', count: 0 },
  ];

  return (
    <div className="w-56 bg-white text-gray-900 p-6 sticky top-0 h-screen overflow-y-auto border-r border-gray-200">
      <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
        <div className="text-xl font-extrabold tracking-tighter italic mb-2">
          VELO<span className="text-red-600">BIKE</span>
        </div>
        <p className="text-xs text-gray-500">Admin Dashboard</p>
      </div>

      <nav className="space-y-1 mb-8">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between ${
              isActive(item.path) ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{item.label}</span>
            {item.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${
                isActive(item.path) ? 'bg-white text-gray-900' : 'bg-red-500 text-white'
              }`}>
                {item.count > 99 ? '99+' : item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <button
        onClick={() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('authChange'));
          navigate('/login');
        }}
        className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        Logout
      </button>
    </div>
  );
};
