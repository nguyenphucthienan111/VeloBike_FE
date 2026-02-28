import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { handleSessionExpired } from '../../utils/auth';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const BuyerNotifications: React.FC = () => {
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in to view notifications.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/notifications?page=1&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || 'Không tải được thông báo.';
        if (res.status === 401 && (msg.includes('authorized') || msg.includes('token'))) {
          handleSessionExpired();
          return;
        }
        setError(msg);
        setList([]);
        setLoading(false);
        return;
      }
      setList(data?.data || []);
    } catch (e: any) {
      setError(isConnectionError(e) ? CONNECTION_ERROR_MESSAGE : 'Failed to load notifications.');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setList((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (_) {}
  };

  const unreadCount = list.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Bell size={28} className="text-accent" />
        Notifications
        {unreadCount > 0 && (
          <span className="bg-accent text-white text-sm font-bold px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </h1>

      {loading && (
        <div className="text-gray-500 py-8">Loading...</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-6">{error}</div>
      )}
      {!loading && !error && list.length === 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center text-gray-600">
          No notifications yet.
        </div>
      )}
      {!loading && list.length > 0 && (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {list.map((n) => (
            <li
              key={n._id}
              className={`p-4 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-accent/5' : ''}`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-gray-600 text-sm mt-1">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => markAsRead(n._id)}
                    className="flex-shrink-0 text-xs font-medium text-accent hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
