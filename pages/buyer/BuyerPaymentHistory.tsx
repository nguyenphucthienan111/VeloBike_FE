import React, { useEffect, useState } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { handleSessionExpired } from '../../utils/auth';

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  WITHDRAW: 'Rút tiền',
  PAYMENT_HOLD: 'Tạm giữ thanh toán',
  PAYMENT_RELEASE: 'Giải phóng thanh toán',
  REFUND: 'Hoàn tiền',
  PLATFORM_FEE: 'Phí nền tảng',
  INSPECTION_FEE: 'Phí kiểm định',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
};

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  relatedOrderId?: { _id: string; financials?: { totalAmount?: number } };
  createdAt: string;
}

export const BuyerPaymentHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; pages: number } | null>(null);

  const limit = 20;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Vui lòng đăng nhập để xem lịch sử thanh toán.');
          setLoading(false);
          return;
        }
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        const res = await fetch(`${API_BASE_URL}/transactions/my-transactions?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.message || 'Không tải được lịch sử thanh toán.';
          if (res.status === 401 && (msg.includes('authorized') || msg.includes('token'))) {
            handleSessionExpired();
            return;
          }
          setError(msg);
          setTransactions([]);
          return;
        }
        setTransactions(Array.isArray(data.data) ? data.data : []);
        setPagination(data.pagination || null);
      } catch (err: unknown) {
        setError(isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : (err as Error).message || 'Không tải được lịch sử thanh toán.');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [page]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const isOutflow = (type: string) =>
    ['PAYMENT_HOLD', 'WITHDRAW', 'PLATFORM_FEE', 'INSPECTION_FEE'].includes(type);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Lịch sử thanh toán</h1>
      {loading && (
        <p className="text-gray-500">Đang tải...</p>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-800">
          <p className="text-sm">{error}</p>
        </div>
      )}
      {!loading && !error && transactions.length === 0 && (
        <p className="text-gray-500">Chưa có giao dịch nào.</p>
      )}
      {!loading && !error && transactions.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{TYPE_LABELS[t.type] || t.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{t.description}</td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${isOutflow(t.type) ? 'text-red-600' : 'text-green-600'}`}>
                      {isOutflow(t.type) ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        t.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        t.status === 'FAILED' || t.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {STATUS_LABELS[t.status] || t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Trang {pagination.page} / {pagination.pages} ({pagination.total} giao dịch)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
