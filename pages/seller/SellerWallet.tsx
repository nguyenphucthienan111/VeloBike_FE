import React, { useState } from 'react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  date: string;
  status: string;
  bankName: string;
}

export const SellerWallet: React.FC = () => {
  const [balance, setBalance] = useState(125500000);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  const [transactions] = useState<Transaction[]>([
    { id: '1', type: 'Sale', amount: 15500000, date: '28/01/2026', status: 'Completed' },
    { id: '2', type: 'Sale', amount: 12300000, date: '27/01/2026', status: 'Completed' },
    { id: '3', type: 'Withdrawal', amount: 5000000, date: '26/01/2026', status: 'Pending' },
    { id: '4', type: 'Sale', amount: 10800000, date: '25/01/2026', status: 'Completed' },
    { id: '5', type: 'Fee', amount: 50000, date: '24/01/2026', status: 'Completed' },
  ]);

  const [withdrawals] = useState<WithdrawalRequest[]>([
    { id: '1', amount: 5000000, date: '26/01/2026', status: 'Pending', bankName: 'Vietcombank' },
    { id: '2', amount: 3000000, date: '20/01/2026', status: 'Completed', bankName: 'Techcombank' },
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount < 50000) {
      alert('Số tiền tối thiểu là 50,000 VNĐ');
      return;
    }
    if (amount > balance) {
      alert('Số dư không đủ');
      return;
    }
    alert('Yêu cầu rút tiền thành công! Vui lòng đợi xác nhận từ admin.');
    setWithdrawAmount('');
    setShowWithdrawForm(false);
  };

  const calculateFee = (amount: number) => {
    return amount >= 1000000 ? 0 : 10000;
  };

  const withdrawAmount_num = parseFloat(withdrawAmount) || 0;
  const fee = calculateFee(withdrawAmount_num);
  const totalAmount = withdrawAmount_num + fee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Ví Của Tôi</h1>
          <p className="text-gray-600 mt-1">Quản lý số dư và rút tiền</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-accent to-red-600 rounded-lg shadow-lg p-8 text-white mb-8">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-red-100 text-sm mb-2">Số Dư Ví</p>
                <p className="text-5xl font-bold">{formatCurrency(balance)}</p>
              </div>
              <div className="text-5xl">💳</div>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-red-400">
            <div>
              <p className="text-red-100 text-sm">Có Thể Rút</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(balance)}</p>
            </div>
            <div>
              <p className="text-red-100 text-sm">Đang Chờ</p>
              <p className="text-2xl font-bold mt-1">0 VNĐ</p>
            </div>
            <div>
              <p className="text-red-100 text-sm">Tổng Doanh Thu</p>
              <p className="text-2xl font-bold mt-1">356.2M</p>
            </div>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Rút Tiền</h2>
            {!showWithdrawForm && (
              <button
                onClick={() => setShowWithdrawForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                💸 Rút Tiền
              </button>
            )}
          </div>

          {showWithdrawForm ? (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Số Tiền Rút (tối thiểu 50,000 VNĐ)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Nhập số tiền"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Ngân Hàng Nhận
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                    <option>Vietcombank - 1234567890</option>
                    <option>Techcombank - 0987654321</option>
                    <option>Agribank - 5555666677</option>
                  </select>
                </div>

                {/* Fee Info */}
                {withdrawAmount_num > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Số tiền:</span>
                        <span className="font-medium">{formatCurrency(withdrawAmount_num)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Phí:</span>
                        <span className={`font-medium ${fee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {fee === 0 ? 'Miễn phí' : formatCurrency(fee)}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold text-gray-900">Tổng Cộng:</span>
                        <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount_num || withdrawAmount_num < 50000}
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xác Nhận Rút Tiền
                  </button>
                  <button
                    onClick={() => {
                      setShowWithdrawForm(false);
                      setWithdrawAmount('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transactions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📋 Lịch Sử Giao Dịch
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-white ${
                      tx.type === 'Sale' ? 'bg-green-500' : tx.type === 'Withdrawal' ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {tx.type === 'Sale' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.type}</p>
                      <p className="text-xs text-gray-500">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'Sale' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'Sale' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className={`text-xs font-medium ${tx.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Withdrawal Requests */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              💸 Yêu Cầu Rút Tiền
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {withdrawals.length > 0 ? (
                withdrawals.map((wd) => (
                  <div key={wd.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(wd.amount)}</p>
                        <p className="text-sm text-gray-500">{wd.bankName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        wd.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {wd.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{wd.date}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Chưa có yêu cầu rút tiền</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8 flex gap-3">
          <div className="text-2xl">ℹ️</div>
            <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Thông Tin Rút Tiền</p>
            <ul className="text-xs space-y-1">
              <li>• Miễn phí nếu rút từ 1,000,000 VNĐ trở lên</li>
              <li>• Phí 10,000 VNĐ nếu rút dưới 1,000,000 VNĐ</li>
              <li>• Số tiền tối thiểu: 50,000 VNĐ</li>
              <li>• Thời gian xử lý: 1-3 ngày làm việc</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
