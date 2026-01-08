import React from 'react';
import { MOCK_LISTINGS } from '../constants';
import { Trash2, ShieldCheck, Truck, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Cart: React.FC = () => {
  // Simulating a cart with one item for UI demo
  const cartItem = MOCK_LISTINGS[0]; 
  const inspectionFee = 1500000;
  const shippingFee = 500000;
  const platformFee = cartItem.price * 0.02; // 2%
  const total = cartItem.price + inspectionFee + shippingFee + platformFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-gray-100 p-6 flex gap-6 items-start">
            <div className="w-32 h-32 bg-gray-100 flex-shrink-0">
              <img src={cartItem.imageUrl} alt={cartItem.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{cartItem.title}</h3>
                  <p className="text-sm text-gray-500 mb-1">{cartItem.year} • {cartItem.size}</p>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <ShieldCheck size={14} /> Inspection Passed (9.2/10)
                  </p>
                </div>
                <p className="font-bold text-lg">{formatPrice(cartItem.price)}</p>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-2 py-1">
                    <Truck size={14}/> Shipping to: Hanoi
                 </div>
                 <button className="text-red-500 text-sm hover:text-red-700 flex items-center gap-1">
                    <Trash2 size={14} /> Remove
                 </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 border border-blue-100 flex items-start gap-3">
             <Lock size={20} className="text-blue-600 mt-0.5" />
             <div>
                <h4 className="font-bold text-sm text-blue-800">Escrow Payment Protection</h4>
                <p className="text-xs text-blue-600 mt-1">Your payment is held securely by VeloBike. The seller is only paid after you receive the bike and confirm it matches the inspection report.</p>
             </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-gray-50 p-6 rounded-sm sticky top-24">
            <h2 className="font-bold text-lg mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(cartItem.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inspection Service</span>
                <span className="font-medium">{formatPrice(inspectionFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Professional Shipping</span>
                <span className="font-medium">{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (2%)</span>
                <span className="font-medium">{formatPrice(platformFee)}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-2xl text-accent">{formatPrice(total)}</span>
            </div>

            <button className="w-full bg-black text-white font-bold py-4 uppercase tracking-widest hover:bg-accent transition-colors shadow-lg">
              Proceed to Checkout
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              Secure Checkout via PayOS / Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};