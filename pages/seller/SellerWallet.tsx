import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerSidebar } from '../../components/SellerSidebar';

interface WalletBalance {
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  status: string;
  bankAccount: string;
  requestedAt: string;
  processedAt?: string;
}

export const SellerWallet: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch balance
      const balanceRes = await fetch('http://localhost:5000/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalance(data.data);
      }

      // Fetch transactions
      const transRes = await fetch('http://localhost:5000/api/wallet/transactions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (transRes.ok) {
        const data = await transRes.json();
        setTransactions(data.data || []);
      }

      // Fetch withdrawals history
      const withdrawRes = await fetch('http://localhost:5000/api/withdrawals', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (withdrawRes.ok) {
        const data = await withdrawRes.json();
        setWithdrawals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = (amount: number) => {
    return amount >= 1000000 ? 0 : 10000;
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawError('');
      const amount = parseInt(withdrawAmount);

      // Validation
      if (!amount || isNaN(amount)) {
        setWithdrawError('Vui lòng nhập số tiền hợp lệ');
        return;
      }

      if (amount < 50000) {
        setWithdrawError('Số tiền tối thiểu là 50,000 VNĐ');
        return;
      }

      if (!bankAccount.trim()) {
        setWithdrawError('Vui lòng nhập số tài khoản ngân hàng');
        return;
      }

      if (!balance || amount > balance.balance) {
        setWithdrawError('Số dư không đủ');
        return;
      }

      setWithdrawLoading(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:5000/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          bankAccount,
        }),
      });

      if (response.ok) {
        // Success
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setBankAccount('');
        // Refresh data
        await fetchWalletData();
      } else {
        const data = await response.json();
        setWithdrawError(data.message || 'Yêu cầu rút tiền thất bại');
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      setWithdrawError('Lỗi khi xử lý yêu cầu');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'COMPLETED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'FAILED': 'bg-red-100 text-red-800',
      'SUCCESS': 'bg-green-100 text-green-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <SellerSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your earnings and withdrawals</p>
            </div>

            {/* Profile Section */}
            <button 
              onClick={() => navigate('/seller/profile')}
              className="flex items-center gap-3 pl-4 border-l border-gray-300 hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500">SELLER</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center font-bold text-white text-sm">
                {user?.fullName?.charAt(0) || 'S'}
              </div>
            </button>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Available Balance */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 text-xs font-semibold">AVAILABLE BALANCE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(balance?.balance || 0)}</p>
            </div>

            {/* Total Earnings */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 text-xs font-semibold">TOTAL EARNINGS</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(balance?.totalEarnings || 0)}</p>
            </div>

            {/* Total Withdrawn */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 text-xs font-semibold">TOTAL WITHDRAWN</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(balance?.totalWithdrawn || 0)}</p>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Rút Tiền</h2>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Rút Tiền
              </button>
            </div>

            {/* Withdrawal Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông Tin Rút Tiền</h3>
              <ul className="text-xs space-y-2 text-gray-600">
                <li>• Số tiền tối thiểu: 50,000 VNĐ</li>
                <li>• Miễn phí nếu rút 1,000,000 VNĐ trở lên</li>
                <li>• Phí 10,000 VNĐ nếu rút dưới 1,000,000 VNĐ</li>
                <li>• Thời gian xử lý: 1-3 ngày làm việc</li>
              </ul>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Lịch Sử Rút Tiền</h2>
            {withdrawals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">NGÀY YÊU CẦU</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">SỐ TIỀN</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">PHÍ</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">TÀI KHOẢN NGÂN HÀNG</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900 font-semibold">
                          {new Date(withdrawal.requestedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-4 px-4 text-gray-900 font-semibold">{formatCurrency(withdrawal.amount)}</td>
                        <td className="py-4 px-4 text-gray-700">{formatCurrency(withdrawal.fee)}</td>
                        <td className="py-4 px-4 text-gray-700">{withdrawal.bankAccount}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusBadge(withdrawal.status)}`}>
                            {withdrawal.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Chưa có lịch sử rút tiền</p>
            )}
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Lịch Sử Giao Dịch</h2>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">NGÀY</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">LOẠI</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">SỐ TIỀN</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">MÔ TẢ</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900 font-semibold">
                          {new Date(transaction.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-4 px-4 text-gray-700">{transaction.type}</td>
                        <td className="py-4 px-4 text-gray-900 font-semibold">{formatCurrency(transaction.amount)}</td>
                        <td className="py-4 px-4 text-gray-700">{transaction.description}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusBadge(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Chưa có giao dịch nào</p>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rút Tiền</h2>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Số Tiền (VNĐ)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Nhập số tiền (tối thiểu 50,000)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              />
              {withdrawAmount && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Số tiền nhận: {formatCurrency(parseInt(withdrawAmount) - calculateFee(parseInt(withdrawAmount)))}</p>
                  <p>Phí: {formatCurrency(calculateFee(parseInt(withdrawAmount)))}</p>
                </div>
              )}
            </div>

            {/* Bank Account Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Số Tài Khoản Ngân Hàng</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Nhập số tài khoản"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* Error Message */}
            {withdrawError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{withdrawError}</p>
              </div>
            )}

            {/* Info */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                Số dư hiện tại: <span className="font-bold text-gray-900">{formatCurrency(balance?.balance || 0)}</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors font-medium"
              >
                {withdrawLoading ? 'Đang xử lý...' : 'Rút Tiền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
