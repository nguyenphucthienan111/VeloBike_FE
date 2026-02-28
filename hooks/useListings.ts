import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../constants';

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
    reputation?: number;
    badge?: string;
    planType?: string;
  } | null;
  location: {
    type: string;
    coordinates: number[];
    address: string;
  };
  specs?: {
    groupset?: string;
    frameMaterial?: string;
    wheelset?: string;
    brakeType?: string;
    suspensionType?: string;
    travelFront?: string;
    travelRear?: string;
    wheelSize?: string;
    weight?: number;
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
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.message || `Server error: ${response.status}`);
        }
        
        const data: ListingsResponse = await response.json();
        console.log('📦 Raw API response:', data);

        if (!data) {
          throw new Error('Invalid response: data is null');
        }

        if (!Array.isArray(data.data)) {
          console.error('❌ Invalid response format:', data);
          throw new Error('Invalid response format: data.data is not an array');
        }
        
        console.log('📦 Total listings from API:', data.data.length);

        // Filter out listings with null or invalid sellerId
        // Note: BE already filters by PUBLISHED status, but we check again for safety
        const validListings = data.data
          .filter((listing: any) => {
            try {
              if (!listing || !listing._id) {
                console.warn('⚠️ Listing missing _id:', listing);
                return false;
              }
              
              // Accept PUBLISHED listings (BE should already filter, but check anyway)
              // Also accept PENDING_APPROVAL for testing if no PUBLISHED listings exist
              if (listing.status && listing.status !== 'PUBLISHED' && listing.status !== 'PENDING_APPROVAL') {
                return false; // Skip non-published/non-pending listings
              }
              
              // sellerId can be null, object, or string/ObjectId - check safely
              if (!listing.sellerId) {
                console.warn('⚠️ Listing missing sellerId:', listing._id, 'Status:', listing.status);
                // Allow listings without sellerId for now (might be test data)
                // return false;
              }
              
              // If sellerId is object, check if it has _id or fullName
              if (listing.sellerId && typeof listing.sellerId === 'object' && listing.sellerId !== null) {
                const hasValidSeller = listing.sellerId?._id || listing.sellerId?.fullName || listing.sellerId?.id;
                if (!hasValidSeller) {
                  console.warn('⚠️ Listing has invalid sellerId object:', listing._id, listing.sellerId);
                  // Allow for now, will handle in mapping
                }
              }
              
              return true;
            } catch (err) {
              console.error('❌ Error filtering listing:', listing?._id, err);
              return false;
            }
          })
          .map((listing: any) => {
            try {
              // Normalize sellerId structure - check null safely
              if (listing?.sellerId && typeof listing.sellerId === 'object' && listing.sellerId !== null) {
                // Ensure sellerId has _id - use optional chaining
                if (!listing.sellerId?._id && listing.sellerId?.id) {
                  listing.sellerId._id = listing.sellerId.id;
                }
              }
              // Ensure listing has all required fields
              if (!listing?._id) {
                console.warn('⚠️ Listing missing _id after mapping:', listing);
                return null;
              }
              return listing;
            } catch (err) {
              console.error('❌ Error mapping listing:', listing?._id, err);
              return null;
            }
          })
          .filter((listing: any) => listing !== null && listing?._id); // Remove any null entries from map errors
        
        setListings(validListings);
        setTotalCount(validListings.length);
        console.log('✅ Valid listings after filter:', validListings.length, 'items');
        if (validListings.length > 0) {
          console.log('📦 Sample listing:', validListings[0]);
        } else {
          console.warn('⚠️ No valid listings found. Total from API:', data.data.length);
          console.log('📦 Sample raw listing:', data.data[0]);
        }
      } catch (err: any) {
        const errorMsg = isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : (err.message || 'An error occurred while fetching listings');
        setError(errorMsg);
        if (!isConnectionError(err)) console.error('❌ Fetch error:', err.message);
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
        // BE trả về {_id, count}[] - extract _id thành string[]
        const toStrings = (arr: any[]) =>
          Array.isArray(arr)
            ? arr.map((x: any) => (typeof x === 'string' ? x : (x?.name ?? x?._id ?? ''))).filter(Boolean)
            : [];
        const brands = toStrings(data.data.brands || []);
        const types = toStrings(data.data.types || []);

        setFacets({
          types: types.length ? types : ['ROAD', 'MTB', 'GRAVEL', 'TRIATHLON', 'E_BIKE'],
          brands: brands.length ? brands : ['Specialized', 'Trek', 'Cervélo', 'Pinarello', 'Santa Cruz', 'Giant', 'Colnago'],
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
      // Connection refused → dùng fallback, không log rác
      if (!isConnectionError(err)) console.error('❌ Error fetching facets:', err.message);
      // Fallback facets
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
