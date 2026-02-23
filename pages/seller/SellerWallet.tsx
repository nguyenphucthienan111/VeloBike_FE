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

interface BankAccount {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
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
  const [withdrawBankAccount, setWithdrawBankAccount] = useState<BankAccount>({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  
  // Bank Account Management
  const [savedBankAccount, setSavedBankAccount] = useState<BankAccount | null>(null);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [bankAccountForm, setBankAccountForm] = useState<BankAccount>({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });
  const [bankAccountLoading, setBankAccountLoading] = useState(false);
  const [bankAccountError, setBankAccountError] = useState('');
  const [bankAccountSuccess, setBankAccountSuccess] = useState('');

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

      // Fetch user profile to get bank account
      const userRes = await fetch('http://localhost:5000/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.success && userData.data?.bankAccount) {
          setSavedBankAccount(userData.data.bankAccount);
        }
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

  const handleOpenBankAccountModal = () => {
    if (savedBankAccount) {
      setBankAccountForm({
        accountName: savedBankAccount.accountName || '',
        accountNumber: savedBankAccount.accountNumber || '',
        bankName: savedBankAccount.bankName || '',
      });
    } else {
      setBankAccountForm({
        accountName: '',
        accountNumber: '',
        bankName: '',
      });
    }
    setBankAccountError('');
    setBankAccountSuccess('');
    setShowBankAccountModal(true);
  };

  const handleSaveBankAccount = async () => {
    try {
      setBankAccountError('');
      setBankAccountSuccess('');

      // Validation
      if (!bankAccountForm.accountName?.trim()) {
        setBankAccountError('Please enter account holder name');
        return;
      }

      if (!bankAccountForm.accountNumber?.trim()) {
        setBankAccountError('Please enter account number');
        return;
      }

      if (!bankAccountForm.bankName?.trim()) {
        setBankAccountError('Please enter bank name');
        return;
      }

      setBankAccountLoading(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:5000/api/users/me/bank', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountName: bankAccountForm.accountName.trim(),
          accountNumber: bankAccountForm.accountNumber.trim(),
          bankName: bankAccountForm.bankName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBankAccountSuccess('Bank account saved successfully!');
        setSavedBankAccount({
          accountName: bankAccountForm.accountName.trim(),
          accountNumber: bankAccountForm.accountNumber.trim(),
          bankName: bankAccountForm.bankName.trim(),
        });
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setShowBankAccountModal(false);
          setBankAccountSuccess('');
        }, 1500);
      } else {
        const data = await response.json();
        setBankAccountError(data.message || 'Failed to save bank account');
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      setBankAccountError('Error saving bank account');
    } finally {
      setBankAccountLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawError('');
      const amount = parseInt(withdrawAmount);

      // Validation
      if (!amount || isNaN(amount)) {
        setWithdrawError('Please enter a valid amount');
        return;
      }

      if (amount < 50000) {
        setWithdrawError('Minimum amount is 50,000 VND');
        return;
      }

      if (!balance || amount > balance.balance) {
        setWithdrawError('Insufficient balance');
        return;
      }

      // Prepare bank account data
      let bankAccountData: BankAccount;
      
      if (savedBankAccount) {
        // Use saved bank account
        bankAccountData = savedBankAccount;
      } else {
        // Validate withdrawal form bank account
        if (!withdrawBankAccount.accountName?.trim()) {
          setWithdrawError('Please enter account holder name');
          return;
        }
        if (!withdrawBankAccount.accountNumber?.trim()) {
          setWithdrawError('Please enter account number');
          return;
        }
        if (!withdrawBankAccount.bankName?.trim()) {
          setWithdrawError('Please enter bank name');
          return;
        }
        bankAccountData = withdrawBankAccount;
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
          bankAccount: {
            accountName: bankAccountData.accountName?.trim(),
            accountNumber: bankAccountData.accountNumber?.trim(),
            bankName: bankAccountData.bankName?.trim(),
          },
        }),
      });

      if (response.ok) {
        // Success - Auto save bank account if not saved yet
        if (!savedBankAccount) {
          try {
            const saveResponse = await fetch('http://localhost:5000/api/users/me/bank', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountName: bankAccountData.accountName?.trim(),
                accountNumber: bankAccountData.accountNumber?.trim(),
                bankName: bankAccountData.bankName?.trim(),
              }),
            });

