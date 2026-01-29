import React, { useState } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
}

export const SellerNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      title: 'Đơn Hàng Mới',
      message: 'Nguyễn Văn A vừa mua Trek X-Caliber với giá 15.5M',
      timestamp: '5 phút trước',
      read: false,
      icon: '🛒',
    },
    {
      id: '2',
      type: 'message',
      title: 'Tin Nhắn Mới',
      message: 'Trần Thị B gửi cho bạn một tin nhắn: "Sản phẩm còn hàng không?"',
      timestamp: '10 phút trước',
      read: false,
      icon: '💬',
    },
    {
      id: '3',
      type: 'review',
      title: 'Đánh Giá Mới',
      message: 'Phạm Văn C đánh giá 5 sao cho Specialized Rockhopper',
      timestamp: '1 giờ trước',
      read: true,
      icon: '⭐',
    },
    {
      id: '4',
      type: 'system',
      title: 'Thông Báo Hệ Thống',
      message: 'Gói Premium của bạn sẽ hết hạn trong 5 ngày',
      timestamp: '2 giờ trước',
      read: true,
      icon: '⚙️',
    },
    {
      id: '5',
      type: 'payment',
      title: 'Thanh Toán',
      message: 'Đơn hàng #ORD001 đã được thanh toán. Số tiền: 15.5M',
      timestamp: '3 giờ trước',
      read: true,
      icon: '💰',
    },
    {
      id: '6',
      type: 'inspection',
      title: 'Kiểm Định',
      message: 'Sản phẩm #LST001 đã hoàn thành kiểm định',
      timestamp: '5 giờ trước',
      read: true,
      icon: '✓',
    },
  ]);

  const [filterType, setFilterType] = useState('all');
  const [showRead, setShowRead] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    const typeMatch = filterType === 'all' || n.type === filterType;
    const readMatch = showRead || !n.read;
    return typeMatch && readMatch;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleDeleteAll = () => {
    if (confirm('Bạn chắc chắn muốn xóa tất cả thông báo?')) {
      setNotifications([]);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-800';
      case 'message':
        return 'bg-green-100 text-green-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment':
        return 'bg-purple-100 text-purple-800';
      case 'inspection':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      order: 'Đơn Hàng',
      message: 'Tin Nhắn',
      review: 'Đánh Giá',
      payment: 'Thanh Toán',
      inspection: 'Kiểm Định',
      system: 'Hệ Thống',
    };
    return labels[type] || 'Thông Báo';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🔔 Thông Báo
              </h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                ✓ Đánh Dấu Tất Cả Đã Đọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-md:items-center">
            <div className="flex items-center gap-2">
              <div className="text-2xl">⚙️</div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">Tất cả loại</option>
                <option value="order">Đơn Hàng</option>
                <option value="message">Tin Nhắn</option>
                <option value="review">Đánh Giá</option>
                <option value="payment">Thanh Toán</option>
                <option value="inspection">Kiểm Định</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={showRead}
                onChange={(e) => setShowRead(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-accent"
              />
              <span className="text-sm text-gray-700">Hiển thị đã đọc</span>
            </label>

            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                🗑️ Xóa Tất Cả
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border-l-4 p-6 transition-all ${
                  notification.read
                    ? 'bg-white border-l-gray-300'
                    : 'bg-blue-50 border-l-accent'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <span className="text-3xl flex-shrink-0">{notification.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      <p className="text-sm text-gray-500">{notification.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Đánh dấu đã đọc"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-gray-500 text-lg">Không có thông báo</p>
            </div>
          )}
        </div>

        {/* Stats */}
        {notifications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-8">
            {[
              { label: 'Tổng', count: notifications.length, color: 'bg-gray-100' },
              { label: 'Chưa Đọc', count: unreadCount, color: 'bg-blue-100' },
              { label: 'Đơn Hàng', count: notifications.filter(n => n.type === 'order').length, color: 'bg-blue-100' },
              { label: 'Tin Nhắn', count: notifications.filter(n => n.type === 'message').length, color: 'bg-green-100' },
              { label: 'Đánh Giá', count: notifications.filter(n => n.type === 'review').length, color: 'bg-yellow-100' },
              { label: 'Thanh Toán', count: notifications.filter(n => n.type === 'payment').length, color: 'bg-purple-100' },
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} rounded-lg p-4 text-center`}>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
