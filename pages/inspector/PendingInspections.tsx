import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InspectorSidebar } from '../../components/InspectorSidebar';
import { InspectorHeader } from '../../components/InspectorHeader';

interface PendingInspection {
  id: string;
  orderId: string;
  order: {
    id: string;
    status: string;
    amount: number;
    listingId: {
      title: string;
      brand: string;
      model: string;
      type: string;
    };
    buyerId: {
      fullName: string;
      email: string;
    };
    sellerId: {
      fullName: string;
      email: string;
    };
  };
  assignedAt: string;
  deadline: string;
}

export const PendingInspections: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState<PendingInspection[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingInspections();
  }, []);

  const fetchPendingInspections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/inspections/pending', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInspections(data.data || []);
      } else {
        setError('Failed to load pending inspections');
      }
    } catch (error) {
      console.error('Error fetching pending inspections:', error);
      setError('Error loading pending inspections');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Pending Inspections</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading pending inspections...</p>
              </div>
            </div>
          ) : inspections.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-600">No pending inspections at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {inspections.map((inspection) => {
                const daysLeft = getDaysUntilDeadline(inspection.deadline);
                return (
                  <div key={inspection.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {inspection.order.listingId.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {inspection.order.listingId.brand} {inspection.order.listingId.model} ({inspection.order.listingId.type})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(inspection.order.amount)}
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${
                          daysLeft < 0 ? 'text-red-600' : daysLeft <= 1 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` : 
                           daysLeft === 0 ? 'Due today' : 
                           `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Buyer</p>
                        <p className="text-sm font-semibold text-gray-900">{inspection.order.buyerId.fullName}</p>
                        <p className="text-xs text-gray-600">{inspection.order.buyerId.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Seller</p>
                        <p className="text-sm font-semibold text-gray-900">{inspection.order.sellerId.fullName}</p>
                        <p className="text-xs text-gray-600">{inspection.order.sellerId.email}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600">Order ID</p>
                        <p className="text-sm font-mono text-gray-900">{inspection.orderId.substring(0, 8)}...</p>
                      </div>
                      <button
                        onClick={() => navigate(`/inspector/inspect/${inspection.orderId}`)}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                      >
                        Start Inspection
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
