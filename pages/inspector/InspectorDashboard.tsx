import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InspectorSidebar } from '../../components/InspectorSidebar';
import { InspectorHeader } from '../../components/InspectorHeader';
import { API_BASE_URL } from '../../constants';

interface Stats {
  totalInspections: number;
  pendingInspections: number;
  completedInspections: number;
  passRate: number;
  averageScore: number;
}

interface Earnings {
  totalEarnings: number;
  pendingEarnings: number;
  completedEarnings: number;
  currency: string;
}

interface Inspection {
  _id: string;
  orderId: {
    _id: string;
    listingId: string;
  };
  overallVerdict: string;
  overallScore: number;
  grade: string;
  createdAt: string;
  listingId: string;
}

export const InspectorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [topInspections, setTopInspections] = useState<Inspection[]>([]);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const [statsResponse, earningsResponse, inspectionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/inspector/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/dashboard/inspector/earnings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/inspections/my-inspections?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const d = statsData.data;
        setStats({
          totalInspections: d?.totalInspections ?? 0,
          pendingInspections: d?.pendingInspections ?? 0,
          completedInspections: d?.totalInspections ?? 0,
          passRate: d?.passRate ?? 0,
          averageScore: d?.averageScore ?? 0,
        });
      }

      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setEarnings(earningsData.data || { totalEarnings: 0, pendingEarnings: 0, completedEarnings: 0, currency: 'VND' });
      }

      if (inspectionsResponse.ok) {
        const inspectionsData = await inspectionsResponse.json();
        const allInspections = inspectionsData.data || [];
        
        // Recent: First 5
        setRecentInspections(allInspections.slice(0, 5));
        
        // Top: Sort by score desc, take 5
        const sorted = [...allInspections].sort((a: Inspection, b: Inspection) => b.overallScore - a.overallScore);
        setTopInspections(sorted.slice(0, 5));
      }

    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Error loading dashboard');
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
            <p className="text-gray-600">Loading dashboard...</p>
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
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.fullName || 'Inspector'}!</p>
              </div>
            </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+8.2%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">TOTAL EARNINGS</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {earnings?.totalEarnings ? formatCurrency(earnings.totalEarnings) : '₫0.00'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+5.1%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">COMPLETED</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.completedInspections || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+3.2%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">PENDING</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.pendingInspections || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+1.5%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">PASS RATE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats?.passRate ? `${stats.passRate.toFixed(1)}%` : '0.0%'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <span className="text-green-600 text-sm font-semibold">+2.1%</span>
              </div>
              <p className="text-gray-600 text-xs font-semibold mt-4">AVG SCORE</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats?.averageScore ? stats.averageScore.toFixed(1) : '0.0'}
              </p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Recent Inspections */}
            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Recent Inspections</h2>
                <button onClick={() => navigate('/inspector/history')} className="text-purple-600 text-sm font-semibold hover:underline">VIEW ALL</button>
              </div>

              {recentInspections.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 px-2">Order ID</th>
                        <th className="pb-3 px-2">Verdict</th>
                        <th className="pb-3 px-2">Score</th>
                        <th className="pb-3 px-2">Date</th>
                        <th className="pb-3 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentInspections.map((insp) => (
                        <tr key={insp._id} className="hover:bg-gray-50">
                          <td className="py-3 px-2 text-sm font-mono text-gray-900">
                            {insp.orderId?._id?.substring(0, 8).toUpperCase() || 'N/A'}...
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getVerdictColor(insp.overallVerdict)}`}>
                              {insp.overallVerdict}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm font-semibold text-gray-900">
                            {insp.overallScore?.toFixed(1)} <span className={`text-xs ml-1 font-bold ${getGradeColor(insp.grade)}`}>({insp.grade})</span>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-500">
                            {new Date(insp.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button 
                              onClick={() => navigate(`/inspector/inspection/${insp.orderId._id}`)}
                              className="text-blue-600 text-xs font-semibold hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No inspections yet
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Top Inspections */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Inspections</h2>
                {topInspections.length > 0 ? (
                  <div className="space-y-4">
                    {topInspections.map((insp, index) => (
                      <div key={insp._id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Order #{insp.orderId?._id?.substring(0, 6).toUpperCase()}</p>
                            <p className="text-xs text-gray-500">{new Date(insp.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{insp.overallScore?.toFixed(1)}</p>
                          <p className={`text-xs font-bold ${getGradeColor(insp.grade)}`}>{insp.grade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No data yet
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/inspector/pending')}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-gray-900">New Inspection</p>
                    <p className="text-sm text-gray-600 mt-1">Start inspection</p>
                  </button>
                  <button
                    onClick={() => navigate('/inspector/history')}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-gray-900">View History</p>
                    <p className="text-sm text-gray-600 mt-1">View reports</p>
                  </button>
                  <button
                    onClick={() => navigate('/inspector/pending')}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-gray-900">Analytics</p>
                    <p className="text-sm text-gray-600 mt-1">View stats</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
