import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner } from '../../components/AdminPageLayout';

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

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAW: 'Withdraw',
  PAYMENT_HOLD: 'Payment Hold',
  PAYMENT_RELEASE: 'Payment Release',
  REFUND: 'Refund',
  PLATFORM_FEE: 'Platform Fee',
  INSPECTION_FEE: 'Inspection Fee',
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
};

const STAT_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  COMPLETED: { bg: 'bg-emerald-50', border: 'border-l-emerald-500', icon: 'text-emerald-600' },
  PENDING: { bg: 'bg-amber-50', border: 'border-l-amber-500', icon: 'text-amber-600' },
  FAILED: { bg: 'bg-red-50', border: 'border-l-red-500', icon: 'text-red-600' },
};

function getStatStyle(status: string) {
  return STAT_COLORS[status] || { bg: 'bg-slate-50', border: 'border-l-slate-400', icon: 'text-slate-600' };
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
          setPagination((prev) => ({ ...prev, ...data.pagination }));
        } else setError(data.message || 'Failed');
      })
      .catch((e) => setError(isConnectionError(e) ? CONNECTION_ERROR_MESSAGE : 'Error'))
      .finally(() => setLoading(false));
  }, [pagination.page, typeFilter, statusFilter]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN');
  const getUserDisplay = (t: Transaction) =>
    typeof t.userId === 'object'
      ? (t.userId as { fullName?: string; email?: string }).fullName ||
        (t.userId as { email?: string }).email ||
        '—'
      : String(t.userId);
  const getTypeLabel = (type: string) => TYPE_LABELS[type] || type;
  const getStatusClass = (status: string) => STATUS_STYLES[status] || 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Transactions" subtitle="View and filter all platform transactions" />

      {error && <AdminErrorBanner message={error} />}

        {/* Stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => {
              const style = getStatStyle(s._id);
              const Icon =
                s._id === 'COMPLETED'
                  ? ArrowDownLeft
                  : s._id === 'PENDING'
                    ? RefreshCw
                    : s._id === 'FAILED'
                      ? AlertCircle
                      : Receipt;
              return (
                <div
                  key={s._id}
                  className={`${style.bg} border border-slate-200/80 border-l-4 ${style.border} rounded-xl p-5 shadow-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s._id}</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{s.count} transactions</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-600">{formatCurrency(s.totalAmount || 0)}</p>
                    </div>
                    <Icon className={`h-8 w-8 shrink-0 opacity-80 ${style.icon}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <label className="flex items-center gap-2">
              <p className="text-sm text-slate-600">Type:</p>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-slate-300 focus:border-slate-400 outline-none min-w-[160px]"
              >
                <option value="">All</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-slate-300 focus:border-slate-400 outline-none min-w-[140px]"
              >
                <option value="">All</option>
                <option value="PENDING">PENDING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin mb-3" />
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Wallet className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No transactions</p>
              <p className="text-xs mt-1">Try changing the filter or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-700">User</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-700">Type</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-700">Amount</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-700">Status</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900">{getUserDisplay(t)}</td>
                      <td className="px-5 py-3.5 text-slate-700">{getTypeLabel(t.type)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{formatCurrency(t.amount)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusClass(t.status)}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">
              Page {pagination.page} / {pagination.pages}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
    </AdminPageLayout>
  );
};
