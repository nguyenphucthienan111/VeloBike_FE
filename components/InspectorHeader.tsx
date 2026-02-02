import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export const InspectorHeader: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-xl font-extrabold tracking-tighter italic">
            VELO<span className="text-red-600">BIKE</span>
          </div>
          <p className="text-xs text-gray-500">Inspector Dashboard</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <span className="text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="outline-none text-sm w-40 text-gray-900" 
            />
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 relative"
            >
              <span className="text-gray-600">🔔</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                </div>
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}>
                        <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                        <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No notifications</div>
                )}
              </div>
            )}
          </div>
          
          {/* User Info */}
          <button 
            onClick={() => navigate('/inspector/profile')}
            className="flex items-center gap-3 pl-4 border-l border-gray-300 hover:opacity-80 transition-opacity"
          >
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{user?.fullName || 'Inspector'}</p>
              <p className="text-xs text-gray-500">INSPECTOR</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center font-bold text-white text-sm">
              {user?.fullName?.charAt(0) || 'I'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
