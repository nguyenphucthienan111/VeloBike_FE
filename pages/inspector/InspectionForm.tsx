import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InspectorSidebar } from '../../components/InspectorSidebar';
import { InspectorHeader } from '../../components/InspectorHeader';
import { API_BASE_URL } from '../../constants';

interface ChecklistItem {
  component: string;
  category: string;
  required: boolean;
  description: string;
}

interface Checkpoint {
  component: string;
  status: 'PASS' | 'WARN' | 'FAIL' | '';
  observation: string;
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL' | '';
  evidenceImages: File[];
  evidenceImageUrls: string[];
}

interface OrderInfo {
  id: string;
  listingId: {
    title: string;
    brand: string;
    model: string;
    type: string;
    media: {
      thumbnails: string[];
    };
    generalInfo: {
      brand: string;
      model: string;
    };
  };
  buyerId: {
    fullName: string;
    email: string;
  };
  sellerId: {
    fullName: string;
    email: string;
  };
  amount: number;
}

export const InspectionForm: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [orderInfo, setOrderInfo] = useState<any>(null); // Changed type to any to match BE response structure flexibly
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [overallVerdict, setOverallVerdict] = useState<'PASSED' | 'FAILED' | 'SUGGEST_ADJUSTMENT' | ''>('');
  const [overallScore, setOverallScore] = useState<number | ''>('');
  const [inspectorNote, setInspectorNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // 1. Fetch Order Details
      const orderResponse = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrderInfo(orderData.data);
      }

      // 2. Fetch checklist based on order
      const checklistResponse = await fetch(`${API_BASE_URL}/inspections/checklist/order/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (checklistResponse.ok) {
        const checklistData = await checklistResponse.json();
        const items = checklistData.data?.checklist || [];
        setChecklist(items);
        
        // Initialize checkpoints
        const initialCheckpoints: Checkpoint[] = items.map((item: ChecklistItem) => ({
          component: item.component,
          status: '',
          observation: '',
          severity: '',
          evidenceImages: [],
          evidenceImageUrls: [],
        }));
        setCheckpoints(initialCheckpoints);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error loading inspection data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckpointChange = (index: number, field: keyof Checkpoint, value: any) => {
    const updated = [...checkpoints];
    updated[index] = { ...updated[index], [field]: value };
    
    // Reset severity if status is PASS
    if (field === 'status' && value === 'PASS') {
      updated[index].severity = '';
    }
    
    setCheckpoints(updated);
  };

  const handleImageUpload = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const token = localStorage.getItem('accessToken');
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.data.url);
        }
      }

      const updated = [...checkpoints];
      updated[index].evidenceImageUrls = [...updated[index].evidenceImageUrls, ...uploadedUrls];
      setCheckpoints(updated);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images');
    }
  };

  const handleRemoveImage = (checkpointIndex: number, imageIndex: number) => {
    const updated = [...checkpoints];
    updated[checkpointIndex].evidenceImageUrls = updated[checkpointIndex].evidenceImageUrls.filter((_, i) => i !== imageIndex);
    setCheckpoints(updated);
  };

  const handleSubmit = async () => {
    // Validation
    const hasEmptyStatus = checkpoints.some(cp => !cp.status);
    if (hasEmptyStatus) {
      setError('Please fill in status for all checkpoints');
      return;
    }

    const hasInvalidSeverity = checkpoints.some(cp => 
      (cp.status === 'WARN' || cp.status === 'FAIL') && !cp.severity
    );
    if (hasInvalidSeverity) {
      setError('Please select severity for WARN/FAIL checkpoints');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('accessToken');
      const payload = {
        orderId,
        checkpoints: checkpoints.map(cp => ({
          component: cp.component,
          status: cp.status,
          observation: cp.observation || undefined,
          severity: cp.severity || undefined,
          evidenceImages: cp.evidenceImageUrls.length > 0 ? cp.evidenceImageUrls : undefined,
        })),
        overallVerdict: overallVerdict || undefined,
        overallScore: overallScore || undefined,
        inspectorNote: inspectorNote || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/inspections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess('Inspection submitted successfully!');
        setTimeout(() => {
          navigate('/inspector/history');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit inspection');
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      setError('Error submitting inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <InspectorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inspection form...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Inspection Form</h1>
            <button
              onClick={() => navigate('/inspector/pending')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Order Info Card */}
          {orderInfo && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex gap-6">
                <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  {orderInfo.listingId?.media?.thumbnails?.[0] ? (
                    <img 
                      src={orderInfo.listingId.media.thumbnails[0]} 
                      alt={orderInfo.listingId.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{orderInfo.listingId?.title}</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Brand/Model</p>
                      <p className="font-medium">{orderInfo.listingId?.generalInfo?.brand} {orderInfo.listingId?.generalInfo?.model}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium">{orderInfo.listingId?.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Buyer</p>
                      <p className="font-medium">{orderInfo.buyerId?.fullName} ({orderInfo.buyerId?.email})</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Seller</p>
                      <p className="font-medium">{orderInfo.sellerId?.fullName} ({orderInfo.sellerId?.email})</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Checkpoints */}
          <div className="space-y-6 mb-6">
            {checkpoints.map((checkpoint, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{checkpoint.component}</h3>
                
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Status *</label>
                    <select
                      value={checkpoint.status}
                      onChange={(e) => handleCheckpointChange(index, 'status', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    >
                      <option value="">Select status</option>
                      <option value="PASS">PASS</option>
                      <option value="WARN">WARN</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </div>

                  {/* Severity (if WARN or FAIL) */}
                  {(checkpoint.status === 'WARN' || checkpoint.status === 'FAIL') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Severity *</label>
                      <select
                        value={checkpoint.severity}
                        onChange={(e) => handleCheckpointChange(index, 'severity', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      >
                        <option value="">Select severity</option>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  )}

                  {/* Observation */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Observation</label>
                    <textarea
                      value={checkpoint.observation}
                      onChange={(e) => handleCheckpointChange(index, 'observation', e.target.value)}
                      placeholder="Enter observation notes..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
                    />
                  </div>

                  {/* Evidence Images */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Evidence Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(index, e.target.files)}
                      className="w-full text-sm"
                    />
                    {checkpoint.evidenceImageUrls.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {checkpoint.evidenceImageUrls.map((url, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img src={url} alt="Evidence" className="w-20 h-20 object-cover rounded border" />
                            <button
                              onClick={() => handleRemoveImage(index, imgIndex)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Assessment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Assessment</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Overall Verdict (Optional)</label>
                <select
                  value={overallVerdict}
                  onChange={(e) => setOverallVerdict(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                >
                  <option value="">Auto-calculate</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="SUGGEST_ADJUSTMENT">SUGGEST_ADJUSTMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Overall Score (Optional, 1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={overallScore}
                  onChange={(e) => setOverallScore(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="Auto-calculate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Inspector Note</label>
                <textarea
                  value={inspectorNote}
                  onChange={(e) => setInspectorNote(e.target.value)}
                  placeholder="Enter overall notes..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/inspector/pending')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Inspection'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
