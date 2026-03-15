import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

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
      alert('Chọn ít nhất một user');
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
    <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Users Management</h1>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Email, Name, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                >
                  <option value="">All Roles</option>
                  <option value="BUYER">BUYER</option>
                  <option value="SELLER">SELLER</option>
                  <option value="INSPECTOR">INS</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ role: '', status: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex gap-2 items-center mb-4">
              <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
              <button onClick={() => handleBulkStatus(true)} disabled={bulkLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Bulk Activate</button>
              <button onClick={() => handleBulkStatus(false)} disabled={bulkLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Bulk Deactivate</button>
              <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 border rounded-lg text-sm">Clear</button>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input type="checkbox" checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length} onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredUsers.map(u => u._id)) : new Set())} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">KYC Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input type="checkbox" checked={selectedIds.has(user._id)} onChange={() => toggleSelect(user._id)} />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{user.fullName}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                              {formatRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.role === 'SELLER' ? (
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(user.kycStatus)}`}>
                                {user.kycStatus}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded text-gray-400 bg-gray-50">
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              user.isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {(user.role === 'SELLER' || user.kycStatus === 'PENDING' || (user.kycData && (user.kycData.documentType || user.kycData.documentId || user.kycData.frontImage || user.kycData.backImage))) && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setKycStatus(user.kycStatus);
                                    setShowKycModal(true);
                                  }}
                                  className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  KYC
                                </button>
                              )}
                              <button
                                onClick={() => handleBanUser(user._id, user.isActive)}
                                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                                  user.isActive
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {user.isActive ? 'Ban' : 'Unban'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      {/* KYC Modal — SELLER hoặc user có hồ sơ KYC (kể cả BUYER đã gửi KYC) */}
      {showKycModal && selectedUser && (selectedUser.role === 'SELLER' || selectedUser.kycStatus === 'PENDING' || (selectedUser.kycData && (selectedUser.kycData.documentType || selectedUser.kycData.documentId || selectedUser.kycData.frontImage || selectedUser.kycData.backImage))) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Update KYC Status</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">{selectedUser.role === 'SELLER' ? 'Seller' : 'Người dùng'}</label>
              <p className="text-gray-700">{selectedUser.fullName} ({selectedUser.email})</p>
              <p className="text-xs text-gray-500 mt-1">Role: {selectedUser.role}</p>
            </div>

            {/* Hồ sơ KYC đã gửi — luôn hiển thị, có hoặc chưa có tài liệu */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Hồ sơ đã gửi</h3>
              {selectedUser.kycData && (selectedUser.kycData.documentType || selectedUser.kycData.documentId || selectedUser.kycData.frontImage || selectedUser.kycData.backImage) ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    {selectedUser.kycData.documentType && (
                      <div>
                        <span className="text-gray-500">Loại giấy tờ:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedUser.kycData.documentType}</span>
                      </div>
                    )}
                    {selectedUser.kycData.documentId && (
                      <div>
                        <span className="text-gray-500">Số CCCD/CMND:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedUser.kycData.documentId}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.kycData.frontImage ? (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ảnh mặt trước</p>
                        <a href={selectedUser.kycData.frontImage} target="_blank" rel="noopener noreferrer" className="block rounded border border-gray-200 overflow-hidden bg-white">
                          <img src={selectedUser.kycData.frontImage} alt="Mặt trước" className="w-full h-32 object-contain" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 rounded border border-gray-200 bg-white text-gray-400 text-sm">Chưa có ảnh</div>
                    )}
                    {selectedUser.kycData.backImage ? (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ảnh mặt sau</p>
                        <a href={selectedUser.kycData.backImage} target="_blank" rel="noopener noreferrer" className="block rounded border border-gray-200 overflow-hidden bg-white">
                          <img src={selectedUser.kycData.backImage} alt="Mặt sau" className="w-full h-32 object-contain" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 rounded border border-gray-200 bg-white text-gray-400 text-sm">Chưa có ảnh</div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Seller chưa gửi tài liệu KYC (ảnh CCCD/CMND). Có thể cập nhật trạng thái bên dưới sau khi họ gửi.</p>
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
    </div>
  );
};
