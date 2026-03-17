import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  Package,
  Pencil,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { AdminPageLayout, AdminPageHeader, AdminErrorBanner, AdminLoadingState } from '../../components/AdminPageLayout';

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

const PLAN_ACCENTS: Record<string, string> = {
  FREE: 'border-l-slate-400',
  BASIC: 'border-l-blue-500',
  PRO: 'border-l-violet-500',
  PREMIUM: 'border-l-amber-500',
};

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

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const listingsLabel = (max: number) =>
    max < 0 ? 'Unlimited listings/month' : `${max} listings/month`;

  if (loading) {
    return (
      <AdminPageLayout>
        <AdminLoadingState message="Loading..." />
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout>
        <AdminErrorBanner message={error} />
      </AdminPageLayout>
    );
  }

  const plans = data?.plans || [];

  return (
    <AdminPageLayout>
      <AdminPageHeader title="Subscription Management" subtitle="Subscription statistics and plan editing" />

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-slate-400">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total subscribers</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{data.totalSubscribers ?? 0}</p>
                </div>
                <Users className="h-8 w-8 text-slate-400 shrink-0" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-emerald-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. monthly revenue</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(data.monthlyRevenue ?? 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500 shrink-0" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-emerald-600">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. annual revenue</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(data.estimatedAnnualRevenue ?? 0)}</p>
                </div>
                <Calendar className="h-8 w-8 text-emerald-600 shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* Packages */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-500" />
              Plans
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {plans.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No plans yet</div>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`px-5 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors border-l-4 ${PLAN_ACCENTS[plan.name] ?? 'border-l-slate-300'}`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {plan.displayName} <span className="text-slate-500 font-normal">({plan.name})</span>
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {formatCurrency(plan.price)}/month · {listingsLabel(plan.maxListingsPerMonth)} · Commission {(plan.commissionRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPlan({ ...plan })}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              ))
            )}
        </div>
      </div>

      {/* Edit modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit plan: {editingPlan.name}</h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto space-y-4">
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1">Display name</span>
                <input
                  type="text"
                  value={editingPlan.displayName}
                  onChange={(e) => setEditingPlan((p) => (p ? { ...p, displayName: e.target.value } : null))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 outline-none"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1">Price (VND/month)</span>
                <input
                  type="number"
                  min={0}
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan((p) => (p ? { ...p, price: Number(e.target.value) } : null))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 outline-none"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1">Commission (0–1, e.g. 0.12 = 12%)</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={editingPlan.commissionRate}
                  onChange={(e) => setEditingPlan((p) => (p ? { ...p, commissionRate: Number(e.target.value) } : null))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 outline-none"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1">Max listings/month (-1 = unlimited)</span>
                <input
                  type="number"
                  value={editingPlan.maxListingsPerMonth}
                  onChange={(e) => setEditingPlan((p) => (p ? { ...p, maxListingsPerMonth: Number(e.target.value) } : null))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-400 outline-none"
                />
              </label>
              {editingPlan.isActive !== undefined && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive}
                    onChange={(e) => setEditingPlan((p) => (p ? { ...p, isActive: e.target.checked } : null))}
                    className="rounded border-slate-300 text-slate-700 focus:ring-slate-400"
                  />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-2 justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePlan}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};
