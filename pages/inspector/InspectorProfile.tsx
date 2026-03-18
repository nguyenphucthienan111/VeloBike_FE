import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { InspectorSidebar } from '../../components/InspectorSidebar';
import { InspectorHeader } from '../../components/InspectorHeader';
import { API_BASE_URL } from '../../constants';

interface UserProfile {
  id: string;
  _id?: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: string;
  address?: {
    street?: string;
    district?: string;
    city?: string;
    province?: string;
    zipCode?: string;
  };
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  reputation?: { score: number; reviewCount: number };
  inspectorProfile?: {
    bio?: string;
    yearsOfExperience?: number;
    specializations?: string[];
    certificates?: Array<{ imageUrl: string }>;
  };
}

export const InspectorProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing] = useState(true); // Luôn cho phép chỉnh sửa, Save ở cuối form
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: {
      street: '',
      district: '',
      city: '',
      province: '',
    },
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Inspector profile fields
  const [inspectorForm, setInspectorForm] = useState({
    bio: '',
    yearsOfExperience: 0,
    specializations: '' as string, // comma-separated
  });
  const [certificates, setCertificates] = useState<Array<{ imageUrl: string }>>([]);
  const [certUploading, setCertUploading] = useState<boolean[]>([]);
  const [savingInspector, setSavingInspector] = useState(false);

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

      const response = await fetch('http://localhost:5000/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const profileData = data.data;
        setProfile(profileData);
        setFormData({
          fullName: profileData.fullName || '',
          phone: profileData.phone || '',
          address: {
            street: profileData.address?.street || '',
            district: profileData.address?.district || '',
            city: profileData.address?.city || '',
            province: profileData.address?.province || '',
          },
        });
        setAvatarPreview(profileData.avatar || null);
        if (profileData.inspectorProfile) {
          const ip = profileData.inspectorProfile;
          setInspectorForm({
            bio: ip.bio || '',
            yearsOfExperience: ip.yearsOfExperience || 0,
            specializations: (ip.specializations || []).join(', '),
          });
          setCertificates((ip.certificates || []).map((c: any) => ({ imageUrl: c.imageUrl || '' })));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
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

  const handleSaveInspectorProfile = async () => {
    try {
      setSavingInspector(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const payload = {
        bio: inspectorForm.bio,
        yearsOfExperience: Number(inspectorForm.yearsOfExperience),
        specializations: inspectorForm.specializations.split(',').map(s => s.trim()).filter(Boolean),
        certificates: certificates.filter(c => c.imageUrl).map(c => ({
          name: '',
          issuedBy: '',
          issuedYear: new Date().getFullYear(),
          imageUrl: c.imageUrl,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/users/me/inspector-profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess('Inspector profile updated!');
        await fetchProfile();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update');
      }
    } catch {
      setError('Error saving inspector profile');
    } finally {
      setSavingInspector(false);
    }
  };

  const addCertificate = () => {
    setCertificates(prev => [...prev, { imageUrl: '' }]);
    setCertUploading(prev => [...prev, false]);
  };

  const updateCertificate = (index: number, field: string, value: string | number) => {
    setCertificates(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const removeCertificate = (index: number) => {
    setCertificates(prev => prev.filter((_, i) => i !== index));
    setCertUploading(prev => prev.filter((_, i) => i !== index));
  };

  const handleCertImageUpload = async (index: number, file: File) => {
    setCertUploading(prev => prev.map((v, i) => i === index ? true : v));
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        updateCertificate(index, 'imageUrl', data.url || data.data?.url || '');
      }
    } catch (e) {
      console.error('Certificate upload failed', e);
    } finally {
      setCertUploading(prev => prev.map((v, i) => i === index ? false : v));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const body = {
        fullName: formData.fullName,
        phone: formData.phone || '',
        address: {
          street: formData.address.street || '',
          district: formData.address.district || '',
          city: formData.address.city || '',
          province: formData.address.province || '',
        },
        avatar: avatarPreview || profile?.avatar || '',
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
      <div className="flex min-h-screen bg-gray-100">
        <InspectorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <InspectorSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <InspectorHeader />
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
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

          {/* Horizontal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Photo */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Photo</h2>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden mb-4">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm">No photo</span>
                    )}
                  </div>
                  <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="text-sm w-full"
                    />
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Account Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-semibold text-gray-900">{profile?.role || 'INSPECTOR'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-semibold ${
                      profile?.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profile?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email Verified</span>
                    <span className={`text-sm font-semibold ${
                      profile?.emailVerified ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {profile?.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {profile?.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reputation Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Reputation</h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl font-bold text-gray-900">
                    {profile?.reputation?.score?.toFixed(1) ?? '5.0'}
                  </span>
                  <div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => {
                        const score = profile?.reputation?.score ?? 5;
                        return (
                          <Star key={s} size={16}
                            className={s <= Math.round(score) ? 'text-yellow-400' : 'text-gray-300'}
                            fill={s <= Math.round(score) ? 'currentColor' : 'none'} />
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {profile?.reputation?.reviewCount ?? 0} đánh giá
                    </p>
                  </div>
                </div>
                <button onClick={() => navigate('/inspector/reviews')}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 underline text-left">
                  Xem tất cả đánh giá →
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={false}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                        'focus:outline-none focus:border-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={false}
                      placeholder="Enter your phone number"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                        'focus:outline-none focus:border-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Address Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      disabled={false}
                      placeholder="Enter your street address"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                        'focus:outline-none focus:border-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">District</label>
                    <input
                      type="text"
                      name="address.district"
                      value={formData.address.district}
                      onChange={handleInputChange}
                      disabled={false}
                      placeholder="Enter your district"
                      className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                        'focus:outline-none focus:border-gray-900'
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        disabled={false}
                        placeholder="Enter your city"
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                          'focus:outline-none focus:border-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Province</label>
                      <input
                        type="text"
                        name="address.province"
                        value={formData.address.province}
                        onChange={handleInputChange}
                        disabled={false}
                        placeholder="Enter your province"
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                          'focus:outline-none focus:border-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspector Profile */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Inspector Profile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bio</label>
                    <textarea
                      value={inspectorForm.bio}
                      onChange={(e) => setInspectorForm(p => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      placeholder="Describe your experience and expertise..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Years of Experience</label>
                    <input
                      type="number"
                      min={0}
                      value={inspectorForm.yearsOfExperience}
                      onChange={(e) => setInspectorForm(p => ({ ...p, yearsOfExperience: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Specializations <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                    <input
                      type="text"
                      value={inspectorForm.specializations}
                      onChange={(e) => setInspectorForm(p => ({ ...p, specializations: e.target.value }))}
                      placeholder="e.g. Road Bikes, MTB, E-Bikes"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Certificates */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Certificates</h2>
                  <button
                    onClick={addCertificate}
                    className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    + Add
                  </button>
                </div>
                {certificates.length === 0 ? (
                  <p className="text-sm text-gray-500">No certificates added yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {certificates.map((cert, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg overflow-hidden relative group">
                        {/* Image preview */}
                        <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                          {cert.imageUrl ? (
                            <img src={cert.imageUrl} alt={`Certificate ${i + 1}`} className="w-full h-full object-cover" />
                          ) : certUploading[i] ? (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <div className="animate-spin h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full" />
                              <span className="text-xs">Uploading...</span>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-600 w-full h-full justify-center">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs">Click to upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleCertImageUpload(i, e.target.files[0])}
                              />
                            </label>
                          )}
                        </div>
                        {/* Re-upload overlay when image exists */}
                        {cert.imageUrl && !certUploading[i] && (
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <span className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">Change image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handleCertImageUpload(i, e.target.files[0])}
                            />
                          </label>
                        )}
                        {/* Remove button */}
                        <button
                          onClick={() => removeCertificate(i)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <div className="px-2 py-1.5 bg-white border-t border-gray-100">
                          <p className="text-xs text-gray-500 text-center">Certificate #{i + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSaveInspectorProfile}
                    disabled={savingInspector}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    {savingInspector ? 'Saving...' : 'Save Inspector Profile'}
                  </button>
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
        </div>
      </div>
    </div>
  );
};
