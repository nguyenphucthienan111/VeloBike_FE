import React, { useState, useEffect, useCallback } from 'react';
import { Filter, ChevronDown, Check, Search, Loader, AlertCircle } from 'lucide-react';
import { BikeCard } from '../components/BikeCard';
import { useListings } from '../hooks/useListings';
import { API_BASE_URL } from '../constants';

const BIKE_TYPES = ['ROAD', 'MTB', 'GRAVEL', 'TRIATHLON', 'E_BIKE'];
const BRAND_OTHER = '__OTHER__'; // Sentinel cho "Khác" – hãng không thuộc danh sách admin

/** Fallback khi không lấy được categories từ API */
const TYPE_TO_LABEL: Record<string, string> = {
  ROAD: 'ROAD', MTB: 'MTB', GRAVEL: 'GRAVEL', TRIATHLON: 'TRIATHLON', E_BIKE: 'E-Bike',
};

const FALLBACK_CATEGORIES = [
  { label: 'ROAD', value: 'ROAD' },
  { label: 'MTB', value: 'MTB' },
  { label: 'GRAVEL', value: 'GRAVEL' },
  { label: 'TRIATHLON', value: 'TRIATHLON' },
  { label: 'E-Bike', value: 'E_BIKE' },
];

export const Marketplace: React.FC = () => {
  const { listings, loading, error, facets, fetch, fetchFacets } = useListings();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistToggling, setWishlistToggling] = useState<string | null>(null);
  const [canWishlist, setCanWishlist] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('accessToken'));

  useEffect(() => {
    const check = () => setCanWishlist(!!localStorage.getItem('accessToken'));
    check();
    window.addEventListener('authStatusChanged', check);
    window.addEventListener('authChange', check);
    return () => {
      window.removeEventListener('authStatusChanged', check);
      window.removeEventListener('authChange', check);
    };
  }, []);

  const fetchWishlistIds = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setWishlistIds(new Set());
      return;
    }
    fetch(`${API_BASE_URL}/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          const ids = new Set((data.data as any[]).map((i: any) => i.listingId?._id).filter(Boolean));
          setWishlistIds(ids);
        } else setWishlistIds(new Set());
      })
      .catch(() => setWishlistIds(new Set()));
  }, []);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  useEffect(() => {
    const onRefresh = () => fetchWishlistIds();
    window.addEventListener('wishlistRefresh', onRefresh);
    return () => window.removeEventListener('wishlistRefresh', onRefresh);
  }, [fetchWishlistIds]);

  const handleWishlistToggle = async (listingId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setWishlistToggling(listingId);
    const inWishlist = wishlistIds.has(listingId);
    try {
      if (inWishlist) {
        const res = await fetch(`${API_BASE_URL}/wishlist/${listingId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setWishlistIds((prev) => {
            const next = new Set(prev);
            next.delete(listingId);
            return next;
          });
          window.dispatchEvent(new Event('wishlistRefresh'));
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        });
        if (res.ok) {
          setWishlistIds((prev) => new Set(prev).add(listingId));
          window.dispatchEvent(new Event('wishlistRefresh'));
        }
      }
    } finally {
      setWishlistToggling(null);
    }
  };

  // Brand options từ facets (không gọi admin API)
  const baseBrandOptions = (facets?.brands ?? [])
    .map((b: any) => (typeof b === 'string' ? b : b?.name || b?._id || ''))
    .filter((b: string) => b);
  const brandOptions = [...baseBrandOptions, BRAND_OTHER];
  const catalogBrandNames = baseBrandOptions.map((b) => b.toLowerCase().trim());

  // Filters state (đồng bộ: không chọn gì = hiện tất cả)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('500000000');
  const [sortBy, setSortBy] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(listings.length / itemsPerPage);

  // Category options: từ facets.types (không gọi admin categories)
  const categoryOptions =
    facets?.types?.length > 0
      ? facets.types.map((t: string) => ({ label: TYPE_TO_LABEL[t] || t, value: t }))
      : FALLBACK_CATEGORIES;

  // Type cho API: không chọn category nào = ALL; có chọn thì lấy type đầu tiên thuộc BikeType
  const typeForApi =
    selectedCategories.length === 0
      ? 'ALL'
      : selectedCategories.find((v) => BIKE_TYPES.includes(v)) ?? 'ALL';

  // Chỉ fetch facets (không gọi admin categories/brands) - giảm 2 API calls, tránh 429
  useEffect(() => {
    fetchFacets();
  }, [fetchFacets]);

  // Khi chọn "Khác" phải lấy tất cả rồi filter FE (API không hỗ trợ "brand not in")
  const hasOtherBrand = selectedBrands.includes(BRAND_OTHER);
  const brandForApi =
    hasOtherBrand || selectedBrands.length === 0
      ? undefined
      : selectedBrands[0];

  // Fetch listings when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch({
        type: typeForApi,
        brand: brandForApi,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy !== 'recommended' ? sortBy : undefined,
        keyword: searchQuery || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [typeForApi, brandForApi, selectedBrands, minPrice, maxPrice, sortBy, searchQuery, currentPage]);

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
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
    setSelectedCategories([]);
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

    // Filter "Khác" (brand not in catalog) on FE when selected
    const isOtherBrand = (brand: string) => {
      const b = (brand || '').toLowerCase().trim();
      return !catalogBrandNames.some((c) => c === b);
    };
    const brandFilter = (listing: any) => {
      const brand = listing?.generalInfo?.brand || '';
      if (selectedBrands.length === 0) return true;
      if (hasOtherBrand && selectedBrands.length === 1)
        return isOtherBrand(brand);
      if (hasOtherBrand) {
        const realBrands = selectedBrands.filter((b) => b !== BRAND_OTHER);
        return realBrands.some((rb) => rb === brand) || isOtherBrand(brand);
      }
      return selectedBrands.includes(brand);
    };

    // Filter and map listings safely
    const validListings = listings
      .filter((listing) => {
        if (!listing || !listing._id) return false;
        // Filter status
        const allowedStatuses = ['PUBLISHED', 'RESERVED', 'SOLD', 'IN_INSPECTION'];
        if (!allowedStatuses.includes(listing.status)) return false;
        // Check sellerId safely
        if (!listing.sellerId) return false;
        if (typeof listing.sellerId === 'object' && !listing.sellerId._id && !listing.sellerId.fullName) {
          return false;
        }
        return brandFilter(listing);
      })
      .slice(start, end)
      .map((listing) => {
        // Safely extract sellerId info
        let sellerName = 'Unknown';
        let isVerified = false;
        
        if (listing.sellerId) {
          if (typeof listing.sellerId === 'object') {
            sellerName = listing.sellerId.fullName || 'Unknown';
            isVerified = !!listing.sellerId.badge;
          } else {
            sellerName = 'Unknown';
          }
        }
        
        const hasInspectionScore = typeof listing.inspectionScore === 'number' && listing.inspectionScore > 0;
        return {
          id: listing._id || listing.id || '',
          title: listing.title || 'Untitled',
          brand: listing.generalInfo?.brand || 'Unknown',
          model: listing.generalInfo?.model || 'Unknown',
          year: listing.generalInfo?.year || 0,
          price: listing.pricing?.amount || 0,
          originalPrice: listing.pricing?.originalPrice || listing.pricing?.amount || 0,
          type: listing.type || 'ROAD',
          status: listing.status || 'PUBLISHED',
          size: listing.generalInfo?.size || 'M',
          conditionScore: hasInspectionScore ? listing.inspectionScore : 0,
          inspectionStatus: hasInspectionScore ? 'PASSED' : 'PENDING',
          inspectionRequired: !!listing.inspectionRequired,
          imageUrl: listing.media?.thumbnails?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext fill='%239ca3af' x='200' y='200' font-size='20' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E",
          location: listing.location?.address || 'Unknown',
          specs: {
            groupset: listing.specs?.groupset || 'Standard',
          },
          sellerName,
          isVerified,
        };
      })
      .filter((bike) => bike.id); // Filter out any bikes without ID
    
    return validListings;
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
            
            {/* Category Filter - đồng bộ với Brands: checkbox, không chọn = hiện tất cả */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Filter size={18} /> Category
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {categoryOptions.map((opt, idx) => (
                  <label key={`cat-${idx}-${opt.value}`} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedCategories.includes(opt.value)
                          ? 'bg-black border-black'
                          : 'border-gray-300 group-hover:border-black'
                      }`}
                    >
                      {selectedCategories.includes(opt.value) && <Check size={12} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedCategories.includes(opt.value)}
                      onChange={() => toggleCategory(opt.value)}
                    />
                    <span className={`text-sm ${selectedCategories.includes(opt.value) ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter - lấy từ Admin Catalog API (đồng bộ với Category) */}
            {brandOptions.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-bold mb-4">Brands</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {brandOptions.map((brand: string, index: number) => (
                    <label key={brand === BRAND_OTHER ? BRAND_OTHER : `${brand}-${index}`} className="flex items-center gap-3 cursor-pointer group">
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
                        {brand === BRAND_OTHER ? 'Khác' : brand}
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
            {(selectedCategories.length > 0 || selectedBrands.length > 0 || searchQuery) && (
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
                  {getPaginatedListings()
                    .filter((bike) => bike && bike.id) // Extra safety check
                    .map((bike) => (
                      <BikeCard
                        key={bike.id}
                        bike={bike as any}
                        inWishlist={wishlistIds.has(bike.id)}
                        onWishlistToggle={canWishlist ? handleWishlistToggle : undefined}
                      />
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
