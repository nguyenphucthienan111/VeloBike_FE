import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE_URL } from '../constants';

interface SellerSidebarProps {
  stats?: {
    totalListings?: number;
  };
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({ stats }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageUnread, setMessageUnread] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  const fetchUnread = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API_BASE_URL}/messages/unread`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.data?.unreadCount != null) setMessageUnread(Number(data.data.unreadCount));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    // Reset when on messages page
    if (location.pathname === '/seller/messages') setMessageUnread(0);
  }, [location.pathname]);

  useEffect(() => {
    const onNew = () => fetchUnread();
    window.addEventListener('newMessageReceived', onNew);
    return () => window.removeEventListener('newMessageReceived', onNew);
  }, []);

  const navItems = [
    { path: '/seller/dashboard', label: 'Dashboard' },
    { path: '/seller/inventory', label: 'Inventory' },
    { path: '/seller/analytics', label: 'Sales' },
    { path: '/seller/orders', label: 'Orders' },
    { path: '/seller/messages', label: 'Messages', badge: messageUnread },
    { path: '/seller/reviews', label: 'Reviews' },
    { path: '/seller/wallet', label: 'Wallet' },
    { path: '/seller/subscription', label: 'Subscription' },
  ];

  return (
    <div className="w-56 bg-white text-gray-900 p-6 sticky top-0 h-screen overflow-y-auto border-r border-gray-200">
      {/* Logo */}
      <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
        <div className="text-xl font-extrabold tracking-tighter italic mb-2">
          VELO<span className="text-red-600">BIKE</span>
        </div>
        <p className="text-xs text-gray-500">Seller Dashboard</p>
      </div>

      {/* Mua hàng - quay lại trang Marketplace (mua sắm) */}
      <Link
        to="/marketplace"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 mb-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm"
      >
        🛒 Marketplace
      </Link>

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
            {item.badge != null && item.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Add Inventory Button */}
      <button 
        onClick={() => navigate('/seller/add-product')}
        className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold mb-4"
      >
        + ADD INVENTORY
      </button>

    </div>
  );
};
