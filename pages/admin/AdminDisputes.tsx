import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface Dispute {
  _id: string;
  orderId: {
    _id: string;
    amount: number;
    financials?: { itemPrice: number; platformFee: number; totalAmount: number };
    shippingAddress?: { fullName: string; phone: string; street?: string; district?: string; city?: string; province?: string };
    listingId: { title: string };
    status?: string;
  };
  claimantId: { fullName: string; email: string; phone?: string };
  respondentId: { fullName: string; email: string; phone?: string };
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  resolution?: string;
  compensationAmount?: number;
}

export const AdminDisputes: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ action: 'REFUND_BUYER' | 'PAY_SELLER' } | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, [pagination.page, statusFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${API_BASE_URL}/disputes/admin/all?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes(data.data);
        setPagination(data.pagination);
      } else {
        setError('Failed to load disputes');
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      setError(isConnectionError(error) ? CONNECTION_ERROR_MESSAGE : 'Error loading disputes');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleResolve = async (action: 'REFUND_BUYER' | 'PAY_SELLER') => {
    if (!selectedDispute) return;
    if (!resolutionNote.trim()) {
      showToast('Please provide a resolution note');
      return;
    }
    if (action === 'REFUND_BUYER') {
      const itemPrice = selectedDispute.orderId?.financials?.itemPrice || selectedDispute.orderId?.amount || 0;
      const platformFee = selectedDispute.orderId?.financials?.platformFee || 0;
      const maxAmount = Math.max(0, itemPrice - platformFee);
      if (refundAmount <= 0) {
        showToast('Refund amount must be greater than 0');
        return;
      }
      if (maxAmount > 0 && refundAmount > maxAmount) {
        showToast(`Refund cannot exceed order amount (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxAmount)})`);
        return;
      }
    }
    setConfirmModal({ action });
  };

  const handleConfirmResolve = async () => {
    if (!selectedDispute || !confirmModal) return;
    const action = confirmModal.action;
    setConfirmModal(null);

    setProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // 1. Resolve Dispute — backend tự xử lý phân phối tiền và cập nhật order status
      const body = {
        resolution: resolutionNote,
        compensationAmount: action === 'REFUND_BUYER' ? refundAmount : 0
      };

      const response = await fetch(`${API_BASE_URL}/disputes/${selectedDispute._id}/resolve`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to resolve dispute');
      }

      showToast('Dispute resolved successfully');
      setSelectedDispute(null);
      setResolutionNote('');
      setRefundAmount(0);
      fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      showToast('Error resolving dispute');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-red-600 bg-red-50';
      case 'IN_REVIEW': return 'text-yellow-600 bg-yellow-50';
      case 'RESOLVED': return 'text-green-600 bg-green-50';
      case 'CLOSED': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Dispute management" subtitle="View and handle order disputes" />
      {error && <AdminErrorBanner message={error} />}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
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
                  <option value="OPEN">OPEN</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        {loading ? (
          <AdminLoadingState message="Loading disputes..." />
        ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Claimant</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {disputes.map((dispute) => (
                        <tr key={dispute._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="text-sm font-mono text-gray-900">{dispute.orderId?._id?.substring(0, 8) || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{dispute.orderId?.listingId?.title || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{dispute.claimantId?.fullName || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{dispute.claimantId?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">{dispute.reason}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${getStatusColor(dispute.status)}`}>
                              {dispute.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedDispute(dispute)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} disputes
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

      {/* Dispute Detail Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Dispute Details</h2>
                <button onClick={() => setSelectedDispute(null)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-lg ${getStatusColor(selectedDispute.status)} bg-opacity-10 border`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} />
                    <span className="font-bold">Status: {selectedDispute.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
                    {selectedDispute.description}
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Claimant (Buyer)</h3>
                    <div className="bg-white border p-3 rounded-lg space-y-1">
                      <p className="font-semibold">{selectedDispute.claimantId?.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedDispute.claimantId?.email}</p>
                      {selectedDispute.claimantId?.phone && (
                        <p className="text-sm text-gray-600">📞 {selectedDispute.claimantId.phone}</p>
                      )}
                      {/* Contact from order shipping address */}
                      {selectedDispute.orderId?.shippingAddress && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-1">Order contact</p>
                          {selectedDispute.orderId.shippingAddress.phone && (
                            <p className="text-sm text-gray-700">📞 {selectedDispute.orderId.shippingAddress.phone}</p>
                          )}
                          {[
                            selectedDispute.orderId.shippingAddress.street,
                            selectedDispute.orderId.shippingAddress.district,
                            selectedDispute.orderId.shippingAddress.city,
                          ].filter(Boolean).length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              📍 {[
                                selectedDispute.orderId.shippingAddress.street,
                                selectedDispute.orderId.shippingAddress.district,
                                selectedDispute.orderId.shippingAddress.city,
                              ].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Respondent (Seller)</h3>
                    <div className="bg-white border p-3 rounded-lg space-y-1">
                      <p className="font-semibold">{selectedDispute.respondentId?.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedDispute.respondentId?.email}</p>
                      {selectedDispute.respondentId?.phone && (
                        <p className="text-sm text-gray-600">📞 {selectedDispute.respondentId.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resolution Form (Only if OPEN or IN_REVIEW) */}
                {(selectedDispute.status === 'OPEN' || selectedDispute.status === 'IN_REVIEW') && (
                  <div className="border-t pt-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Resolution</h3>

                    {/* Order amount info */}
                    {selectedDispute.orderId?.amount > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
                        Order amount: <span className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedDispute.orderId.amount)}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Note <span className="text-red-500">*</span></label>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Explain the resolution decision..."
                      />
                    </div>

                    {/* Two separate action cards */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {/* Accept Claim - Refund Buyer */}
                      <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
                        <div>
                          <p className="font-semibold text-red-800">Accept Claim</p>
                          <p className="text-xs text-red-600 mt-0.5">Refund buyer, seller receives remainder</p>
                        </div>
                        <div>
                          {(() => {
                            const itemPrice = selectedDispute.orderId?.financials?.itemPrice || selectedDispute.orderId?.amount || 0;
                            const platformFee = selectedDispute.orderId?.financials?.platformFee || 0;
                            const maxAmt = Math.max(0, itemPrice - platformFee);
                            return (
                              <>
                                <label className="block text-xs font-medium text-red-700 mb-1">
                                  Refund amount {maxAmt > 0 && `(max: ${new Intl.NumberFormat('vi-VN').format(maxAmt)}đ)`}
                                </label>
                                <input
                                  type="number"
                                  value={refundAmount}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setRefundAmount(maxAmt > 0 ? Math.min(val, maxAmt) : val);
                                  }}
                                  className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none bg-white"
                                  placeholder="0"
                                  min="0"
                                  max={maxAmt > 0 ? maxAmt : undefined}
                                />
                              </>
                            );
                          })()}
                        </div>
                        <button
                          onClick={() => handleResolve('REFUND_BUYER')}
                          disabled={processing}
                          className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing ? 'Processing...' : 'Refund Buyer'}
                        </button>
                      </div>

                      {/* Deny Claim - Pay Seller */}
                      <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50 space-y-3">
                        <div>
                          <p className="font-semibold text-green-800">Deny Claim</p>
                          <p className="text-xs text-green-600 mt-0.5">Seller receives full payment, no refund to buyer</p>
                        </div>
                        <div className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
                          Seller payout: <span className="font-semibold">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                              Math.max(0, (selectedDispute.orderId?.financials?.itemPrice ?? selectedDispute.orderId?.amount ?? 0) - (selectedDispute.orderId?.financials?.platformFee ?? 0))
                            )}
                          </span>
                          <p className="text-xs text-green-600 mt-0.5">(after platform fee deduction)</p>
                        </div>
                        <button
                          onClick={() => handleResolve('PAY_SELLER')}
                          disabled={processing}
                          className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing ? 'Processing...' : 'Pay Seller'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Display Resolution if Resolved */}
                {selectedDispute.status === 'RESOLVED' && (
                   <div className="border-t pt-6">
                     <h3 className="text-lg font-bold text-gray-900 mb-2">Resolution Details</h3>
                     <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                       <p className="font-medium text-green-900 mb-1">Note:</p>
                       <p className="text-green-800 mb-3">{selectedDispute.resolution}</p>
                       {selectedDispute.compensationAmount ? (
                         <p className="font-bold text-green-900">Compensated: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedDispute.compensationAmount)}</p>
                       ) : (
                         <p className="font-bold text-green-900">Claim Denied (No Refund)</p>
                       )}
                     </div>
                   </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              {confirmModal.action === 'REFUND_BUYER' ? (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900">
                {confirmModal.action === 'REFUND_BUYER' ? 'Refund Buyer?' : 'Pay Seller?'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {confirmModal.action === 'REFUND_BUYER'
                ? 'Buyer will be refunded and the claim will be accepted. This action cannot be undone.'
                : "Seller will receive payment and the buyer's claim will be denied. This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold disabled:opacity-50 ${
                  confirmModal.action === 'REFUND_BUYER' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg text-sm">
          {toastMsg}
        </div>
      )}
    </AdminPageLayout>
  );
};
