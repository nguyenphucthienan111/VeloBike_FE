import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Listing {
  id: string;
  name: string;
  type: string;
  price: number;
  views: number;
  status: string;
  createdAt: string;
}

export const SellerInventory: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([
    {
      id: '1',
      name: 'Trek X-Caliber',
      type: 'MTB',
      price: 15500000,
      views: 245,
      status: 'Active',
      createdAt: '2026-01-15',
    },
    {
      id: '2',
      name: 'Giant Talon',
      type: 'MTB',
      price: 12300000,
      views: 189,
      status: 'Active',
      createdAt: '2026-01-18',
    },
    {
      id: '3',
      name: 'Specialized Rockhopper',
      type: 'MTB',
      price: 10800000,
      views: 156,
      status: 'Pending',
      createdAt: '2026-01-20',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredListings = listings.filter(listing => {
    const matchSearch = listing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All' || listing.type === filterType;
    const matchStatus = filterStatus === 'All' || listing.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleDeleteListing = (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) {
      setListings(listings.filter(l => l.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Kho Hàng</h1>
            <p className="text-gray-600 mt-1">Tổng cộng: {listings.length} sản phẩm</p>
          </div>
          <button
            onClick={() => navigate('/seller/add-listing')}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            + Thêm Sản Phẩm
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="All">Tất cả loại</option>
              <option value="MTB">MTB</option>
              <option value="ROAD">Road</option>
              <option value="GRAVEL">Gravel</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sản Phẩm</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Giá</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Lượt Xem</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trạng Thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ngày Tạo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredListings.length > 0 ? (
                  filteredListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{listing.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          {listing.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(listing.price)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">#</span>
                          {listing.views}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(listing.status)}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(listing.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/seller/edit-listing/${listing.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Sản Phẩm Hoạt Động</p>
            <p className="text-3xl font-bold text-gray-900">
              {listings.filter(l => l.status === 'Active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tổng Lượt Xem</p>
            <p className="text-3xl font-bold text-gray-900">
              {listings.reduce((sum, l) => sum + l.views, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tổng Doanh Thu</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(listings.reduce((sum, l) => sum + l.price, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