            if (saveResponse.ok) {
              // Update saved bank account state
              setSavedBankAccount(bankAccountData);
            }
          } catch (error) {
            // Silent fail - bank account saved for withdrawal, just not in profile
            console.log('Could not auto-save bank account to profile');
          }
        }

        // Success
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawBankAccount({
          accountName: '',
          accountNumber: '',
          bankName: '',
        });
        // Refresh data
        await fetchWalletData();
      } else {
        const data = await response.json();
        setWithdrawError(data.message || 'Withdrawal request failed');
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      setWithdrawError('Error processing request');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
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

          {/* Bank Account Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bank Account</h2>
                <p className="text-sm text-gray-600 mt-1">Account information to receive payments</p>
              </div>
              <button
                onClick={handleOpenBankAccountModal}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {savedBankAccount ? 'Update' : 'Add Account'}
              </button>
            </div>

            {savedBankAccount ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Account Holder Name</p>
                    <p className="text-sm font-semibold text-gray-900">{savedBankAccount.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Account Number</p>
                    <p className="text-sm font-semibold text-gray-900">{savedBankAccount.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Bank</p>
                    <p className="text-sm font-semibold text-gray-900">{savedBankAccount.bankName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ You don't have a bank account yet. Please add an account to receive payments.
                </p>
              </div>
            )}
          </div>

          {/* Withdraw Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Withdraw</h2>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Withdraw
              </button>
            </div>

            {/* Withdrawal Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Withdrawal Information</h3>
              <ul className="text-xs space-y-2 text-gray-600">
                <li>• Minimum amount: 50,000 VND</li>
                <li>• Free if withdrawing 1,000,000 VND or more</li>
                <li>• Fee 10,000 VND if withdrawing less than 1,000,000 VND</li>
                <li>• Processing time: 1-3 business days</li>
              </ul>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Withdrawal History</h2>
            {withdrawals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">REQUEST DATE</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">AMOUNT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">FEE</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">BANK ACCOUNT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900 font-semibold">
                          {new Date(withdrawal.requestedAt).toLocaleDateString('en-US')}
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
              <p className="text-gray-500 text-sm text-center py-8">No withdrawal history</p>
            )}
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Transaction History</h2>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">DATE</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">TYPE</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">AMOUNT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">DESCRIPTION</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900 font-semibold">
                          {new Date(transaction.createdAt).toLocaleDateString('en-US')}
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
              <p className="text-gray-500 text-sm text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Withdraw</h2>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Amount (VND)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount (minimum 50,000)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              />
              {withdrawAmount && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Amount to receive: {formatCurrency(parseInt(withdrawAmount) - calculateFee(parseInt(withdrawAmount)))}</p>
                  <p>Fee: {formatCurrency(calculateFee(parseInt(withdrawAmount)))}</p>
                </div>
              )}
            </div>

            {/* Bank Account Input */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-900">Bank Account *</label>
                {savedBankAccount && (
                  <button
                    onClick={handleOpenBankAccountModal}
                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                  >
                    Edit account
                  </button>
                )}
              </div>
              {savedBankAccount ? (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900">{savedBankAccount.bankName}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {savedBankAccount.accountName} - {savedBankAccount.accountNumber}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Account Holder Name *</label>
                      <input
                        type="text"
                        value={withdrawBankAccount.accountName}
                        onChange={(e) => setWithdrawBankAccount({ ...withdrawBankAccount, accountName: e.target.value })}
                        placeholder="NGUYEN VAN A"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Account Number *</label>
                      <input
                        type="text"
                        value={withdrawBankAccount.accountNumber}
                        onChange={(e) => setWithdrawBankAccount({ ...withdrawBankAccount, accountNumber: e.target.value })}
                        placeholder="1234567890"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        value={withdrawBankAccount.bankName}
                        onChange={(e) => setWithdrawBankAccount({ ...withdrawBankAccount, bankName: e.target.value })}
                        placeholder="Vietcombank"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 This account will be automatically saved after successful withdrawal
                  </p>
                </>
              )}
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
                Current balance: <span className="font-bold text-gray-900">{formatCurrency(balance?.balance || 0)}</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawError('');
                  setWithdrawBankAccount({
                    accountName: '',
                    accountNumber: '',
                    bankName: '',
                  });
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
                {withdrawLoading ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {showBankAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {savedBankAccount ? 'Update Bank Account' : 'Add Bank Account'}
            </h2>

            {/* Account Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Account Holder Name *</label>
              <input
                type="text"
                value={bankAccountForm.accountName}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
                placeholder="NGUYEN VAN A"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* Account Number Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Account Number *</label>
              <input
                type="text"
                value={bankAccountForm.accountNumber}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                placeholder="1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* Bank Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Bank Name *</label>
              <input
                type="text"
                value={bankAccountForm.bankName}
                onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
                placeholder="Vietcombank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              />
            </div>

            {/* Error Message */}
            {bankAccountError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{bankAccountError}</p>
              </div>
            )}

            {/* Success Message */}
            {bankAccountSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{bankAccountSuccess}</p>
              </div>
            )}

            {/* Info */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                This bank account will be used to receive payments from completed orders.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBankAccountModal(false);
                  setBankAccountError('');
                  setBankAccountSuccess('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveBankAccount}
                disabled={bankAccountLoading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors font-medium"
              >
                {bankAccountLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
