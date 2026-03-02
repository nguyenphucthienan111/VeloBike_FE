import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerHeaderUserMenu } from '../../components/SellerHeaderUserMenu';
import { Toast, useToast } from '../../components/Toast';

interface Listing {
  _id: string;
  title: string;
  type: string;
  amount: number;
  views: number;
  status: string;
  createdAt: string;
  media?: {
    thumbnails?: string[];
  };
  pricing?: {
    amount: number;
  };
}

export const SellerInventory: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Types');
  const [filterDate, setFilterDate] = useState('All Status');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('PUBLISHED');
  const [user, setUser] = useState<any>(null);
  const { toast, showToast, hideToast } = useToast();

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
    if (!value || isNaN(value)) return '0 VNĐ';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setListings(listings.filter(l => l._id !== id));
        showToast('Product deleted successfully!', 'success');
      } else {
        showToast('Failed to delete product', 'error');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      showToast('An error occurred', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedListings.length} products?`)) return;

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
        alert('Deleted successfully!');
      } else {
        alert('Delete failed');
      }
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('An error occurred');
    }
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedListings.length === 0) {
      alert('Please select at least 1 product');
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
        showToast('Status updated successfully!', 'success');
      } else {
        showToast('Update failed', 'error');
      }
    } catch (error) {
      console.error('Error bulk updating:', error);
      showToast('An error occurred', 'error');
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
        showToast('Submitted for approval successfully!', 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to submit for approval', 'error');
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
      showToast('An error occurred', 'error');
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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
    <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-600 mt-1">Total: {listings.length} products</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/seller/add-product')}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                + Add Product
              </button>
              <SellerHeaderUserMenu user={user} />
            </div>
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
                        <div className="flex items-center gap-3">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {listing.media?.thumbnails?.[0] ? (
                              <img
                                src={listing.media.thumbnails[0]}
                                alt={listing.title}
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect fill='%23e5e7eb' width='48' height='48'/%3E%3Ctext fill='%239ca3af' x='24' y='26' font-size='10' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-400">No Image</span>
                              </div>
                            )}
                          </div>
                          {/* Product Name */}
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => navigate(`/seller/listing/${listing._id}`)}
                              className="font-medium text-blue-600 hover:underline text-left block truncate"
                            >
                              {listing.title}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{listing.type}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatCurrency(listing.pricing?.amount || listing.amount || 0)}
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
                        {new Date(listing.createdAt).toLocaleDateString('en-US')}
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
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
      duration={3000}
    />
    </div>
  );
};
