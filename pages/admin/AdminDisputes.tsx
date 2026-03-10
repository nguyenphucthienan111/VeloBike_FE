import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface Dispute {
  _id: string;
  orderId: {
    _id: string;
    listingId: {
      title: string;
    };
  };
  claimantId: {
    fullName: string;
    email: string;
  };
  respondentId: {
    fullName: string;
    email: string;
  };
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

  const handleResolve = async (action: 'REFUND_BUYER' | 'PAY_SELLER') => {
    if (!selectedDispute) return;
    if (!resolutionNote) {
      alert('Please provide a resolution note');
      return;
    }
    
    if (!confirm(`Are you sure you want to ${action === 'REFUND_BUYER' ? 'REFUND the Buyer' : 'PAY the Seller'}? This action cannot be undone.`)) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // 1. Resolve Dispute
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

      // 2. Update Order Status & Financials
      // If REFUND_BUYER -> Set Order to REFUNDED
      // If PAY_SELLER -> Try to Release Payout (Note: This might fail if Order is not DELIVERED due to BE restriction)
      
      if (action === 'REFUND_BUYER') {
        const orderRes = await fetch(`${API_BASE_URL}/orders/${selectedDispute.orderId._id}/status`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'REFUNDED', note: `Dispute resolved: ${resolutionNote}` })
        });
        if (!orderRes.ok) console.error('Failed to update order status to REFUNDED');
      } else {
        // PAY_SELLER -> Release Payout
        // Backend Requirement: Order must be in DELIVERED status to release payout.
        // If it's DISPUTED, this might fail. We'll try to set it to COMPLETED manually if payout fails, 
        // but money won't be transferred automatically if releasePayout fails.
        
        const payoutRes = await fetch(`${API_BASE_URL}/admin/orders/${selectedDispute.orderId._id}/payout`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!payoutRes.ok) {
            const payoutData = await payoutRes.json();
            console.error('Failed to release payout to seller:', payoutData.message);
            alert(`Warning: Dispute resolved but Payout failed. Reason: ${payoutData.message}. Please handle payout manually.`);
        }
      }

      alert('Dispute resolved successfully');
      setSelectedDispute(null);
      setResolutionNote('');
      setRefundAmount(0);
      fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Error resolving dispute');
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
    <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Disputes Management</h1>

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
                  <option value="OPEN">OPEN</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Disputes Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading disputes...</p>
              </div>
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
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(dispute.status)}`}>
                              {dispute.status}
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
                    <span className="font-bold">Status: {selectedDispute.status}</span>
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
                    <div className="bg-white border p-3 rounded-lg">
                      <p className="font-semibold">{selectedDispute.claimantId?.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedDispute.claimantId?.email}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Respondent (Seller)</h3>
                    <div className="bg-white border p-3 rounded-lg">
                      <p className="font-semibold">{selectedDispute.respondentId?.fullName}</p>
                      <p className="text-sm text-gray-600">{selectedDispute.respondentId?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Resolution Form (Only if OPEN or IN_REVIEW) */}
                {(selectedDispute.status === 'OPEN' || selectedDispute.status === 'IN_REVIEW') && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Resolution</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Note</label>
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Explain the resolution decision..."
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (to Buyer)</label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="0"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter 0 if denying the claim (paying seller).</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleResolve('REFUND_BUYER')}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                      >
                        {processing ? 'Processing...' : 'Refund Buyer (Accept Claim)'}
                      </button>
                      <button
                        onClick={() => handleResolve('PAY_SELLER')}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        {processing ? 'Processing...' : 'Pay Seller (Deny Claim)'}
                      </button>
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
    </div>
  );
};
