import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, BarChart3, ShoppingBag, MessageCircle, Star, User, CreditCard, LogOut, Store } from 'lucide-react';

interface SellerHeaderUserMenuProps {
  user: { fullName?: string; avatar?: string } | null;
  className?: string;
}

const mainNav = [
  { path: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/seller/inventory', label: 'Inventory', icon: Package },
  { path: '/seller/analytics', label: 'Sales', icon: BarChart3 },
  { path: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/seller/messages', label: 'Messages', icon: MessageCircle },
  { path: '/seller/reviews', label: 'Reviews', icon: Star },
] as const;

const accountNav = [
  { path: '/seller/profile', label: 'Cài đặt tài khoản', icon: User },
  { path: '/seller/subscription', label: 'Gói đăng ký', icon: CreditCard },
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

  const handleNav = (path: string) => {
    // Nếu chưa verified mà cố vào trang seller (trừ profile/kyc) -> chặn
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        // Nếu là SELLER nhưng chưa VERIFIED/APPROVED
        if (u.role === 'SELLER' && u.kycStatus !== 'VERIFIED' && u.kycStatus !== 'APPROVED') {
          // Cho phép vào profile, subscription, logout, marketplace
          const allowed = ['/seller/profile', '/seller/subscription', '/marketplace', '/seller/kyc'];
          if (!allowed.includes(path)) {
            navigate('/seller/kyc');
            setOpen(false);
            return;
          }
        }
      } catch {}
    }
    navigate(path);
    setOpen(false);
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
        <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            user?.fullName?.charAt(0) || 'S'
          )}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-[80vh] overflow-y-auto">
          <div className="px-3 py-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cửa hàng</p>
          </div>
          {mainNav.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNav(item.path)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <item.icon size={18} className="text-gray-500 shrink-0" />
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNav('/marketplace')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Store size={18} className="text-gray-500 shrink-0" />
            Mua hàng / Marketplace
          </button>
          <div className="border-t border-gray-100 my-2" />
          <div className="px-3 py-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tài khoản</p>
          </div>
          {accountNav.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNav(item.path)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <item.icon size={18} className="text-gray-500 shrink-0" />
              {item.label}
            </button>
          ))}
          <div className="border-t border-gray-100 my-2" />
          <button
            type="button"
            onClick={() => {
              handleLogout();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} className="shrink-0" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};
