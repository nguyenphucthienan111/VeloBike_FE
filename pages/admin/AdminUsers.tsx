import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

interface KycData {
  documentType?: string;
  documentId?: string;
  frontImage?: string;
  backImage?: string;
  verifiedAt?: string;
}

interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  kycStatus: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  kycData?: KycData;
  wallet?: { balance: number; currency: string };
  reputation?: { score: number; reviewCount: number };
}

export const AdminUsers: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const currentUserId = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}')._id; } catch { return null; } })();
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycStatus, setKycStatus] = useState('VERIFIED');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(isConnectionError(error) ? CONNECTION_ERROR_MESSAGE : 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.size === 0) {
      alert('Please select at least one user');
      return;
    }
    setBulkLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bulk/admin/users/update-status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedIds), isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedIds(new Set());
        fetchUsers();
        alert(data.message || `${selectedIds.size} users updated`);
      } else alert(data.message || 'Failed');
    } catch (e) {
      alert('Error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBanUser = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  const handleUpdateKyc = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser._id}/kyc`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kycStatus }),
      });

      if (response.ok) {
        setShowKycModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert('Failed to update KYC status');
      }
    } catch (error) {
      console.error('Error updating KYC:', error);
      alert('Error updating KYC status');
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(term) ||
      user.fullName.toLowerCase().includes(term) ||
      user._id.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'text-green-600 bg-green-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const formatRoleLabel = (role: string) => {
    if (role === 'INSPECTOR') return 'INS';
    return role;
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader title="User management" subtitle="Search, filter, and manage user accounts" />
      {error && <AdminErrorBanner message={error} />}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Email, name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
            >
              <option value="">All</option>
              <option value="BUYER">BUYER</option>
              <option value="SELLER">SELLER</option>
              <option value="INSPECTOR">INS</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ role: '', status: '' })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex gap-2 items-center mb-4">
          <span className="text-sm text-slate-600">{selectedIds.size} selected</span>
          <button onClick={() => handleBulkStatus(true)} disabled={bulkLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Activate selected</button>
          <button onClick={() => handleBulkStatus(false)} disabled={bulkLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">Disable selected</button>
          <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50">Clear selection</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <AdminLoadingState message="Loading users..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left">
                      <input type="checkbox" checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length} onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredUsers.map(u => u._id)) : new Set())} className="rounded border-slate-300" />
                    </th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">User</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Role</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">KYC</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-5 py-3.5 text-left font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <input type="checkbox" checked={selectedIds.has(user._id)} onChange={() => toggleSelect(user._id)} className="rounded border-slate-300" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-slate-900">{user.fullName}</p>
                          <p className="text-slate-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                          {formatRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.role === 'SELLER' ? (
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-md border whitespace-nowrap ${getStatusColor(user.kycStatus)}`}>
                            {user.kycStatus.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-md text-slate-400 bg-slate-50 border border-slate-200 whitespace-nowrap">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-md border whitespace-nowrap ${
                              user.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2">
                              {(user.role === 'SELLER' || user.kycStatus === 'PENDING' || (user.kycData && (user.kycData.documentType || user.kycData.documentId || user.kycData.frontImage || user.kycData.backImage))) && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setKycStatus(user.kycStatus);
                                    setShowKycModal(true);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  KYC
                                </button>
                              )}
                              <button
                                onClick={() => handleBanUser(user._id, user.isActive)}
                                disabled={user.role === 'ADMIN' || user._id === currentUserId}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                  user.isActive
                                    ? 'text-red-700 border-red-200 hover:bg-red-50'
                                    : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                }`}
                              >
                                {user.isActive ? 'Disable' : 'Enable'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <p className="text-sm text-slate-600">
                    {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} users
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

      {/* KYC Modal — SELLER or any user with KYC data (including BUYER who has submitted KYC) */}
      {showKycModal && selectedUser && (selectedUser.role === 'SELLER' || selectedUser.kycStatus === 'PENDING' || (selectedUser.kycData && (selectedUser.kycData.documentType || selectedUser.kycData.documentId || selectedUser.kycData.frontImage || selectedUser.kycData.backImage))) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Update KYC Status</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">{selectedUser.role === 'SELLER' ? 'Seller' : 'User'}</label>
              <p className="text-gray-700">{selectedUser.fullName} ({selectedUser.email})</p>
              <p className="text-xs text-gray-500 mt-1">Role: {selectedUser.role.replace(/_/g, ' ')}</p>
            </div>

            {/* Submitted KYC profile — always show, whether documents exist or not */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Submitted documents</h3>
              {selectedUser.kycData && (selectedUser.kycData.documentType || selectedUser.kycData.documentId || selectedUser.kycData.frontImage || selectedUser.kycData.backImage) ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    {selectedUser.kycData.documentType && (
                      <div>
                        <span className="text-gray-500">Document type:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedUser.kycData.documentType}</span>
                      </div>
                    )}
                    {selectedUser.kycData.documentId && (
                      <div>
                        <span className="text-gray-500">ID number:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedUser.kycData.documentId}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.kycData.frontImage ? (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Front side</p>
                        <a href={selectedUser.kycData.frontImage} target="_blank" rel="noopener noreferrer" className="block rounded border border-gray-200 overflow-hidden bg-white">
                          <img src={selectedUser.kycData.frontImage} alt="Front" className="w-full h-32 object-contain" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 rounded border border-gray-200 bg-white text-gray-400 text-sm">No image</div>
                    )}
                    {selectedUser.kycData.backImage ? (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Back side</p>
                        <a href={selectedUser.kycData.backImage} target="_blank" rel="noopener noreferrer" className="block rounded border border-gray-200 overflow-hidden bg-white">
                          <img src={selectedUser.kycData.backImage} alt="Back" className="w-full h-32 object-contain" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 rounded border border-gray-200 bg-white text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Seller has not submitted KYC documents yet. You can update the status after they upload them.</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">KYC Status</label>
              <select
                value={kycStatus}
                onChange={(e) => setKycStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
              >
                <option value="PENDING">PENDING</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">KYC verification is required for SELLER role</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowKycModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateKyc}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};
