import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';

interface Listing {
  _id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  sellerId: {
    _id: string;
    fullName: string;
    email: string;
    reputation?: { score: number };
  };
  brand?: string;
  model?: string;
  year?: number;
  createdAt: string;
  priorityLevel?: number;
  approvalTimeHours?: number;
  sellerPlanType?: string;
}

export const AdminListings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [error, setError] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchListings();
  }, [pagination.page, statusFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`http://localhost:5000/api/admin/listings?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.data);
        setPagination(data.pagination);
      } else {
        setError('Failed to load listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Error loading listings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedListing) return;

    try {
      const token = localStorage.getItem('accessToken');
      const body: any = {
        status: actionType === 'approve' ? 'PUBLISHED' : 'REJECTED',
      };
      if (actionType === 'reject' && rejectionReason) {
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch(`http://localhost:5000/api/admin/listings/${selectedListing._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowActionModal(false);
        setSelectedListing(null);
        setRejectionReason('');
        fetchListings();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update listing status');
      }
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('Error updating listing status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Listings Management</h1>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                >
                  <option value="">All Status</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="SOLD">SOLD</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading listings...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Listing</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Seller</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Status</th>
                        {statusFilter === 'PENDING_APPROVAL' && (
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Priority</th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {listings.map((listing) => (
                        <tr key={listing._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{listing.title}</p>
                              <p className="text-sm text-gray-600">{listing.brand} {listing.model} ({listing.year})</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{listing.sellerId.fullName}</p>
                              <p className="text-sm text-gray-600">{listing.sellerId.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{formatCurrency(listing.amount)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              listing.status === 'PUBLISHED' ? 'text-green-600 bg-green-50' :
                              listing.status === 'REJECTED' ? 'text-red-600 bg-red-50' :
                              listing.status === 'PENDING_APPROVAL' ? 'text-yellow-600 bg-yellow-50' :
                              'text-gray-600 bg-gray-50'
                            }`}>
                              {listing.status}
                            </span>
                          </td>
                          {statusFilter === 'PENDING_APPROVAL' && (
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {listing.sellerPlanType || 'FREE'} (Level {listing.priorityLevel || 0})
                                </p>
                                <p className="text-xs text-gray-600">
                                  {listing.approvalTimeHours || 48}h approval time
                                </p>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            {listing.status === 'PENDING_APPROVAL' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedListing(listing);
                                    setActionType('approve');
                                    setShowActionModal(true);
                                  }}
                                  className="px-3 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 rounded transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedListing(listing);
                                    setActionType('reject');
                                    setRejectionReason('');
                                    setShowActionModal(true);
                                  }}
                                  className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} listings
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
      </div>

      {/* Action Modal */}
      {showActionModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Listing' : 'Reject Listing'}
            </h2>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Listing:</span> {selectedListing.title}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Seller:</span> {selectedListing.sellerId.fullName}
              </p>
            </div>
            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedListing(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
