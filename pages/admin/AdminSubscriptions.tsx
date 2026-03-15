import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';

interface Plan {
  _id?: string;
  name: string;
  displayName: string;
  price: number;
  commissionRate: number;
  maxListingsPerMonth: number;
  features: string[];
  isActive?: boolean;
}

interface Stats {
  totalSubscribers: number;
  byPlan: Record<string, number>;
  monthlyRevenue: number;
  estimatedAnnualRevenue?: number;
  plans?: Plan[];
}

export const AdminSubscriptions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/subscriptions/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.data) setData(json.data);
      else setError(json.message || 'Failed to load');
    } catch (e) {
      setError(isConnectionError(e) ? CONNECTION_ERROR_MESSAGE : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/subscriptions/admin/plans/${editingPlan.name}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editingPlan.displayName,
          price: editingPlan.price,
          commissionRate: editingPlan.commissionRate,
          maxListingsPerMonth: editingPlan.maxListingsPerMonth,
          isActive: editingPlan.isActive,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setEditingPlan(null);
        fetchStats();
      } else alert(json.message || 'Failed');
    } catch (e) {
      alert('Error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  if (loading) return <div className="p-6 flex justify-center"><div className="animate-spin h-10 w-10 border-2 border-gray-900 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="p-6"><div className="p-4 bg-red-50 rounded-lg text-red-700">{error}</div></div>;

  const plans = data?.plans || [];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản lý gói đăng ký</h1>

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase">Tổng đăng ký</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalSubscribers ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase">Doanh thu/tháng (ước)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.monthlyRevenue ?? 0)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase">Doanh thu/năm (ước)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.estimatedAnnualRevenue ?? 0)}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <h2 className="text-lg font-bold p-4 border-b border-gray-200">Các gói</h2>
          <div className="divide-y divide-gray-100">
            {plans.map((plan) => (
              <div key={plan.name} className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">{plan.displayName} ({plan.name})</p>
                  <p className="text-sm text-gray-600">{formatCurrency(plan.price)}/tháng · {plan.maxListingsPerMonth} tin/tháng · Hoa hồng {(plan.commissionRate * 100).toFixed(0)}%</p>
                </div>
                <button
                  onClick={() => setEditingPlan({ ...plan })}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >Chỉnh sửa</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Chỉnh sửa gói: {editingPlan.name}</h3>
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium">Tên hiển thị</label>
              <input type="text" value={editingPlan.displayName} onChange={(e) => setEditingPlan(p => p ? { ...p, displayName: e.target.value } : null)} className="w-full border rounded-lg px-3 py-2" />
              <label className="block text-sm font-medium">Giá (VND/tháng)</label>
              <input type="number" value={editingPlan.price} onChange={(e) => setEditingPlan(p => p ? { ...p, price: Number(e.target.value) } : null)} className="w-full border rounded-lg px-3 py-2" />
              <label className="block text-sm font-medium">Hoa hồng (0–1, ví dụ 0.12 = 12%)</label>
              <input type="number" step="0.01" value={editingPlan.commissionRate} onChange={(e) => setEditingPlan(p => p ? { ...p, commissionRate: Number(e.target.value) } : null)} className="w-full border rounded-lg px-3 py-2" />
              <label className="block text-sm font-medium">Số tin tối đa/tháng (-1 = không giới hạn)</label>
              <input type="number" value={editingPlan.maxListingsPerMonth} onChange={(e) => setEditingPlan(p => p ? { ...p, maxListingsPerMonth: Number(e.target.value) } : null)} className="w-full border rounded-lg px-3 py-2" />
              {editingPlan.isActive !== undefined && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editingPlan.isActive} onChange={(e) => setEditingPlan(p => p ? { ...p, isActive: e.target.checked } : null)} />
                  <span className="text-sm">Kích hoạt</span>
                </label>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingPlan(null)} className="px-4 py-2 border rounded-lg">Hủy</button>
              <button onClick={handleUpdatePlan} disabled={saving} className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
