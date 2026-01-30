import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SellerSidebarProps {
  stats?: {
    totalListings?: number;
  };
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({ stats }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/seller/dashboard', label: 'Dashboard' },
    { path: '/seller/inventory', label: 'Inventory' },
    { path: '/seller/analytics', label: 'Sales' },
    { path: '/seller/orders', label: 'Orders' },
    { path: '/seller/wallet', label: 'Wallet' },
    { path: '/seller/messages', label: 'Messages' },
    { path: '/seller/reviews', label: 'Reviews' },
    { path: '/seller/profile', label: 'Settings' },
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

      {/* Navigation */}
      <nav className="space-y-1 mb-8">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Storage Status */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <p className="text-xs text-gray-500 font-semibold mb-3">STORAGE STATUS</p>
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gray-600 h-2 rounded-full" style={{ width: `${Math.min((stats?.totalListings || 0) / 100 * 100, 100)}%` }}></div>
          </div>
          <p className="text-xs text-gray-500">{stats?.totalListings || 0} of 100 listings</p>
        </div>
      </div>

      {/* Add Inventory Button */}
      <button 
        onClick={() => navigate('/seller/add-product')}
        className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold mb-4"
      >
        + ADD INVENTORY
      </button>

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
