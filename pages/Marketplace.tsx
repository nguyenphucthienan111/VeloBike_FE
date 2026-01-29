import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, Check, Search, Loader, AlertCircle } from 'lucide-react';
import { BikeCard } from '../components/BikeCard';
import { useListings } from '../hooks/useListings';

export const Marketplace: React.FC = () => {
  const { listings, loading, error, facets, fetch, fetchFacets } = useListings();

  // Filters state
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('500000000');
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(listings.length / itemsPerPage);

  // Fetch facets on mount
  useEffect(() => {
    fetchFacets();
  }, []);

  // Fetch listings when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch({
        type: selectedType,
        brand: selectedBrands[0] || undefined, // API supports single brand
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy !== 'recommended' ? sortBy : undefined,
        keyword: searchQuery || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [selectedType, selectedBrands, minPrice, maxPrice, sortBy, searchQuery, currentPage]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
    setCurrentPage(1);
  };

  const handlePriceApply = () => {
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedType('ALL');
    setSelectedBrands([]);
    setMinPrice('0');
    setMaxPrice('500000000');
    setSearchQuery('');
    setSortBy('recommended');
    setCurrentPage(1);
  };

  const getPaginatedListings = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return listings.slice(start, end).map((listing) => ({
      id: listing._id || listing.id,
      title: listing.title,
      brand: listing.generalInfo?.brand || 'Unknown',
      model: listing.generalInfo?.model || 'Unknown',
      year: listing.generalInfo?.year || 0,
      price: listing.pricing?.amount || 0,
      originalPrice: listing.pricing?.originalPrice || 0,
      type: listing.type,
      size: listing.generalInfo?.size || 'M',
      conditionScore: 8.5, // Mock score
      inspectionStatus: 'PASSED' as any,
      imageUrl: listing.media?.thumbnails?.[0] || 'https://via.placeholder.com/400',
      location: listing.location?.address || 'Unknown',
      specs: {
        groupset: listing.specs?.groupset || 'Standard',
      },
      sellerName: listing.sellerId?.fullName || 'Unknown',
      isVerified: !!listing.sellerId?.badge,
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Search and Sort */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold">Marketplace</h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading...' : `${listings.length} bikes available`}
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-4 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search bikes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-300 py-2 pl-4 pr-10 text-sm font-medium rounded-lg focus:outline-none focus:border-black cursor-pointer transition-colors"
              >
                <option value="recommended">Recommended</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest Listed</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 pointer-events-none text-gray-600" />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            
            {/* Category Filter */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Filter size={18} /> Category
              </h3>
              <div className="space-y-3">
                {['ALL', 'ROAD', 'MTB', 'GRAVEL', 'TRIATHLON', 'E_BIKE'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedType === type
                          ? 'bg-black border-black'
                          : 'border-gray-300 group-hover:border-black'
                      }`}
                    >
                      {selectedType === type && <Check size={12} className="text-white" />}
                    </div>
                    <input
                      type="radio"
                      name="type"
                      className="hidden"
                      checked={selectedType === type}
                      onChange={() => handleTypeChange(type)}
                    />
                    <span className={`text-sm ${selectedType === type ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}>
                      {type === 'E_BIKE' ? 'E-Bike' : type === 'ALL' ? 'All Categories' : type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {facets && Array.isArray(facets.brands) && facets.brands.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-bold mb-4">Brands</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {facets.brands
                    .map((brand: any) => {
                      // Extract brand name from object or string
                      return typeof brand === 'string' ? brand : (brand?.name || brand?._id || '');
                    })
                    .filter((brand: string) => brand) // Filter empty strings
                    .map((brand: string, index: number) => (
                    <label key={`${brand}-${index}`} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedBrands.includes(brand)
                            ? 'bg-black border-black'
                            : 'border-gray-300 group-hover:border-black'
                        }`}
                      >
                        {selectedBrands.includes(brand) && <Check size={12} className="text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span className="text-sm text-gray-600 group-hover:text-black transition-colors">
                        {brand}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-4">Price Range (VND)</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
                />
                <button
                  onClick={handlePriceApply}
                  className="w-full bg-black text-white py-2 rounded font-bold text-sm hover:bg-gray-900 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedType !== 'ALL' || selectedBrands.length > 0 || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
              >
                Clear All Filters
              </button>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <Loader className="animate-spin text-gray-400 mb-4" size={40} />
                <p className="text-gray-600">Loading bikes...</p>
              </div>
            ) : getPaginatedListings().length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {getPaginatedListings().map((bike) => (
                    <BikeCard key={bike.id || bike._id} bike={bike as any} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // Show first 5 pages
                        if (totalPages <= 5) return i + 1;
                        if (currentPage <= 3) return i + 1;
                        if (currentPage >= totalPages - 2) return totalPages - 4 + i;
                        return currentPage - 2 + i;
                      }).map((page, index) => (
                        <button
                          key={`page-${page}-${index}`}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded font-bold text-sm transition-colors ${
                            currentPage === page
                              ? 'bg-black text-white'
                              : 'border border-gray-300 hover:border-black'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center">
                <p className="text-gray-600 text-lg mb-4">No bikes found matching your criteria.</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
