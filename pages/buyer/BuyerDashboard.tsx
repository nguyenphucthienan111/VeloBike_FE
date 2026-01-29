import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const BuyerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bảng Điều Khiển Người Mua
          </h1>
          <p className="mt-2 text-gray-600">
            Chào mừng, {user?.fullName || 'Khách hàng'}!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Đơn Hàng</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">8</div>
            <div className="text-blue-600 text-sm mt-2">Tổng cộng</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Đã Giao</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">6</div>
            <div className="text-green-600 text-sm mt-2">Hoàn thành</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Đang Giao</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">2</div>
            <div className="text-yellow-600 text-sm mt-2">Chờ nhận</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Tổng Chi</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">120M</div>
            <div className="text-blue-600 text-sm mt-2">VNĐ</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hành Động Nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/marketplace')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tìm Mua Xe
            </button>
            <button
              onClick={() => navigate('/buyer/orders')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Xem Đơn Hàng
            </button>
            <button
              onClick={() => navigate('/buyer/wishlist')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Yêu Thích
            </button>
            <button
              onClick={() => navigate('/buyer/profile')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Tài Khoản
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn Hàng Gần Đây</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Mã Đơn</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Sản Phẩm</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Giá</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Trạng Thái</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">#BUY001</td>
                  <td className="py-3 px-4">Trek X-Caliber</td>
                  <td className="py-3 px-4">15.5M</td>
                  <td className="py-3 px-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Đã Giao
                    </span>
                  </td>
                  <td className="py-3 px-4">20/01/2026</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">#BUY002</td>
                  <td className="py-3 px-4">Giant Talon</td>
                  <td className="py-3 px-4">12.3M</td>
                  <td className="py-3 px-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      Đang Giao
                    </span>
                  </td>
                  <td className="py-3 px-4">27/01/2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
