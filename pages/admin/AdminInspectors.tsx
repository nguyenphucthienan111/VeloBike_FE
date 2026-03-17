import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

interface Inspector {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const AdminInspectors: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInspectors();
  }, [pagination.page, isActiveFilter]);

  const fetchInspectors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (isActiveFilter !== '') params.append('isActive', isActiveFilter);

      const response = await fetch(`${API_BASE_URL}/admin/inspectors?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInspectors(data.data);
        setPagination(data.pagination);
      } else {
        setError('Failed to load inspectors');
      }
    } catch (error) {
      console.error('Error fetching inspectors:', error);
      setError(isConnectionError(error) ? CONNECTION_ERROR_MESSAGE : 'Error loading inspectors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Inspector management" subtitle="View inspector list and status" />
      {error && <AdminErrorBanner message={error} />}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <AdminLoadingState message="Loading inspectors..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Inspector</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Contact</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Joined at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspectors.map((inspector) => (
                    <tr key={inspector._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-slate-900">{inspector.fullName}</p>
                          <p className="text-slate-500">{inspector.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{inspector.phone || 'N/A'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                          inspector.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'
                        }`}>
                          {inspector.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {new Date(inspector.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50">
              <p className="text-sm text-slate-600">
                {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} inspectors
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminPageLayout>
  );
};
