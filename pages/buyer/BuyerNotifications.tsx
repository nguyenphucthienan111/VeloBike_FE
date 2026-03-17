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
  const [markingAll, setMarkingAll] = useState(false);
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
        const msg = data?.message || 'Failed to load notifications.';
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

  useEffect(() => {
    const onRefresh = () => fetchNotifications();
    window.addEventListener('ordersAndNotificationsRefresh', onRefresh);
    return () => window.removeEventListener('ordersAndNotificationsRefresh', onRefresh);
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
      window.dispatchEvent(new Event('ordersAndNotificationsRefresh'));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('accessToken');
    const unreadCount = list.filter((n) => !n.isRead).length;
    if (!token || unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('ordersAndNotificationsRefresh'));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = list.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Bell size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Stay up to date on your orders, payments, and inspections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent text-xs font-semibold px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-accent" />
              {unreadCount} unread
            </span>
          )}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {markingAll ? 'Updating...' : 'Mark all as read'}
            </button>
          )}
        </div>
      </div>

      {/* Content card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mb-3" />
            <p className="text-sm">Loading notifications...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 text-red-700 px-6 py-4 text-sm">{error}</div>
        )}

        {!loading && !error && list.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-sm font-medium">No notifications yet.</p>
            <p className="text-xs mt-1">
              You’ll see updates here when there is activity on your account.
            </p>
          </div>
        )}

        {!loading && !error && list.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {list.map((n) => {
              const created = new Date(n.createdAt);
              const time = created.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });
              const date = created.toLocaleDateString();

              return (
                <li
                  key={n._id}
                  className={`px-6 py-4 transition-colors ${
                    !n.isRead ? 'bg-accent/5 hover:bg-accent/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          n.isRead ? 'bg-gray-300' : 'bg-accent'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {n.title || 'Notification'}
                        </p>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                          {time} · {date}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n._id)}
                        className="ml-2 text-[11px] font-medium text-accent hover:text-accent/80"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
