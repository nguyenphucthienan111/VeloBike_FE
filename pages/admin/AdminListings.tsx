import React, { useState, useEffect } from 'react';
import { useToast, Toast } from '../../components/Toast';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

interface Listing {
  _id: string;
  title: string;
  description: string;
  pricing?: {
    amount: number;
    currency: string;
  };
  amount?: number; // Fallback for backward compatibility
  status: string;
  sellerId: {
    _id: string;
    fullName: string;
    email: string;
    reputation?: { score: number };
  } | null;
  generalInfo?: {
    brand: string;
    model: string;
    year: number;
  };
  brand?: string;
  model?: string;
  year?: number;
  createdAt: string;
  priorityLevel?: number;
  approvalTimeHours?: number;
  sellerPlanType?: string;
  media?: {
    thumbnails?: string[];
  };
}

export const AdminListings: React.FC = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

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

      const response = await fetch(`${API_BASE_URL}/admin/listings?${params}`, {
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
      setError(isConnectionError(error) ? CONNECTION_ERROR_MESSAGE : 'Error loading listings');
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

      const response = await fetch(`${API_BASE_URL}/admin/listings/${selectedListing._id}/status`, {
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
        showToast(
          actionType === 'approve' 
            ? 'Listing approved and published successfully!' 
            : 'Listing has been rejected.',
          actionType === 'approve' ? 'success' : 'warning'
        );
        fetchListings();
      } else {
        const data = await response.json();
        showToast(data.message || 'Unable to update listing status', 'error');
      }
    } catch (error) {
      console.error('Error updating listing status:', error);
      showToast('Error updating listing status', 'error');
    }
  };

  const handleExportListings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bulk/export/listings`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listings-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Export completed', 'success');
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  };

  const handleBulkModerate = async () => {
    if (selectedIds.size === 0 || !bulkAction) return;
    if (bulkAction === 'REJECT' && !bulkReason.trim()) {
      showToast('Nhập lý do từ chối', 'error');
      return;
    }
    setBulkLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/bulk/admin/listings/moderate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingIds: Array.from(selectedIds), action: bulkAction, reason: bulkReason || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedIds(new Set());
        setBulkAction(null);
        setBulkReason('');
        fetchListings();
        showToast(data.message || 'Done', 'success');
      } else showToast(data.message || 'Failed', 'error');
    } catch (e) {
      showToast('Error', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount || isNaN(amount)) return '0 VND';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getListingPrice = (listing: Listing) => {
    return listing.pricing?.amount || listing.amount || 0;
  };

  const getListingBrand = (listing: Listing) => {
    return listing.generalInfo?.brand || listing.brand || 'N/A';
  };

  const getListingModel = (listing: Listing) => {
    return listing.generalInfo?.model || listing.model || 'N/A';
  };

  const getListingYear = (listing: Listing) => {
    return listing.generalInfo?.year || listing.year || null;
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Quản lý tin đăng" subtitle="Duyệt, từ chối và xuất danh sách tin đăng" />
      {error && <AdminErrorBanner message={error} />}

      <div className="flex flex-wrap gap-4 items-center mb-4">
        <button onClick={handleExportListings} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 bg-white">Export CSV</button>
        {selectedIds.size > 0 && (
          <>
            <span className="text-sm text-slate-600">{selectedIds.size} đã chọn</span>
            <button onClick={() => setBulkAction('APPROVE')} disabled={bulkLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Duyệt hàng loạt</button>
            <button onClick={() => setBulkAction('REJECT')} disabled={bulkLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">Từ chối hàng loạt</button>
            <button onClick={() => { setSelectedIds(new Set()); setBulkAction(null); setBulkReason(''); }} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50">Bỏ chọn</button>
          </>
        )}
      </div>

      {bulkAction && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <p className="text-sm font-medium text-slate-700 mb-2">Hàng loạt {bulkAction}: {selectedIds.size} tin. {bulkAction === 'REJECT' ? 'Lý do (bắt buộc):' : ''}</p>
          {bulkAction === 'REJECT' && <input type="text" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} placeholder="Lý do từ chối" className="w-full max-w-md border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-slate-300 outline-none" />}
          <div className="flex gap-2">
            <button onClick={handleBulkModerate} disabled={bulkLoading || (bulkAction === 'REJECT' && !bulkReason.trim())} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">Xác nhận</button>
            <button onClick={() => { setBulkAction(null); setBulkReason(''); }} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50">Hủy</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
            >
              <option value="">Tất cả</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SOLD">SOLD</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <AdminLoadingState message="Đang tải tin đăng..." />
        ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input type="checkbox" checked={listings.length > 0 && selectedIds.size === listings.length} onChange={(e) => setSelectedIds(e.target.checked ? new Set(listings.map(l => l._id)) : new Set())} />
                        </th>
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
                            <input type="checkbox" checked={selectedIds.has(listing._id)} onChange={() => setSelectedIds(prev => { const n = new Set(prev); if (n.has(listing._id)) n.delete(listing._id); else n.add(listing._id); return n; })} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                {listing.media?.thumbnails?.[0] ? (
                                  <img
                                    src={listing.media.thumbnails[0]}
                                    alt={listing.title}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect fill='%23e5e7eb' width='48' height='48'/%3E%3Ctext fill='%239ca3af' x='24' y='26' font-size='10' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">No Image</span>
                                  </div>
                                )}
                              </div>
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{listing.title}</p>
                                <p className="text-sm text-gray-600">
                                  {getListingBrand(listing)} {getListingModel(listing)}
                                  {getListingYear(listing) && ` (${getListingYear(listing)})`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{listing.sellerId?.fullName || 'N/A'}</p>
                              <p className="text-sm text-gray-600">{listing.sellerId?.email || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{formatCurrency(getListingPrice(listing))}</p>
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
                <span className="font-semibold">Seller:</span> {selectedListing.sellerId?.fullName || 'N/A'}
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

      {/* Toast Notification */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}
    </AdminPageLayout>
  );
};
