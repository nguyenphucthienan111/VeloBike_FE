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

export const AdminBrands: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 0 });
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: '', description: '', country: '', website: '', logo: '', isActive: true });

  useEffect(() => {
    fetchBrands();
  }, [pagination.page]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await fetch(`${API_BASE_URL}/admin/brands?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBrands(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else {
        setError('Failed to load brands');
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError(isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : 'Error loading brands');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingBrand(null);
    setForm({ name: '', description: '', country: '', website: '', logo: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name,
      description: brand.description || '',
      country: brand.country || '',
      website: brand.website || '',
      logo: brand.logo || '',
      isActive: brand.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const url = editingBrand
        ? `${API_BASE_URL}/admin/brands/${editingBrand._id}`
        : `${API_BASE_URL}/admin/brands`;
      const method = editingBrand ? 'PUT' : 'POST';
      const body = editingBrand
        ? { ...form, logo: form.logo || undefined }
        : { name: form.name, description: form.description || undefined, country: form.country || undefined, website: form.website || undefined, logo: form.logo || undefined, isActive: form.isActive };

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowModal(false);
        fetchBrands();
      } else {
        alert(data.message || 'Failed to save brand');
      }
    } catch (err) {
      console.error('Error saving brand:', err);
      alert('Error saving brand');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this brand?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/brands/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchBrands();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert('Error deleting brand');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
            >
              Add Brand
            </button>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : brands.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              No brands yet. Click &quot;Add Brand&quot; to create one.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Country</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                      <td className="px-4 py-3 text-gray-600">{b.country || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(b)} className="text-gray-600 hover:text-gray-900 mr-3 text-sm font-medium">Edit</button>
                        <button onClick={() => handleDelete(b._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-4 text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} brands)
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (URL)</label>
                <input
                  type="url"
                  value={form.logo}
                  onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://..."
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium">
                  {editingBrand ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
