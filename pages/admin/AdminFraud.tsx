import React, { useState } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

type AnalyzeType = 'user' | 'listing' | 'order';

export const AdminFraud: React.FC = () => {
  const [type, setType] = useState<AnalyzeType>('user');
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/fraud/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.data) setStats(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  const handleAnalyze = async () => {
    if (!id.trim()) {
      alert('Nhập ID');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('accessToken');
      const path = type === 'user' ? `user/${id.trim()}` : type === 'listing' ? `listing/${id.trim()}` : `order/${id.trim()}`;
      const res = await fetch(`${API_BASE_URL}/fraud/analyze/${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setResult(data.data);
      else setError(data.message || 'Failed');
    } catch (e) {
      setError(isConnectionError(e) ? CONNECTION_ERROR_MESSAGE : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Phát hiện lừa đảo</h1>

        {stats && Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">{key}</p>
                <p className="text-xl font-bold text-gray-900">{typeof value === 'number' ? value : String(value)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Phân tích theo ID</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
              <select value={type} onChange={(e) => setType(e.target.value as AnalyzeType)} className="border rounded-lg px-3 py-2">
                <option value="user">User</option>
                <option value="listing">Listing</option>
                <option value="order">Order</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <input type="text" value={id} onChange={(e) => setId(e.target.value)} placeholder={type === 'user' ? 'User ID' : type === 'listing' ? 'Listing ID' : 'Order ID'} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <button onClick={handleAnalyze} disabled={loading} className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50">Phân tích</button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
        {result && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold mb-2">Kết quả</h3>
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
