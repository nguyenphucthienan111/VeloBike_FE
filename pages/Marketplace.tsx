import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { MOCK_LISTINGS, BRANDS } from '../constants';
import { BikeCard } from '../components/BikeCard';
import { BikeType } from '../types';

export const Marketplace: React.FC = () => {
  const [selectedType, setSelectedType] = useState<BikeType | 'ALL'>('ALL');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000000]);

  // Simulate filtered results
  const filteredBikes = MOCK_LISTINGS.filter(bike => {
    if (selectedType !== 'ALL' && bike.type !== selectedType) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(bike.brand)) return false;
    return true;
  });

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Marketplace <span className="text-gray-400 text-lg font-normal">({filteredBikes.length} bikes)</span></h1>
          <div className="flex gap-4">
             <div className="relative">
                <select className="appearance-none bg-white border border-gray-200 py-2 pl-4 pr-10 text-sm font-medium focus:outline-none focus:border-black">
                    <option>Sort by: Recommended</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Newest Listed</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none text-gray-500"/>
             </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            
            {/* Category Filter */}
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Filter size={16}/> Category</h3>
              <div className="space-y-2">
                {['ALL', ...Object.values(BikeType)].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedType === type ? 'bg-black border-black' : 'border-gray-300 group-hover:border-black'}`}>
                      {selectedType === type && <Check size={10} className="text-white"/>}
                    </div>
                    <input 
                      type="radio" 
                      name="type" 
                      className="hidden" 
                      checked={selectedType === type}
                      onChange={() => setSelectedType(type as any)} 
                    />
                    <span className={`text-sm ${selectedType === type ? 'font-bold' : 'text-gray-600'}`}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <h3 className="font-bold mb-4">Brands</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {BRANDS.map(brand => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                     <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedBrands.includes(brand) ? 'bg-black border-black' : 'border-gray-300 group-hover:border-black'}`}>
                      {selectedBrands.includes(brand) && <Check size={10} className="text-white"/>}
                    </div>
                    <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-black transition-colors">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range (Simplified) */}
            <div>
                <h3 className="font-bold mb-4">Price Range</h3>
                <div className="flex gap-2 mb-4">
                    <input type="text" placeholder="Min" className="w-full border border-gray-200 p-2 text-xs" />
                    <input type="text" placeholder="Max" className="w-full border border-gray-200 p-2 text-xs" />
                </div>
                <button className="w-full bg-gray-900 text-white py-2 text-xs font-bold uppercase hover:bg-accent transition-colors">Apply</button>
            </div>

          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredBikes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBikes.map(bike => (
                    <BikeCard key={bike.id} bike={bike} />
                ))}
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <p>No bikes found matching your criteria.</p>
                    <button onClick={() => {setSelectedType('ALL'); setSelectedBrands([]);}} className="text-accent underline mt-2">Clear all filters</button>
                </div>
            )}
            
            {/* Pagination Placeholder */}
            {filteredBikes.length > 0 && (
                <div className="mt-12 flex justify-center gap-2">
                    <button className="w-10 h-10 border border-black bg-black text-white font-bold flex items-center justify-center">1</button>
                    <button className="w-10 h-10 border border-gray-200 hover:border-black text-gray-600 font-bold flex items-center justify-center transition-colors">2</button>
                    <button className="w-10 h-10 border border-gray-200 hover:border-black text-gray-600 font-bold flex items-center justify-center transition-colors">3</button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};