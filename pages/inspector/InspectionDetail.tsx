import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InspectorSidebar } from '../../components/InspectorSidebar';
import { InspectorHeader } from '../../components/InspectorHeader';

interface Checkpoint {
  component: string;
  status: string;
  observation?: string;
  severity?: string;
  evidenceImages?: string[];
}

interface InspectionDetail {
  id: string;
  orderId: string;
  overallVerdict: string;
  overallScore: number;
  grade: string;
  checkpoints: Checkpoint[];
  inspectorNote?: string;
  submittedAt: string;
  order: {
    status: string;
    listingId: {
      title: string;
      brand: string;
      model: string;
    };
  };
}

export const InspectionDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchInspectionDetail();
    }
  }, [orderId]);

  const fetchInspectionDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/inspections/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInspection(data.data);
      } else {
        setError('Failed to load inspection details');
      }
    } catch (error) {
      console.error('Error fetching inspection detail:', error);
      setError('Error loading inspection details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'FAIL': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <InspectorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inspection details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <InspectorSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error || 'Inspection not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <InspectorSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <InspectorHeader />
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Inspection Report</h1>
            <button
              onClick={() => navigate('/inspector/history')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to History
            </button>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Listing</p>
                <p className="font-semibold text-gray-900">{inspection.order.listingId.title}</p>
                <p className="text-xs text-gray-600">
                  {inspection.order.listingId.brand} {inspection.order.listingId.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Verdict</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getVerdictColor(inspection.overallVerdict)}`}>
                  {inspection.overallVerdict}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Score</p>
                <p className="font-semibold text-gray-900">{inspection.overallScore.toFixed(1)} / 10</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Grade</p>
                <p className={`text-3xl font-bold ${getGradeColor(inspection.grade)}`}>
                  {inspection.grade}
                </p>
              </div>
            </div>
          </div>

          {/* Checkpoints */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Checkpoints</h2>
            <div className="space-y-4">
              {inspection.checkpoints.map((checkpoint, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{checkpoint.component}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(checkpoint.status)}`}>
                      {checkpoint.status}
                    </span>
                  </div>
                  {checkpoint.severity && (
                    <p className="text-sm text-gray-600 mb-2">
                      Severity: <span className="font-semibold">{checkpoint.severity}</span>
                    </p>
                  )}
                  {checkpoint.observation && (
                    <p className="text-sm text-gray-700 mb-2">{checkpoint.observation}</p>
                  )}
                  {checkpoint.evidenceImages && checkpoint.evidenceImages.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {checkpoint.evidenceImages.map((url, imgIndex) => (
                        <img key={imgIndex} src={url} alt="Evidence" className="w-24 h-24 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inspector Note */}
          {inspection.inspectorNote && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Inspector Note</h2>
              <p className="text-gray-700">{inspection.inspectorNote}</p>
            </div>
          )}

          {/* Submission Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">
              Submitted on {new Date(inspection.submittedAt).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Order ID: <span className="font-mono">{inspection.orderId}</span>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
