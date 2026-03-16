import React, { useEffect, useState, useRef } from 'react';
import { ShoppingBag, Menu, User, ShieldCheck, Heart, Bell, MessageCircle, ChevronRight, Settings, LogOut, Store, CreditCard, LayoutDashboard } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import { handleSessionExpired } from '../utils/auth';

import { Chatbot } from './Chatbot';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ fullName?: string; avatar?: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return !!token;
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [notificationUnread, setNotificationUnread] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Hide header for seller, admin, and inspector dashboard pages
  // Inspector pages have their own header component
  const isSellerPage = location.pathname.startsWith('/seller/');
  const isAdminPage = location.pathname.startsWith('/admin/');
  const isInspectorPage = location.pathname.startsWith('/inspector/');
  const isDashboardPage = isSellerPage || isAdminPage || isInspectorPage;

  useEffect(() => {
    // Check if user is logged in and get role
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      // console.log('Checking auth, token:', !!token); // Removed excessive logging
      setIsAuthenticated(!!token);
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserRole(user.role);
          setUserProfile({ fullName: user.fullName, avatar: user.avatar });
        } catch (e) {
          setUserRole(null);
          setUserProfile(null);
        }
      } else {
        setUserRole(null);
        setUserProfile(null);
      }
    };
    
    // Check immediately on mount
    checkAuth();
    
    // Also check after a tiny delay to ensure localStorage is ready
    const timeoutId = setTimeout(checkAuth, 100);
    
    // Listen for storage changes (from other tabs)
    const handleStorageChange = () => {
      console.log('Storage changed, rechecking auth');
      checkAuth();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom auth event
    const handleAuthChanged = () => {
      console.log('Auth status changed event received');
      checkAuth();
    };
    window.addEventListener('authStatusChanged', handleAuthChanged);
    window.addEventListener('authChange', handleAuthChanged);
    
    // Also check periodically (as backup)
    const interval = setInterval(checkAuth, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStatusChanged', handleAuthChanged);
      window.removeEventListener('authChange', handleAuthChanged);
      clearInterval(interval);
    };
  }, [refreshKey]);

  // Số đơn hàng (mua hàng) - cho cả BUYER và SELLER khi về trang mua hàng
  useEffect(() => {
    if (!isAuthenticated || (userRole !== 'BUYER' && userRole !== 'SELLER')) {
      setOrderCount(0);
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API_BASE_URL}/orders?role=buyer&page=1&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          handleSessionExpired();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data?.pagination?.total != null) setOrderCount(data.pagination.total);
        else setOrderCount(0);
      })
      .catch(() => setOrderCount(0));
  }, [isAuthenticated, userRole, refreshKey]);

  // Số thông báo chưa đọc (icon chuông) - GET /api/notifications
  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationUnread(0);
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API_BASE_URL}/notifications?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          handleSessionExpired();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data?.success && data?.pagination?.unreadCount != null) {
          setNotificationUnread(data.pagination.unreadCount);
        } else {
          setNotificationUnread(0);
        }
      })
      .catch(() => setNotificationUnread(0));
  }, [isAuthenticated, refreshKey]);

  // Refetch notification count khi trang Notifications đánh dấu đã đọc
  useEffect(() => {
    const onRefresh = () => {
      const token = localStorage.getItem('accessToken');
      if (!token || !isAuthenticated) return;
      fetch(`${API_BASE_URL}/notifications?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.status === 401 ? null : res.json()))
        .then((data) => {
          if (data?.success && data?.pagination?.unreadCount != null) {
            setNotificationUnread(data.pagination.unreadCount);
          } else {
            setNotificationUnread(0);
          }
        })
        .catch(() => setNotificationUnread(0));
    };
    window.addEventListener('ordersAndNotificationsRefresh', onRefresh);
    return () => window.removeEventListener('ordersAndNotificationsRefresh', onRefresh);
  }, [isAuthenticated]);

  // Số lượng wishlist (icon tim) - GET /api/wishlist/count
  const fetchWishlistCount = () => {
    if (!isAuthenticated || (userRole !== 'BUYER' && userRole !== 'SELLER')) {
      setWishlistCount(0);
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API_BASE_URL}/wishlist/count`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.status === 401 ? null : res.json())
      .then((data) => {
        if (data?.data != null) setWishlistCount(Number(data.data));
        else setWishlistCount(0);
      })
      .catch(() => setWishlistCount(0));
  };
  useEffect(() => {
    fetchWishlistCount();
  }, [isAuthenticated, userRole, refreshKey]);
  useEffect(() => {
    const onRefresh = () => fetchWishlistCount();
    window.addEventListener('wishlistRefresh', onRefresh);
    return () => window.removeEventListener('wishlistRefresh', onRefresh);
  }, [isAuthenticated, userRole]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    if (profileOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [profileOpen]);

  // Cài đặt tài khoản: khi ở giao diện buyer (marketplace, home...) → buyer profile; khi ở seller dashboard → seller profile
  const profileUrl = isSellerPage && userRole === 'SELLER' ? '/seller/profile'
    : isInspectorPage && userRole === 'INSPECTOR' ? '/inspector/profile'
    : isAdminPage && userRole === 'ADMIN' ? '/admin/profile'
    : '/buyer/profile';

  const handleLogout = () => {
    setProfileOpen(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${isDashboardPage ? 'flex' : 'flex flex-col'} bg-white`}>
      {/* Top Banner and Header - Hidden for Seller/Admin Pages */}
      {!isDashboardPage && (
        <>
      {/* Top Banner for Trust */}
      <div className="bg-black text-white text-xs py-2 text-center font-medium tracking-wide">
        <span className="flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-accent" />
          VERIFIED INSPECTION & ESCROW PAYMENTS GUARANTEED
        </span>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300 w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-16 w-full">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center z-10">
              <Link to="/" className="text-2xl font-extrabold tracking-tighter italic">
                VELO<span className="text-accent">BIKE</span>
              </Link>
            </div>

            {/* Desktop Nav: chỉ BUYER và SELLER — Admin/Inspector dùng giao diện role riêng */}
            <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center space-x-6">
              {(userRole === 'ADMIN' || userRole === 'INSPECTOR') ? (
                <Link to={userRole === 'ADMIN' ? '/admin/dashboard' : '/inspector/dashboard'} className="text-xs font-medium text-gray-500 hover:text-accent transition-colors">
                  {userRole === 'ADMIN' ? 'ADMIN' : 'INSPECTOR'}
                </Link>
              ) : (
                <>
                  <Link to="/" className={`text-xs font-medium hover:text-accent transition-colors ${location.pathname === '/' ? 'text-black' : 'text-gray-500'}`}>HOME</Link>
                  <Link to="/marketplace" className={`text-xs font-medium hover:text-accent transition-colors ${location.pathname === '/marketplace' ? 'text-black' : 'text-gray-500'}`}>MARKETPLACE</Link>
                  {(userRole === 'BUYER' || userRole === 'SELLER') && (
                    <Link to="/buyer/dashboard" className={`text-xs font-medium hover:text-accent transition-colors ${location.pathname === '/buyer/dashboard' ? 'text-black' : 'text-gray-500'}`}>DASHBOARD</Link>
                  )}
                  <Link to="/inspection" className="text-xs font-medium text-gray-500 hover:text-accent transition-colors">INSPECTION SERVICE</Link>
                </>
              )}
            </nav>

            {/* Icons - sát góc phải (header full width) */}
            <div className="flex items-center gap-3 sm:gap-4 ml-auto flex-shrink-0 z-10">
              {isAuthenticated ? (
                <>
                  {/* BUYER: đầy đủ icon mua hàng */}
                  {userRole === 'BUYER' && (
                    <>
                      <Link to="/buyer/wishlist" className="text-accent hover:text-accent/80 transition-colors relative p-1 rounded-full hover:bg-gray-100" title="Wishlist">
                        <Heart size={20} />
                        {wishlistCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center">
                            {wishlistCount > 99 ? '99+' : wishlistCount}
                          </span>
                        )}
                      </Link>
                      <Link to="/buyer/orders" className="text-accent hover:text-accent/80 transition-colors relative p-1 rounded-full hover:bg-gray-100" title="Orders">
                        <ShoppingBag size={20} />
                        {orderCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center">
                            {orderCount > 99 ? '99+' : orderCount}
                          </span>
                        )}
                      </Link>
                      <Link to="/buyer/notifications" className="text-accent hover:text-accent/80 transition-colors relative p-1 rounded-full hover:bg-gray-100" title="Notifications">
                        <Bell size={20} />
                        {notificationUnread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center">
                            {notificationUnread > 99 ? '99+' : notificationUnread}
                          </span>
                        )}
                      </Link>
                      <Link to="/messages" className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:border-accent hover:text-accent rounded-full px-3 py-2 text-sm font-medium transition-colors" title="Tin nhắn">
                        <MessageCircle size={18} />
                        <span>Tin nhắn</span>
                      </Link>
                    </>
                  )}
                  {/* SELLER khi về trang mua hàng: giữ đầy đủ tính năng buyer (wishlist, đơn hàng, thông báo) + nút seller */}
                  {userRole === 'SELLER' && (
                    <>
                      <Link to="/messages" className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:border-accent hover:text-accent rounded-full px-3 py-2 text-sm font-medium transition-colors" title="Tin nhắn (chung)">
                        <MessageCircle size={18} />
                        <span>Tin nhắn</span>
                      </Link>
                      <Link to="/buyer/wishlist" className="text-accent hover:text-accent/80 transition-colors relative p-1 rounded-full hover:bg-gray-100" title="Danh sách yêu thích">
                        <Heart size={20} />
                        {wishlistCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center">
                            {wishlistCount > 99 ? '99+' : wishlistCount}
                          </span>
                        )}
                      </Link>
                      <Link to="/buyer/orders" className="text-accent hover:text-accent/80 transition-colors relative p-1 rounded-full hover:bg-gray-100" title="Đơn hàng">
                        <ShoppingBag size={20} />
                        {orderCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center">
                            {orderCount > 99 ? '99+' : orderCount}
                          </span>
                        )}
                      </Link>
                      <Link to="/buyer/notifications" className="text-accent hover:text-accent/80 transition-colors relative p-1 rounded-full hover:bg-gray-100" title="Thông báo">
                        <Bell size={20} />
                        {notificationUnread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center">
                            {notificationUnread > 99 ? '99+' : notificationUnread}
                          </span>
                        )}
                      </Link>
                      <Link to="/seller/add-product" className="flex items-center bg-black text-white hover:bg-gray-800 rounded-full px-4 py-2 text-sm font-medium transition-colors">
                        Post listing
                      </Link>
                    </>
                  )}
                  <div className="relative" ref={profileRef}>
                    <button
                      type="button"
                      onClick={() => setProfileOpen((v) => !v)}
                      className="text-accent hover:text-accent/80 transition-colors p-1 rounded-full hover:bg-gray-100"
                      title="Account"
                    >
                      <User size={20} />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                        {/* Header: avatar + name (click → profile) */}
                        <Link to={profileUrl} onClick={() => setProfileOpen(false)} className="block p-4 border-b border-gray-100 bg-gray-50/50 hover:bg-gray-100/50">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {userProfile?.avatar ? (
                                <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={24} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{userProfile?.fullName || 'Account'}</p>
                              <p className="text-xs text-gray-500">
                                {userRole === 'SELLER' ? 'Buyer / Seller' : userRole === 'BUYER' ? 'Buyer' : userRole ? String(userRole).toLowerCase() : ''}
                              </p>
                            </div>
                          </div>
                        </Link>
                        {/* Seller: hiện cho cả BUYER và SELLER. BUYER phải xác thực eKYC trước khi dùng */}
                        {(userRole === 'BUYER' || userRole === 'SELLER') && (
                          <div className="py-2 border-t border-gray-100">
                            <p className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</p>
                            <Link to={userRole === 'SELLER' ? '/seller/dashboard' : '/seller/kyc'} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50">
                              <Store size={18} className="text-gray-500 flex-shrink-0" />
                              <span className="flex-1">Cửa hàng / chuyên trang</span>
                              <ChevronRight size={16} className="text-gray-400" />
                            </Link>
                            <Link to={userRole === 'SELLER' ? '/seller/dashboard' : '/seller/kyc'} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50">
                              <LayoutDashboard size={18} className="text-gray-500 flex-shrink-0" />
                              <span className="flex-1">Quản lý tin</span>
                              <ChevronRight size={16} className="text-gray-400" />
                            </Link>
                          </div>
                        )}
                        {/* Khác */}
                        <div className="py-2 border-t border-gray-100">
                          <p className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Khác</p>
                          <Link to={profileUrl} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50">
                            <Settings size={18} className="text-gray-500 flex-shrink-0" />
                            <span className="flex-1">Cài đặt tài khoản</span>
                            <ChevronRight size={16} className="text-gray-400" />
                          </Link>
                          <button type="button" onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full">
                            <LogOut size={18} className="flex-shrink-0" />
                            <span className="flex-1 text-left">Đăng xuất</span>
                            <ChevronRight size={16} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-bold text-black hover:text-accent transition-colors">
                    Sign In
                  </Link>
                  <Link to="/register" className="text-sm font-bold bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
              
              <button className="md:hidden text-gray-800">
                <Menu size={24} />
              </button>
            </div>
          </div>
      </header>
        </>
      )}

      {/* Main Content */}
      <main className={isDashboardPage || isInspectorPage ? 'flex-grow' : 'flex-grow'}>
        {children}
      </main>

      {/* Footer - Hidden for Seller/Admin Pages */}
      {!isDashboardPage && (
      <footer className="bg-[#111] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 italic">VELO<span className="text-accent">BIKE</span></h3>
            <p className="text-gray-400 text-sm">The world's most trusted marketplace for premium pre-owned performance bicycles.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/marketplace" className="hover:text-white">Road Bikes</Link></li>
              <li><Link to="/marketplace" className="hover:text-white">MTB</Link></li>
              <li><Link to="/marketplace" className="hover:text-white">Triathlon</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Inspection Process</a></li>
              <li><a href="#" className="hover:text-white">Escrow Protection</a></li>
              <li><a href="#" className="hover:text-white">Shipping</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Newsletter</h4>
            <div className="flex">
              <input type="email" placeholder="Enter your email" className="bg-gray-800 text-white px-4 py-2 text-sm w-full focus:outline-none" />
              <button className="bg-accent px-4 py-2 font-bold text-sm hover:bg-red-600">JOIN</button>
            </div>
          </div>
        </div>
      </footer>
      )}
      {/* Chatbot - chỉ hiển thị cho buyer */}
      {userRole === 'BUYER' && <Chatbot />}
    </div>
  );
};