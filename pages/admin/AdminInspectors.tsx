import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Star } from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

type Tab = 'applications' | 'inspectors';

interface Certificate {
  name: string; issuedBy: string; issuedYear: number; imageUrl: string;
}
interface Application {
  _id: string; fullName: string; email: string; phone: string;
  yearsOfExperience: number; specializations: string[]; bio: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string;
  rejectionReason?: string; certificates: Certificate[];
  userId?: { fullName: string; email: string; kycStatus: string };
}
interface Inspector {
  _id: string; email: string; fullName: string; phone?: string;
  isActive: boolean; createdAt: string;
  reputation?: { score: number; reviewCount: number };
}

const statusBadge = (s: string) => ({
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}[s] || 'bg-gray-100 text-gray-800');

export const AdminInspectors: React.FC = () => {
  const [tab, setTab] = useState<Tab>('applications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState('PENDING');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });

  const token = () => localStorage.getItem('accessToken') || '';

  useEffect(() => {
    if (tab === 'applications') fetchApplications();
    else fetchInspectors();
  }, [tab, appStatusFilter, pagination.page]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/inspector-applications?status=${appStatusFilter}&limit=50`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) { const d = await res.json(); setApplications(d.data || []); }
      else setError('Failed to load applications');
    } catch (e) { setError(isConnectionError(e) ? CONNECTION_ERROR_MESSAGE : 'Error'); }
    finally { setLoading(false); }
  };

  const fetchInspectors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/inspectors?page=${pagination.page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) { const d = await res.json(); setInspectors(d.data); setPagination(d.pagination); }
      else setError('Failed to load inspectors');
    } catch (e) { setError(isConnectionError(e) ? CONNECTION_ERROR_MESSAGE : 'Error'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this application? The user will become an Inspector.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inspector-applications/${id}/approve`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) { setSelectedApp(null); fetchApplications(); }
      else { const d = await res.json(); setError(d.message); }
    } catch { setError('Error approving'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) { setError('Please enter a rejection reason'); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inspector-applications/${id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectReason }),
      });
      if (res.ok) { setSelectedApp(null); setRejectReason(''); fetchApplications(); }
      else { const d = await res.json(); setError(d.message); }
    } catch { setError('Error rejecting'); }
    finally { setActionLoading(false); }
  };

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Inspector Management" subtitle="Manage applications and active inspectors" />
      {error && <AdminErrorBanner message={error} />}

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {(['applications', 'inspectors'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
            {t === 'applications' ? 'Applications' : 'Active Inspectors'}
          </button>
        ))}
      </div>

      {tab === 'applications' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setAppStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${appStatusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? <AdminLoadingState message="Loading applications..." /> : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Applicant', 'Experience', 'Specializations', 'Certs', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left font-semibold text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No applications found</td></tr>
                  )}
                  {applications.map(app => (
                    <tr key={app._id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{app.fullName}</p>
                        <p className="text-slate-500 text-xs">{app.email}</p>
                        {app.userId && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${app.userId.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            KYC: {app.userId.kycStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{app.yearsOfExperience} năm</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {app.specializations.map(s => (
                            <span key={s} className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{app.certificates.length}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${statusBadge(app.status)}`}>{app.status}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => { setSelectedApp(app); setRejectReason(''); setError(''); }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'inspectors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? <AdminLoadingState message="Loading inspectors..." /> : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Inspector', 'Contact', 'Rating', 'Status', 'Joined'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left font-semibold text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspectors.map(inspector => (
                    <tr key={inspector._id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{inspector.fullName}</p>
                        <p className="text-slate-500 text-xs">{inspector.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{inspector.phone || 'N/A'}</td>
                      <td className="px-5 py-3.5">
                        {inspector.reputation && inspector.reputation.reviewCount > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star size={13} className="text-yellow-400" fill="currentColor" />
                            <span className="font-medium">{inspector.reputation.score.toFixed(1)}</span>
                            <span className="text-slate-400 text-xs">({inspector.reputation.reviewCount})</span>
                          </div>
                        ) : <span className="text-slate-400 text-xs">No reviews</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${inspector.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                          {inspector.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{new Date(inspector.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/50">
                <p className="text-sm text-slate-600">{pagination.total} inspectors</p>
                <div className="flex gap-2">
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm disabled:opacity-50">Previous</button>
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.pages}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm disabled:opacity-50">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedApp.fullName}</h2>
                <p className="text-sm text-slate-500">{selectedApp.email} · {selectedApp.phone}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${statusBadge(selectedApp.status)}`}>{selectedApp.status}</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">Kinh nghiệm</p><p className="font-medium">{selectedApp.yearsOfExperience} năm</p></div>
                <div><p className="text-slate-500">Chuyên môn</p><p className="font-medium">{selectedApp.specializations.join(', ') || 'N/A'}</p></div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Giới thiệu</p>
                <p className="text-sm text-slate-800 bg-slate-50 rounded p-3">{selectedApp.bio}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Chứng chỉ ({selectedApp.certificates.length})</p>
                <div className="space-y-3">
                  {selectedApp.certificates.map((cert, i) => (
                    <div key={i} className="flex gap-4 border border-slate-200 rounded-lg p-3">
                      <img src={cert.imageUrl} alt={cert.name} className="w-20 h-14 object-cover rounded border flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-slate-900">{cert.name}</p>
                        <p className="text-xs text-slate-500">{cert.issuedBy} · {cert.issuedYear}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedApp.status === 'PENDING' && (
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lý do từ chối (nếu reject)</label>
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(selectedApp._id)} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => handleReject(selectedApp._id)} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              )}
              {selectedApp.status === 'REJECTED' && selectedApp.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">Lý do từ chối: {selectedApp.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setSelectedApp(null)} className="w-full py-2 border border-slate-200 rounded-lg text-slate-700 text-sm hover:bg-slate-50">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};
