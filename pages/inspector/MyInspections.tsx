import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InspectorSidebar } from '../../components/InspectorSidebar';
import { InspectorHeader } from '../../components/InspectorHeader';

interface Inspection {
  id: string;
  orderId: string;
  overallVerdict: string;
  overallScore: number;
  grade: string;
  submittedAt: string;
  order: {
    status: string;
    listingId: {
      title: string;
    };
  };
}

export const MyInspections: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });
  const [verdictFilter, setVerdictFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInspections();
  }, [pagination.page, verdictFilter]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (verdictFilter) {
        // Note: API might not support verdict filter, but we'll filter client-side
      }

      const response = await fetch(`http://localhost:5000/api/inspections/my-inspections?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        let filtered = data.data || [];
        
        // Client-side filter by verdict
        if (verdictFilter) {
          filtered = filtered.filter((insp: Inspection) => insp.overallVerdict === verdictFilter);
        }
        
        setInspections(filtered);
        setPagination(data.pagination || { total: filtered.length, page: 1, limit: 20, pages: 1 });
      } else {
        setError('Failed to load inspections');
      }
    } catch (error) {
      console.error('Error fetching inspections:', error);
      setError('Error loading inspections');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'PASSED': return 'text-green-600 bg-green-50';
      case 'FAILED': return 'text-red-600 bg-red-50';
      case 'SUGGEST_ADJUSTMENT': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <InspectorSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <InspectorHeader />
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Inspections</h1>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Verdict</label>
                <select
                  value={verdictFilter}
                  onChange={(e) => {
                    setVerdictFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                >
                  <option value="">All Verdicts</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="SUGGEST_ADJUSTMENT">SUGGEST_ADJUSTMENT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inspections Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading inspections...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Listing</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Verdict</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {inspections.map((inspection) => (
                        <tr key={inspection.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="text-sm font-mono text-gray-900">{inspection.orderId.substring(0, 8)}...</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{inspection.order.listingId.title}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getVerdictColor(inspection.overallVerdict)}`}>
                              {inspection.overallVerdict}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{inspection.overallScore.toFixed(1)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`text-2xl font-bold ${getGradeColor(inspection.grade)}`}>
                              {inspection.grade}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">
                              {new Date(inspection.submittedAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`/inspector/inspection/${inspection.orderId}`)}
                              className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} inspections
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
      </div>
    </div>
  );
};
