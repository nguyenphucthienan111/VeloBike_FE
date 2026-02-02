import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/listings', label: 'Listings' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/analytics', label: 'Analytics' },
    { path: '/admin/inspectors', label: 'Inspectors' },
    { path: '/admin/profile', label: 'Profile' },
  ];

  return (
    <div className="w-56 bg-white text-gray-900 p-6 sticky top-0 h-screen overflow-y-auto border-r border-gray-200">
      {/* Logo */}
      <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
        <div className="text-xl font-extrabold tracking-tighter italic mb-2">
          VELO<span className="text-red-600">BIKE</span>
        </div>
        <p className="text-xs text-gray-500">Admin Dashboard</p>
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
