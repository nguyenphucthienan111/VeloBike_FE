import React from 'react';
import { Package, Settings, LogOut, Clock, CheckCircle } from 'lucide-react';
import { MOCK_LISTINGS } from '../constants';

export const UserProfile: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 p-6 text-center mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h2 className="font-bold text-lg">Nguyen Van A</h2>
                <p className="text-sm text-gray-500">Member since 2023</p>
            </div>
            
            <nav className="space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-black text-white text-sm font-medium">
                    <Package size={18} /> My Orders
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors">
                    <Settings size={18} /> Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-red-50 text-red-500 text-sm font-medium transition-colors">
                    <LogOut size={18} /> Sign Out
                </button>
            </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
            <h1 className="text-2xl font-bold mb-6">Order History</h1>
            
            <div className="space-y-4">
                {/* Mock Order 1 */}
                <div className="bg-white border border-gray-200 p-6 flex flex-col md:flex-row gap-6">
                    <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                         <img src={MOCK_LISTINGS[0].imageUrl} className="w-full h-full object-cover"/>
                    </div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Order #VB-8821 • Oct 24, 2023</div>
                                <h3 className="font-bold text-lg">{MOCK_LISTINGS[0].title}</h3>
                            </div>
                            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <Clock size={12}/> IN INSPECTION
                            </span>
                        </div>
                        
                        <div className="mt-4 flex gap-8 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs">Total</span>
                                <span className="font-bold">187.000.000 ₫</span>
                            </div>
                             <div>
                                <span className="text-gray-500 block text-xs">Status</span>
                                <span className="text-black font-medium">Mechanic checking frame</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                        <button className="px-4 py-2 border border-black text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors">View Report</button>
                    </div>
                </div>

                {/* Mock Order 2 */}
                <div className="bg-white border border-gray-200 p-6 flex flex-col md:flex-row gap-6 opacity-70">
                    <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                         <img src={MOCK_LISTINGS[1].imageUrl} className="w-full h-full object-cover grayscale"/>
                    </div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <div className="text-xs text-gray-500 mb-1">Order #VB-1029 • Aug 10, 2023</div>
                                <h3 className="font-bold text-lg">{MOCK_LISTINGS[1].title}</h3>
                            </div>
                             <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle size={12}/> COMPLETED
                            </span>
                        </div>
                        <div className="mt-4 text-sm">
                             <span className="text-gray-500">Delivered on Aug 15, 2023</span>
                        </div>
                    </div>
                     <div className="flex flex-col justify-center gap-2">
                        <button className="px-4 py-2 border border-gray-300 text-gray-500 text-xs font-bold uppercase hover:border-black hover:text-black transition-colors">Invoice</button>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};