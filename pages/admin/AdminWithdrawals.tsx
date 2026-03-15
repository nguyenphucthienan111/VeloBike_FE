import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

interface Withdrawal {
  _id: string;
  userId: { _id: string; fullName?: string; email?: string };
  amount: number;
  fee: number;
  netAmount: number;
  bankAccount: { bankName: string; accountNumber: string; accountName: string; branch?: string };
  status: string;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  transferProof?: string;
  note?: string;
}

interface Stats {
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
}

export const AdminWithdrawals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [completeModal, setCompleteModal] = useState<Withdrawal | null>(null);
  const [rejectModal, setRejectModal] = useState<Withdrawal | null>(null);
  const [completeForm, setCompleteForm] = useState({ transferProof: '', note: '' });
  const [rejectReason, setRejectReason] = useState('');

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString() });
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`${API_BASE_URL}/admin/withdrawals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawals(data.data || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else setError(data.message || 'Failed to load');
    } catch (e) {
      setError(isConnectionError(e) ? CONNECTION_ERROR_MESSAGE : 'Error loading withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/admin/withdrawals/statistics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.data) setStats(data.data);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/admin/withdrawals/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Đã duyệt');
        fetchWithdrawals();
        fetchStats();
      } else alert(data.message || 'Failed');
    } catch (e) {
      alert('Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!completeModal) return;
    setActionLoading(completeModal._id);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/admin/withdrawals/${completeModal._id}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferProof: completeForm.transferProof || undefined, note: completeForm.note || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Đã xác nhận chuyển khoản');
        setCompleteModal(null);
        setCompleteForm({ transferProof: '', note: '' });
        fetchWithdrawals();
        fetchStats();
      } else alert(data.message || 'Failed');
    } catch (e) {
      alert('Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    setActionLoading(rejectModal._id);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/admin/withdrawals/${rejectModal._id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Đã từ chối');
        setRejectModal(null);
        setRejectReason('');
        fetchWithdrawals();
        fetchStats();
      } else alert(data.message || 'Failed');
    } catch (e) {
      alert('Error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN');

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED': case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Yêu cầu rút tiền</h1>
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Chờ duyệt</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Đã duyệt</p>
              <p className="text-xl font-bold text-blue-600">{stats.approved ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Hoàn thành</p>
              <p className="text-xl font-bold text-green-600">{stats.completed ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">Từ chối</p>
              <p className="text-xl font-bold text-red-600">{stats.rejected ?? 0}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <label className="text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Đang tải...</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Chưa có yêu cầu rút tiền</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">User / Ngân hàng</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Số tiền</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Trạng thái</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Ngày yêu cầu</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{typeof w.userId === 'object' ? (w.userId as any).fullName || (w.userId as any).email : w.userId}</p>
                        <p className="text-gray-500 text-xs">{w.bankAccount?.bankName} - {w.bankAccount?.accountNumber} - {w.bankAccount?.accountName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{formatCurrency(w.netAmount)}</p>
                        <p className="text-xs text-gray-500">Phí: {formatCurrency(w.fee || 0)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(w.status)}`}>{w.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(w.requestedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {w.status === 'PENDING' && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleApprove(w._id)}
                              disabled={!!actionLoading}
                              className="text-green-600 font-medium hover:underline disabled:opacity-50"
                            >Duyệt</button>
                            <button
                              onClick={() => setRejectModal(w)}
                              disabled={!!actionLoading}
                              className="text-red-600 font-medium hover:underline disabled:opacity-50"
                            >Từ chối</button>
                          </div>
                        )}
                        {w.status === 'APPROVED' && (
                          <button
                            onClick={() => setCompleteModal(w)}
                            disabled={!!actionLoading}
                            className="text-blue-600 font-medium hover:underline disabled:opacity-50"
                          >Xác nhận đã chuyển</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >Trước</button>
            <span className="py-2">Trang {pagination.page} / {pagination.pages}</span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >Sau</button>
          </div>
        )}
      </div>

      {/* Modal Complete */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Xác nhận đã chuyển khoản</h3>
            <p className="text-gray-600 mb-4">Số tiền: {formatCurrency(completeModal.netAmount)} → {completeModal.bankAccount?.accountNumber}</p>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Link minh chứng chuyển khoản (tùy chọn)"
                value={completeForm.transferProof}
                onChange={(e) => setCompleteForm(f => ({ ...f, transferProof: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Ghi chú (tùy chọn)"
                value={completeForm.note}
                onChange={(e) => setCompleteForm(f => ({ ...f, note: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setCompleteModal(null); setCompleteForm({ transferProof: '', note: '' }); }} className="px-4 py-2 border rounded-lg">Hủy</button>
              <button onClick={handleComplete} disabled={!!actionLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Từ chối yêu cầu rút tiền</h3>
            <p className="text-gray-600 mb-4">Lý do từ chối (bắt buộc):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              rows={3}
              placeholder="Nhập lý do..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 border rounded-lg">Hủy</button>
              <button onClick={handleReject} disabled={!!actionLoading || !rejectReason.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">Từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
