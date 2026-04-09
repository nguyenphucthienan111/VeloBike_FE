import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../constants';

export const InspectorSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/inspections/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.pagination?.total ?? data.total ?? data.data?.length ?? 0);
        }
      } catch {}
    };
    fetchPendingCount();
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/inspector/dashboard', label: 'Dashboard', count: 0 },
    { path: '/inspector/pending', label: 'Pending Inspections', count: pendingCount },
    { path: '/inspector/history', label: 'My Inspections', count: 0 },
    { path: '/inspector/reviews', label: 'My Reviews', count: 0 },
    { path: '/inspector/wallet', label: 'My Wallet', count: 0 },
    { path: '/inspector/profile', label: 'My Profile', count: 0 },
  ];

  return (
    <div className="w-56 bg-white text-gray-900 p-6 sticky top-0 h-screen overflow-y-auto border-r border-gray-200">
      {/* Logo */}
      <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
        <div className="text-xl font-extrabold tracking-tighter italic mb-2">
          VELO<span className="text-red-600">BIKE</span>
        </div>
        <p className="text-xs text-gray-500">Inspector Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-8">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between ${
              isActive(item.path)
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{item.label}</span>
            {item.count > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isActive(item.path) ? 'bg-white text-gray-900' : 'bg-red-500 text-white'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
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
