import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../constants';

export interface Listing {
  id: string;
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  generalInfo: {
    brand: string;
    model: string;
    year: number;
    size: string;
    condition: string;
  };
  pricing: {
    amount: number;
    currency: string;
    originalPrice?: number;
  };
  media: {
    thumbnails: string[];
    spin360Urls?: string[];
    videoUrl?: string;
  };
  sellerId: {
    _id?: string;
    fullName: string;
    reputation: number;
    badge?: string;
    planType?: string;
  };
  location: {
    type: string;
    coordinates: number[];
    address: string;
  };
  views: number;
  createdAt: string;
  boostedUntil?: string;
  boostCount?: number;
}

interface ListingsResponse {
  success: boolean;
  count: number;
  data: Listing[];
  message?: string;
}

interface Facets {
  types: string[];
  brands: string[];
  priceRange: { min: number; max: number };
}

interface UseListingsOptions {
  type?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

interface UseListingsReturn {
  listings: Listing[];
  loading: boolean;
  error: string | null;
  facets: Facets | null;
  totalCount: number;
  fetch: (options: UseListingsOptions) => Promise<void>;
  fetchFacets: () => Promise<void>;
}

export const useListings = (): UseListingsReturn => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchListings = useCallback(
    async (options: UseListingsOptions = {}) => {
      setLoading(true);
      setError(null);

      try {
        const {
          type,
          brand,
          minPrice,
          maxPrice,
          sortBy,
          keyword,
          page = 1,
          limit = 12,
        } = options;

        let url = `${API_BASE_URL}/listings`;
        const params = new URLSearchParams();

        // Add parameters
        if (type && type !== 'ALL') params.append('type', type);
        if (brand) params.append('brand', brand);
        if (minPrice) params.append('minPrice', minPrice.toString());
        if (maxPrice) params.append('maxPrice', maxPrice.toString());
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());

        // Use advanced search if we have keyword or specific sort
        if (keyword || sortBy) {
          url = `${API_BASE_URL}/listings/search/advanced`;
          if (keyword) params.append('keyword', keyword);
          
          // Map sort options
          const sortMap: { [key: string]: string } = {
            'recommended': 'views',
            'price_low': 'price_asc',
            'price_high': 'price_desc',
            'newest': 'newest',
          };
          
          if (sortBy && sortBy !== 'recommended') {
            params.append('sortBy', sortMap[sortBy] || 'newest');
          }
        }

        const queryString = params.toString();
        const fullUrl = `${url}${queryString ? '?' + queryString : ''}`;

        console.log('📡 Fetching listings:', fullUrl);

        const response = await fetch(fullUrl);
        const data: ListingsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || `Server error: ${response.status}`);
        }

        if (!data || !Array.isArray(data.data)) {
          throw new Error('Invalid response format: data is null or not an array');
        }

        setListings(data.data);
        setTotalCount(data.count || 0);
        console.log('✅ Listings fetched:', data.count, 'items');
      } catch (err: any) {
        const errorMsg = err.message || 'An error occurred while fetching listings';
        setError(errorMsg);
        console.error('❌ Fetch error:', errorMsg);
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchListingFacets = useCallback(async () => {
    try {
      console.log('📡 Fetching facets...');
      
      const response = await fetch(`${API_BASE_URL}/listings/search/facets`);
      const data = await response.json();

      if (data.data) {
        // Ensure brands is an array of strings
        const brands = Array.isArray(data.data.brands) 
          ? data.data.brands.filter((b: any) => typeof b === 'string')
          : [];
        
        setFacets({
          types: data.data.types || [],
          brands: brands,
          priceRange: data.data.priceRange || { min: 0, max: 500000000 },
        });
        console.log('✅ Facets fetched:', { brands });
      } else {
        // Fallback with default brands
        setFacets({
          types: ['ROAD', 'MTB', 'GRAVEL', 'TRIATHLON', 'E_BIKE'],
          brands: ['Specialized', 'Trek', 'Cervélo', 'Pinarello', 'Santa Cruz', 'Giant', 'Colnago'],
          priceRange: { min: 0, max: 500000000 },
        });
      }
    } catch (err: any) {
      console.error('❌ Error fetching facets:', err.message);
      // Use fallback facets
      setFacets({
        types: ['ROAD', 'MTB', 'GRAVEL', 'TRIATHLON', 'E_BIKE'],
        brands: ['Specialized', 'Trek', 'Cervélo', 'Pinarello', 'Santa Cruz', 'Giant', 'Colnago'],
        priceRange: { min: 0, max: 500000000 },
      });
    }
  }, []);

  return {
    listings,
    loading,
    error,
    facets,
    totalCount,
    fetch: fetchListings,
    fetchFacets: fetchListingFacets,
  };
};
