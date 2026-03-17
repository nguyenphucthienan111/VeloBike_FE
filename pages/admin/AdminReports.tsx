import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants';
import { Flag, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { AdminPageLayout, AdminPageHeader } from '../../components/AdminPageLayout';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';

interface Report {
  _id: string;
  reporterId: {
    _id: string;
    fullName: string;
    email: string;
  };
  listingId?: {
    _id: string;
    title: string;
    sellerId: string;
    generalInfo?: {
      brand: string;
    };
  };
  reason: string;
  description: string;
  evidence: string[];
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reviewedBy?: {
    _id: string;
    fullName: string;
  };
  reviewedAt?: string;
  createdAt: string;
}

export const AdminReports: React.FC = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Review Modal State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'REVIEWED' | 'RESOLVED' | 'DISMISSED'>('REVIEWED');
  const [adminNote, setAdminNote] = useState('');
  const [action, setAction] = useState<'NONE' | 'REMOVE_LISTING'>('NONE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [pagination.page, filterStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filterStatus && { status: filterStatus })
      });

      const response = await fetch(`${API_BASE_URL}/reports/admin/reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setReports(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else {
        addToast('error', data.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      addToast('error', 'Error fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/reports/admin/reports/${selectedReport._id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          adminNote,
          action: action === 'NONE' ? undefined : action
        })
      });

      const data = await response.json();
      if (data.success) {
        addToast('success', 'Report reviewed successfully');
        setSelectedReport(null);
        fetchReports();
      } else {
        addToast('error', data.message || 'Failed to review report');
      }
    } catch (error) {
      console.error('Error reviewing report:', error);
      addToast('error', 'Error reviewing report');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
      case 'REVIEWED':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Reviewed</span>;
      case 'RESOLVED':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Resolved</span>;
      case 'DISMISSED':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Dismissed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <AdminPageLayout>
      <div className="flex justify-between items-center mb-8">
        <AdminPageHeader title="Report management" subtitle="View and handle user reports" />
        <div className="flex gap-2">
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading reports...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No reports found</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {report.listingId ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.listingId.title}</p>
                          <p className="text-xs text-gray-500">{report.listingId.generalInfo?.brand}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Listing deleted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{report.reporterId.fullName}</div>
                      <div className="text-xs text-gray-500">{report.reporterId.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{report.reason}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs" title={report.description}>
                        {report.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setReviewStatus(report.status === 'PENDING' ? 'REVIEWED' : report.status as any);
                          setAdminNote('');
                          setAction('NONE');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Review Report</h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-bold">Reporter</span>
                    <p className="text-sm text-gray-900">{selectedReport.reporterId.fullName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-bold">Reason</span>
                    <p className="text-sm text-gray-900">{selectedReport.reason}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Description</span>
                  <p className="text-sm text-gray-900 mt-1">{selectedReport.description}</p>
                </div>
                {selectedReport.listingId && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-bold">Listing</span>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-900 font-medium">{selectedReport.listingId.title}</p>
                      <a 
                        href={`/products/${selectedReport.listingId._id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                      >
                        <Eye size={12} /> View Listing
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="REVIEWED">Reviewed (Under Investigation)</option>
                    <option value="RESOLVED">Resolved (Action Taken)</option>
                    <option value="DISMISSED">Dismissed (No Action)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Internal note about this report..."
                    required
                  />
                </div>

                {reviewStatus === 'RESOLVED' && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="text-sm font-bold text-red-900">Enforcement Action</span>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={action === 'REMOVE_LISTING'}
                        onChange={(e) => setAction(e.target.checked ? 'REMOVE_LISTING' : 'NONE')}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-red-800">Remove Listing (Reject & Hide)</span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Toast
        toasts={toasts}
        onRemove={removeToast}
      />
    </AdminPageLayout>
  );
};
