import React, { useState } from 'react';

interface Order {
  id: string;
  orderId: string;
  buyerName: string;
  productName: string;
  price: number;
  status: string;
  date: string;
}

export const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderId: '#ORD001',
      buyerName: 'Nguyễn Văn A',
      productName: 'Trek X-Caliber',
      price: 15500000,
      status: 'Delivered',
      date: '28/01/2026',
    },
    {
      id: '2',
      orderId: '#ORD002',
      buyerName: 'Trần Thị B',
      productName: 'Giant Talon',
      price: 12300000,
      status: 'Shipping',
      date: '27/01/2026',
    },
    {
      id: '3',
      orderId: '#ORD003',
      buyerName: 'Phạm Văn C',
      productName: 'Specialized Rockhopper',
      price: 10800000,
      status: 'In Inspection',
      date: '26/01/2026',
    },
    {
      id: '4',
      orderId: '#ORD004',
      buyerName: 'Lê Thị D',
      productName: 'Trek X-Caliber',
      price: 15500000,
      status: 'Payment Confirmed',
      date: '25/01/2026',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Shipping':
        return 'bg-blue-100 text-blue-800';
      case 'In Inspection':
        return 'bg-yellow-100 text-yellow-800';
      case 'Payment Confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusNextAction = (status: string) => {
    switch (status) {
      case 'Payment Confirmed':
        return 'Update to Shipping';
      case 'In Inspection':
        return 'Awaiting Inspection';
      case 'Shipping':
        return 'Awaiting Delivery';
      case 'Delivered':
        return 'Completed';
      default:
        return 'View Details';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
          <p className="text-gray-600 mt-1">Tổng cộng: {orders.length} đơn hàng</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm mã đơn hàng, tên khách, tên sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Payment Confirmed">Thanh toán xác nhận</option>
              <option value="In Inspection">Đang kiểm định</option>
              <option value="Shipping">Đang giao hàng</option>
              <option value="Delivered">Đã giao</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mã Đơn</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Khách Hàng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sản Phẩm</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Giá</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trạng Thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ngày</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{order.orderId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{order.buyerName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 max-w-xs truncate">{order.productName}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(order.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {order.date}
                      </td>
                      <td className="px-6 py-4">
                        <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent hover:bg-red-50 rounded-lg transition-colors">
                          👁️ {getStatusNextAction(order.status)}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-4xl">📦</div>
                        <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tổng Đơn Hàng</p>
            <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Đang Xử Lý</p>
            <p className="text-3xl font-bold text-yellow-600">
              {orders.filter(o => ['Payment Confirmed', 'In Inspection', 'Shipping'].includes(o.status)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Đã Giao</p>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter(o => o.status === 'Delivered').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tổng Doanh Thu</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(orders.reduce((sum, o) => sum + o.price, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
