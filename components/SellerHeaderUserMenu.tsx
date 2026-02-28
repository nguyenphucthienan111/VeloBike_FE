import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SellerHeaderUserMenuProps {
  user: { fullName?: string; avatar?: string } | null;
  className?: string;
}

const menuItems = [
  { path: '/seller/profile', label: 'Hồ sơ' },
  { path: '/seller/subscription', label: 'Gói đăng ký' },
  { path: '/seller/wallet', label: 'Ví' },
] as const;

export const SellerHeaderUserMenu: React.FC<SellerHeaderUserMenuProps> = ({ user, className = '' }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 pl-4 border-l border-gray-300 hover:opacity-80 transition-opacity"
      >
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{user?.fullName || 'User'}</p>
          <p className="text-xs text-gray-500">SELLER</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center font-bold text-white text-sm shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            user?.fullName?.charAt(0) || 'S'
          )}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {item.label}
            </button>
          ))}
          <div className="border-t border-gray-100 my-1" />
          <button
            type="button"
            onClick={() => {
              handleLogout();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};
