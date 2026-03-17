import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../constants';

export interface CatalogCategory {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface CatalogBrand {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

/** Maps category slug to listing type (BikeType) for filter API */
const SLUG_TO_TYPE: Record<string, string> = {
  road: 'ROAD',
  mtb: 'MTB',
  gravel: 'GRAVEL',
  triathlon: 'TRIATHLON',
  'e-bike': 'E_BIKE',
  e_bike: 'E_BIKE',
};

/** Fallback categories when API returns no data */
const FALLBACK_CATEGORIES: CatalogCategory[] = [
  { _id: 'road', name: 'Road Bike', slug: 'road', isActive: true },
  { _id: 'mtb', name: 'Mountain Bike', slug: 'mtb', isActive: true },
  { _id: 'triathlon', name: 'Triathlon', slug: 'triathlon', isActive: true },
  { _id: 'e-bike', name: 'E-Bike', slug: 'e-bike', isActive: true },
  { _id: 'gravel', name: 'Gravel Bike', slug: 'gravel', isActive: true },
];

/** Fallback brands when API returns no data */
const FALLBACK_BRANDS: CatalogBrand[] = [
  { _id: 'specialized', name: 'Specialized', slug: 'specialized', isActive: true },
  { _id: 'trek', name: 'Trek', slug: 'trek', isActive: true },
  { _id: 'giant', name: 'Giant', slug: 'giant', isActive: true },
  { _id: 'cannondale', name: 'Cannondale', slug: 'cannondale', isActive: true },
  { _id: 'scott', name: 'Scott', slug: 'scott', isActive: true },
  { _id: 'bianchi', name: 'Bianchi', slug: 'bianchi', isActive: true },
  { _id: 'cervelo', name: 'Cervélo', slug: 'cervelo', isActive: true },
  { _id: 'pinarello', name: 'Pinarello', slug: 'pinarello', isActive: true },
  { _id: 'merida', name: 'Merida', slug: 'merida', isActive: true },
  { _id: 'cube', name: 'Cube', slug: 'cube', isActive: true },
  { _id: 'santa-cruz', name: 'Santa Cruz', slug: 'santa-cruz', isActive: true },
  { _id: 'yeti', name: 'Yeti', slug: 'yeti', isActive: true },
  { _id: 'colnago', name: 'Colnago', slug: 'colnago', isActive: true },
  { _id: 'look', name: 'Look', slug: 'look', isActive: true },
  { _id: 'focus', name: 'Focus', slug: 'focus', isActive: true },
];

export interface UseCatalogReturn {
  categories: CatalogCategory[];
  brands: CatalogBrand[];
  getTypeForCategory: (slug: string, name?: string) => string | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useCatalog = (): UseCatalogReturn => {
  const [categories, setCategories] = useState<CatalogCategory[]>(FALLBACK_CATEGORIES);
  const [brands, setBrands] = useState<CatalogBrand[]>(FALLBACK_BRANDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTypeForCategory = useCallback((slug: string, name?: string): string | null => {
    const normalized = slug?.toLowerCase().trim();
    const fromSlug = SLUG_TO_TYPE[normalized];
    if (fromSlug) return fromSlug;
    // Fallback: name khớp chính xác BikeType
    const fromName = name && ['ROAD', 'MTB', 'GRAVEL', 'TRIATHLON', 'E_BIKE'].includes(name) ? name : null;
    return fromName;
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/categories?page=1&limit=100&isActive=true`),
        fetch(`${API_BASE_URL}/admin/brands?page=1&limit=100`),
      ]);

      const catData = catRes.ok ? await catRes.json() : null;
      const brandData = brandRes.ok ? await brandRes.json() : null;

      setCategories(Array.isArray(catData?.data) && catData.data.length > 0 ? catData.data : FALLBACK_CATEGORIES);
      setBrands(Array.isArray(brandData?.data) && brandData.data.length > 0 ? brandData.data : FALLBACK_BRANDS);
    } catch (err: any) {
      setError(err?.message || 'Failed to load catalog');
      setCategories(FALLBACK_CATEGORIES);
      setBrands(FALLBACK_BRANDS);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    brands,
    getTypeForCategory,
    loading,
    error,
    fetch: fetchCatalog,
  };
};
