import React, { useState } from 'react';
import { Upload, DollarSign, Bike } from 'lucide-react';

export const Sell: React.FC = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto bg-white border border-gray-100 shadow-xl">
        {/* Progress Bar */}
        <div className="flex border-b border-gray-100">
          <div className={`flex-1 py-4 text-center text-sm font-bold border-b-2 ${step >= 1 ? 'border-accent text-black' : 'border-transparent text-gray-400'}`}>1. Details</div>
          <div className={`flex-1 py-4 text-center text-sm font-bold border-b-2 ${step >= 2 ? 'border-accent text-black' : 'border-transparent text-gray-400'}`}>2. Specs</div>
          <div className={`flex-1 py-4 text-center text-sm font-bold border-b-2 ${step >= 3 ? 'border-accent text-black' : 'border-transparent text-gray-400'}`}>3. Media & Price</div>
        </div>

        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">List your bike</h1>
            
            {/* Step 1: Basic Info */}
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold mb-2">Listing Title</label>
                    <input type="text" className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none" placeholder="e.g. 2022 Specialized Tarmac SL7" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Brand</label>
                        <select className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none bg-white">
                            <option>Specialized</option>
                            <option>Trek</option>
                            <option>Cervelo</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Year</label>
                        <input type="number" className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none" placeholder="2023" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Type</label>
                        <select className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none bg-white">
                            <option>Road</option>
                            <option>MTB</option>
                            <option>Gravel</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Size</label>
                        <select className="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none bg-white">
                            <option>52</option>
                            <option>54</option>
                            <option>56</option>
                            <option>M</option>
                            <option>L</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Simulated Step 2 & 3 content merged for UI demo */}
            <div className="mt-8 border-t border-gray-100 pt-8 space-y-6">
                 <div>
                    <label className="block text-sm font-bold mb-2">Upload Photos</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">High quality photos increase sales chance by 40%</p>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold mb-2">Asking Price (VND)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₫</span>
                        <input type="number" className="w-full border border-gray-300 pl-8 p-3 text-sm focus:border-black outline-none font-mono" placeholder="0" />
                    </div>
                 </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button className="bg-black text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-accent transition-colors">
                    Submit for Review
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};