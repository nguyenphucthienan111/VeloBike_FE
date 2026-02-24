import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  country?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
}

export const AdminCatalog: React.FC = () => {
  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [brandPagination, setBrandPagination] = useState({ total: 0, page: 1, limit: 50, pages: 0 });
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({ name: '', description: '', country: '', isActive: true });

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryPagination, setCategoryPagination] = useState({ total: 0, page: 1, limit: 50, pages: 0 });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '', isActive: true });

  useEffect(() => {
    fetchBrands();
  }, [brandPagination.page]);

  useEffect(() => {
    fetchCategories();
  }, [categoryPagination.page]);

  const fetchBrands = async () => {
    try {
      setBrandLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const params = new URLSearchParams({ page: brandPagination.page.toString(), limit: brandPagination.limit.toString() });
      const response = await fetch(`${API_BASE_URL}/admin/brands?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setBrands(data.data);
        setBrandPagination(prev => ({ ...prev, ...data.pagination }));
      } else setBrandError('Failed to load brands');
    } catch (err) {
      console.error('Error fetching brands:', err);
      setBrandError(isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : 'Error loading brands');
    } finally {
      setBrandLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const params = new URLSearchParams({ page: categoryPagination.page.toString(), limit: categoryPagination.limit.toString() });
      const response = await fetch(`${API_BASE_URL}/admin/categories?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
        setCategoryPagination(prev => ({ ...prev, ...data.pagination }));
      } else setCategoryError('Failed to load categories');
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategoryError(isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : 'Error loading categories');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Brand handlers
  const openAddBrand = () => {
    setEditingBrand(null);
    setBrandForm({ name: '', description: '', country: '', isActive: true });
    setShowBrandModal(true);
  };
  const openEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      description: brand.description || '',
      country: brand.country || '',
      isActive: brand.isActive,
    });
    setShowBrandModal(true);
  };
  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const url = editingBrand ? `${API_BASE_URL}/admin/brands/${editingBrand._id}` : `${API_BASE_URL}/admin/brands`;
      const body = editingBrand
        ? { ...brandForm }
        : { name: brandForm.name, description: brandForm.description || undefined, country: brandForm.country || undefined, isActive: brandForm.isActive };
      const response = await fetch(url, {
        method: editingBrand ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowBrandModal(false);
        fetchBrands();
      } else alert(data.message || 'Failed to save brand');
    } catch (err) {
      console.error('Error saving brand:', err);
      alert('Error saving brand');
    }
  };
  const handleBrandDelete = async (id: string) => {
    if (!window.confirm('Delete this brand?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/brands/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) fetchBrands();
      else {
        const data = await response.json();
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert('Error deleting brand');
    }
  };

  // Category handlers
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', icon: '', isActive: true });
    setShowCategoryModal(true);
  };
  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '', isActive: cat.isActive });
    setShowCategoryModal(true);
  };
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const url = editingCategory ? `${API_BASE_URL}/admin/categories/${editingCategory._id}` : `${API_BASE_URL}/admin/categories`;
      const body = { name: categoryForm.name, description: categoryForm.description || undefined, icon: categoryForm.icon || undefined, isActive: categoryForm.isActive };
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowCategoryModal(false);
        fetchCategories();
      } else alert(data.message || 'Failed to save category');
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Error saving category');
    }
  };
  const handleCategoryDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) fetchCategories();
      else {
        const data = await response.json();
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Error deleting category');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Catalog</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Section: Brands */}
            <section className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[320px]">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Brands</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Hãng xe (Cervélo, Trek, …)</p>
                </div>
                <button onClick={openAddBrand} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm shrink-0">
                  Add Brand
                </button>
              </div>
              <div className="p-5 flex-1 flex flex-col min-h-0">
                {brandError && <p className="text-red-600 mb-3 text-sm">{brandError}</p>}
                {brandLoading ? (
                  <p className="text-gray-500 text-sm">Đang tải...</p>
                ) : brands.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm text-center">Chưa có brand.</p>
                    <p className="text-gray-400 text-xs mt-1">Bấm &quot;Add Brand&quot; để thêm.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto flex-1 min-h-0">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Name</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Country</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Status</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brands.map((b) => (
                            <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900 text-sm">{b.name}</td>
                              <td className="px-3 py-2 text-gray-600 text-sm">{b.country || '—'}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                  {b.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button onClick={() => openEditBrand(b)} className="text-gray-600 hover:text-gray-900 mr-2 text-xs font-medium">Edit</button>
                                <button onClick={() => handleBrandDelete(b._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {brandPagination.pages > 1 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">Trang {brandPagination.page}/{brandPagination.pages} ({brandPagination.total})</div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Section: Categories */}
            <section className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[320px]">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Categories</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Loại xe (Road, MTB, Gravel, …)</p>
                </div>
                <button onClick={openAddCategory} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm shrink-0">
                  Add Category
                </button>
              </div>
              <div className="p-5 flex-1 flex flex-col min-h-0">
                {categoryError && <p className="text-red-600 mb-3 text-sm">{categoryError}</p>}
                {categoryLoading ? (
                  <p className="text-gray-500 text-sm">Đang tải...</p>
                ) : categories.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm text-center">Chưa có category.</p>
                    <p className="text-gray-400 text-xs mt-1">Bấm &quot;Add Category&quot; để thêm.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto flex-1 min-h-0">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Name</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Icon</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-700">Status</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((c) => (
                            <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-900 text-sm">{c.name}</td>
                              <td className="px-3 py-2 text-gray-600 text-sm">{c.icon || '—'}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                  {c.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button onClick={() => openEditCategory(c)} className="text-gray-600 hover:text-gray-900 mr-2 text-xs font-medium">Edit</button>
                                <button onClick={() => handleCategoryDelete(c._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {categoryPagination.pages > 1 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">Trang {categoryPagination.page}/{categoryPagination.pages} ({categoryPagination.total})</div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Brand modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBrandModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>
            <form onSubmit={handleBrandSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={brandForm.description} onChange={e => setBrandForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" value={brandForm.country} onChange={e => setBrandForm(f => ({ ...f, country: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={brandForm.isActive} onChange={e => setBrandForm(f => ({ ...f, isActive: e.target.checked }))} />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium">{editingBrand ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowBrandModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={categoryForm.description} onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (URL or class name)</label>
                <input type="text" value={categoryForm.icon} onChange={e => setCategoryForm(f => ({ ...f, icon: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Bike or https://..." />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={categoryForm.isActive} onChange={e => setCategoryForm(f => ({ ...f, isActive: e.target.checked }))} />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium">{editingCategory ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
