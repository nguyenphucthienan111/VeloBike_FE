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

export interface UseCatalogReturn {
  categories: CatalogCategory[];
  brands: CatalogBrand[];
  getTypeForCategory: (slug: string, name?: string) => string | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useCatalog = (): UseCatalogReturn => {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
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

      setCategories(Array.isArray(catData?.data) ? catData.data : []);
      setBrands(Array.isArray(brandData?.data) ? brandData.data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load catalog');
      setCategories([]);
      setBrands([]);
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
