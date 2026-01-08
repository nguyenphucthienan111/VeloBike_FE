import React from 'react';
import { ShoppingBag, Search, Menu, User, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white">
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
              <Link to="/" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname === '/' ? 'text-black' : 'text-gray-500'}`}>HOME</Link>
              <Link to="/marketplace" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname === '/marketplace' ? 'text-black' : 'text-gray-500'}`}>MARKETPLACE</Link>
              <Link to="/sell" className={`text-sm font-medium hover:text-accent transition-colors ${location.pathname === '/sell' ? 'text-black' : 'text-gray-500'}`}>SELL YOUR BIKE</Link>
              <Link to="/inspection" className="text-sm font-medium text-gray-500 hover:text-accent transition-colors">INSPECTION SERVICE</Link>
            </nav>

            {/* Icons */}
            <div className="flex items-center space-x-6">
              <button className="text-gray-400 hover:text-black transition-colors">
                <Search size={20} />
              </button>
              
              <Link to="/cart" className="text-gray-400 hover:text-black transition-colors relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">1</span>
              </Link>
              
              <Link to="/login" className="text-gray-400 hover:text-black transition-colors">
                <User size={20} />
              </Link>
              
              <button className="md:hidden text-gray-800">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

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