import React, { useEffect, useState } from 'react';
import { ShoppingBag, Search, Menu, User, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage immediately
    const token = localStorage.getItem('accessToken');
    console.log('Layout initialized, accessToken exists:', !!token);
    return !!token;
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Hide header for seller dashboard pages
  const isSellerPage = location.pathname.startsWith('/seller/');

  useEffect(() => {
    // Check if user is logged in and get role
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      console.log('Checking auth, token:', !!token);
      setIsAuthenticated(!!token);
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserRole(user.role);
          console.log('User role:', user.role);
        } catch (e) {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Banner and Header - Hidden for Seller Pages */}
      {!isSellerPage && (
        <>
          {/* Top Banner for Trust */}
          <div className="bg-black text-white text-xs py-2 text-center font-medium tracking-wide">
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-accent" />
              VERIFIED INSPECTION & ESCROW PAYMENTS GUARANTEED
            </span>
          </div>

          {/* Navigation */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-extrabold tracking-tighter italic">
                VELO<span className="text-accent">BIKE</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              {userRole === 'SELLER' ? (
                <>
                  <Link to="/seller/dashboard" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname.includes('/seller/dashboard') ? 'text-black' : 'text-gray-500'}`}>DASHBOARD</Link>
                  <Link to="/seller/inventory" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname.includes('/seller/inventory') ? 'text-black' : 'text-gray-500'}`}>INVENTORY</Link>
                  <Link to="/seller/analytics" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname.includes('/seller/analytics') ? 'text-black' : 'text-gray-500'}`}>ANALYTICS</Link>
                  <Link to="/" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname === '/' ? 'text-black' : 'text-gray-500'}`}>HOME</Link>
                </>
              ) : (
                <>
                  <Link to="/" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname === '/' ? 'text-black' : 'text-gray-500'}`}>HOME</Link>
                  <Link to="/marketplace" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname === '/marketplace' ? 'text-black' : 'text-gray-500'}`}>MARKETPLACE</Link>
                  <Link to="/sell" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname === '/sell' ? 'text-black' : 'text-gray-500'}`}>SELL YOUR BIKE</Link>
                  <Link to="/inspection" className="text-sm font-medium text-gray-500 hover:text-accent transition-colors">INSPECTION SERVICE</Link>
                </>
              )}
            </nav>

            {/* Icons */}
            <div className="flex items-center space-x-6">
              {/* Search icon - only for Buyer or not authenticated */}
              {userRole !== 'SELLER' && (
                <button className="text-accent hover:text-accent/80 transition-colors">
                  <Search size={20} />
                </button>
              )}
              
              {isAuthenticated ? (
                <>
                  {/* Shopping bag - only for Buyer */}
                  {userRole === 'BUYER' && (
                    <Link to="/cart" className="text-accent hover:text-accent/80 transition-colors relative">
                      <ShoppingBag size={20} />
                      <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">1</span>
                    </Link>
                  )}
                  
                  {/* Profile icon - for both Buyer and Seller */}
                  <Link to={userRole === 'SELLER' ? '/seller/profile' : '/buyer/profile'} className="text-accent hover:text-accent/80 transition-colors">
                    <User size={20} />
                  </Link>
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
        </div>
      </header>
        </>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
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
    </div>
  );
};