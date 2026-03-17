import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

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
        alert(data.message || 'Approved');
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
        alert(data.message || 'Transfer confirmed');
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
      alert('Please enter a rejection reason');
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
        alert(data.message || 'Rejected');
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
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'APPROVED': case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED': case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Withdrawal requests" subtitle="Approve, complete, or reject withdrawal requests" />
      {error && <AdminErrorBanner message={error} />}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pending ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-blue-500">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.approved ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-emerald-500">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.completed ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-red-500">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.rejected ?? 0}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <AdminLoadingState message="Loading withdrawal requests..." />
        ) : withdrawals.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">No withdrawal requests yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-700">User / Bank</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-700">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-700">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-700">Requested at</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900">{typeof w.userId === 'object' ? (w.userId as any).fullName || (w.userId as any).email : w.userId}</p>
                      <p className="text-slate-500 text-xs">{w.bankAccount?.bankName} - {w.bankAccount?.accountNumber} - {w.bankAccount?.accountName}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{formatCurrency(w.netAmount)}</p>
                      <p className="text-xs text-slate-500">Fee: {formatCurrency(w.fee || 0)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(w.status)}`}>{w.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{formatDate(w.requestedAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                        {w.status === 'PENDING' && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleApprove(w._id)}
                              disabled={!!actionLoading}
                              className="text-green-600 font-medium hover:underline disabled:opacity-50"
                            >Approve</button>
                            <button
                              onClick={() => setRejectModal(w)}
                              disabled={!!actionLoading}
                              className="text-red-600 font-medium hover:underline disabled:opacity-50"
                            >Reject</button>
                          </div>
                        )}
                        {w.status === 'APPROVED' && (
                          <button
                            onClick={() => setCompleteModal(w)}
                            disabled={!!actionLoading}
                            className="text-blue-600 font-medium hover:underline disabled:opacity-50"
                          >Confirm transfer</button>
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
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">Page {pagination.page} / {pagination.pages}</span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      {/* Modal Complete */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Confirm transfer completed</h3>
            <p className="text-gray-600 mb-4">Amount: {formatCurrency(completeModal.netAmount)} → {completeModal.bankAccount?.accountNumber}</p>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Transfer proof link (optional)"
                value={completeForm.transferProof}
                onChange={(e) => setCompleteForm(f => ({ ...f, transferProof: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Note (optional)"
                value={completeForm.note}
                onChange={(e) => setCompleteForm(f => ({ ...f, note: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setCompleteModal(null); setCompleteForm({ transferProof: '', note: '' }); }} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleComplete} disabled={!!actionLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Reject withdrawal request</h3>
            <p className="text-gray-600 mb-4">Rejection reason (required):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              rows={3}
              placeholder="Enter reason..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleReject} disabled={!!actionLoading || !rejectReason.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};
