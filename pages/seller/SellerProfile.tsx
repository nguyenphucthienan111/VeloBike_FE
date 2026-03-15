import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../constants';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  address?: { street?: string; city?: string; province?: string };
}

export const SellerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const profileData = data.data;
        setProfile(profileData);
        const addr = profileData.address || {};
        setFormData({
          fullName: profileData.fullName || '',
          phone: profileData.phone || '',
          address: (typeof addr === 'string' ? addr : addr.street) || '',
          city: (typeof addr === 'object' ? addr.city : '') || '',
          province: (typeof addr === 'object' ? addr.province : '') || '',
        });
        setAvatarPreview(profileData.avatar || null);
        // Cập nhật header: sync fullName, avatar vào localStorage để Layout/SellerHeader hiển thị đúng
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            localStorage.setItem('user', JSON.stringify({
              ...user,
              fullName: profileData.fullName ?? user.fullName,
              avatar: profileData.avatar !== undefined ? profileData.avatar : user.avatar,
            }));
            window.dispatchEvent(new Event('authChange'));
          }
        } catch (_) {}
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('accessToken');

      const body = {
        fullName: formData.fullName,
        phone: formData.phone || '',
        address: {
          street: formData.address || '',
          city: formData.city || '',
          province: formData.province || '',
        },
      };

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setAvatarFile(null);
        await fetchProfile();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Banner */}
          {/* Content */}
          <div className="grid grid-cols-3 gap-6">
            {/* Avatar Section */}
            <div className="col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Avatar</h2>
                <div className="mb-4">
                  <div className="w-full aspect-square rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400">No avatar</span>
                    )}
                  </div>
                </div>
                
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full text-sm"
                  />
              </div>
            </div>

            {/* Profile Information */}
            <div className="col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>
                
                <div className="space-y-4">
                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    />
                  </div>

                </div>
              </div>

              {/* Address (BE: address.street, address.city, address.province) */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Street</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Province / Country</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        placeholder="Province or country"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => fetchProfile()}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors font-medium"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
            </div>
          </div>
    </div>
  );
};
