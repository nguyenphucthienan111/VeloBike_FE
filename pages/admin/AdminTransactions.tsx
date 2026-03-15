import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

interface Transaction {
  _id: string;
  userId: { _id: string; fullName?: string; email?: string };
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export const AdminTransactions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<{ _id: string; count: number; totalAmount: number }[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString() });
    if (typeFilter) params.append('type', typeFilter);
    if (statusFilter) params.append('status', statusFilter);
    setLoading(true);
    fetch(`${API_BASE_URL}/transactions/admin/transactions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setList(data.data || []);
          setStats(data.stats || []);
          setPagination(prev => ({ ...prev, ...data.pagination }));
        } else setError(data.message || 'Failed');
      })
      .catch((e) => setError(isConnectionError(e) ? CONNECTION_ERROR_MESSAGE : 'Error'))
      .finally(() => setLoading(false));
  }, [pagination.page, typeFilter, statusFilter]);

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Giao dịch</h1>
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
              <div key={s._id} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">{s._id}</p>
                <p className="text-lg font-bold text-gray-900">{s.count} giao dịch</p>
                <p className="text-sm text-gray-600">{formatCurrency(s.totalAmount || 0)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex gap-4 flex-wrap">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Loại: Tất cả</option>
            <option value="DEPOSIT">DEPOSIT</option>
            <option value="WITHDRAW">WITHDRAW</option>
            <option value="PAYMENT_HOLD">PAYMENT_HOLD</option>
            <option value="PAYMENT_RELEASE">PAYMENT_RELEASE</option>
            <option value="REFUND">REFUND</option>
            <option value="PLATFORM_FEE">PLATFORM_FEE</option>
            <option value="INSPECTION_FEE">INSPECTION_FEE</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Trạng thái: Tất cả</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải...</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Không có giao dịch</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Loại</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Số tiền</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Trạng thái</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {typeof t.userId === 'object' ? (t.userId as any).fullName || (t.userId as any).email : t.userId}
                      </td>
                      <td className="px-4 py-3 font-medium">{t.type}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(t.amount)}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs">{t.status}</span></td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="px-4 py-2 border rounded-lg disabled:opacity-50">Trước</button>
            <span className="py-2">Trang {pagination.page} / {pagination.pages}</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="px-4 py-2 border rounded-lg disabled:opacity-50">Sau</button>
          </div>
        )}
      </div>
    </div>
  );
};
