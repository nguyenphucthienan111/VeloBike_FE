import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Listing {
  _id: string;
  title: string;
  type: string;
  amount: number;
  views: number;
  status: string;
  createdAt: string;
}

export const SellerInventory: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả loại');
  const [filterDate, setFilterDate] = useState('Tất cả trạng thái');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('PUBLISHED');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/listings/my-listings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.data || []);
        console.log('📦 Listings fetched:', data.data);
      } else {
        console.error('Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const handleSelectListing = (id: string) => {
    setSelectedListings(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedListings.length === filteredListings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(filteredListings.map(l => l._id));
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setListings(listings.filter(l => l._id !== id));
        alert('Xóa sản phẩm thành công!');
      } else {
        alert('Xóa sản phẩm thất bại');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Bạn chắc chắn muốn xóa ${selectedListings.length} sản phẩm?`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/bulk/listings/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingIds: selectedListings }),
      });

      if (response.ok) {
        setListings(listings.filter(l => !selectedListings.includes(l._id)));
        setSelectedListings([]);
        alert('Xóa thành công!');
      } else {
        alert('Xóa thất bại');
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedListings.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/bulk/listings/update-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingIds: selectedListings,
          status: bulkStatus,
        }),
      });

      if (response.ok) {
        setListings(listings.map(l =>
          selectedListings.includes(l._id) ? { ...l, status: bulkStatus } : l
        ));
        setSelectedListings([]);
        setShowBulkActions(false);
        alert('Cập nhật trạng thái thành công!');
      } else {
        alert('Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/listings/${id}/submit-approval`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setListings(listings.map(l =>
          l._id === id ? { ...l, status: 'PENDING_APPROVAL' } : l
        ));
        alert('Gửi phê duyệt thành công!');
      } else {
        alert('Gửi phê duyệt thất bại');
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'SOLD':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING_APPROVAL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-56 bg-white text-gray-900 p-6 sticky top-0 h-screen overflow-y-auto border-r border-gray-200">
        {/* Logo */}
        <div className="mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="text-xl font-extrabold tracking-tighter italic mb-2">
            VELO<span className="text-red-600">BIKE</span>
          </div>
          <p className="text-xs text-gray-500">Seller Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-8">
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/seller/inventory')}
            className="w-full text-left px-4 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Inventory
          </button>
          <button
            onClick={() => navigate('/seller/analytics')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Sales
          </button>
          <button
            onClick={() => navigate('/seller/orders')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Customers
          </button>
          <button
            onClick={() => navigate('/seller/wallet')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Wallet
          </button>
          <button
            onClick={() => navigate('/seller/messages')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Messages
          </button>
          <button
            onClick={() => navigate('/seller/reviews')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Reviews
          </button>
          <button
            onClick={() => navigate('/seller/profile')}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Settings
          </button>
        </nav>

        {/* Storage Status */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <p className="text-xs text-gray-500 font-semibold mb-3">STORAGE STATUS</p>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-gray-500">{listings.length} of 100 listings</p>
          </div>
        </div>

        {/* Add Inventory Button */}
        <button 
          onClick={() => navigate('/seller/add-listing')}
          className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-bold"
        >
          + ADD INVENTORY
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-600 mt-1">Total: {listings.length} products</p>
            </div>
            <button
              onClick={() => navigate('/seller/add-product')}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              + Add Product
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedListings.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
              <span className="text-blue-900 font-medium">
                Selected {selectedListings.length} products
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Update Status
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Bulk Status Update Modal */}
          {showBulkActions && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex gap-3 items-center">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none"
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="SOLD">SOLD</option>
                </select>
                <button
                  onClick={handleBulkUpdateStatus}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex gap-4 mb-8">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option>All Types</option>
              <option>MTB</option>
              <option>Road</option>
              <option>Gravel</option>
            </select>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option>All Status</option>
              <option>PUBLISHED</option>
              <option>DRAFT</option>
              <option>SOLD</option>
            </select>
          </div>

          {/* Listings Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedListings.length === filteredListings.length && filteredListings.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Views</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredListings.length > 0 ? (
                  filteredListings.map((listing) => (
                    <tr key={listing._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedListings.includes(listing._id)}
                          onChange={() => handleSelectListing(listing._id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/seller/listing/${listing._id}`)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {listing.title}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{listing.type}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(listing.amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="text-gray-400">#</span> {listing.views}
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
                            onClick={() => navigate(`/seller/edit-listing/${listing._id}`)}
                            className="text-blue-600 hover:underline text-sm font-medium"
                          >
                            Edit
                          </button>
                          {listing.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSubmitForApproval(listing._id)}
                              className="text-green-600 hover:underline text-sm font-medium"
                            >
                              Submit
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteListing(listing._id)}
                            className="text-red-600 hover:underline text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <p className="text-gray-500">No products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stats Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm mb-3">Active Products</p>
              <p className="text-4xl font-bold text-gray-900">
                {listings.filter(l => l.status === 'PUBLISHED').length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm mb-3">Total Views</p>
              <p className="text-4xl font-bold text-gray-900">
                {listings.reduce((sum, l) => sum + l.views, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm mb-3">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(listings.reduce((sum, l) => sum + l.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
