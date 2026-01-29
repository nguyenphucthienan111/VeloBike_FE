import React, { useState } from 'react';

export const SellerProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: 'ĐÌNH ÂN',
    email: 'kienptse173105@fpt.edu.vn',
    phone: '+84 912 345 678',
    shopName: 'VeloBike Premium Store',
    description: 'Cửa hàng chuyên cung cấp xe đạp chất lượng cao với giá cạnh tranh',
    city: 'Ho Chi Minh City',
    address: '123 Nguyen Hue Street, District 1',
    website: 'www.velobikepremium.com',
    businessLicense: 'KB123456789',
    taxId: 'TX987654321',
  });

  const [tempProfile, setTempProfile] = useState(profile);

  const handleEdit = () => {
    setIsEditing(true);
    setTempProfile(profile);
  };

  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempProfile(profile);
  };

  const handleChange = (field: string, value: string) => {
    setTempProfile({ ...tempProfile, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hồ Sơ Của Tôi</h1>
            <p className="text-gray-600 mt-1">Quản lý thông tin cửa hàng</p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            ✏️ Chỉnh Sửa
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          {/* Cover & Avatar */}
          <div className="h-32 bg-gradient-to-r from-accent to-red-600"></div>
          <div className="px-6 pb-6 relative">
            <div className="flex items-end gap-4 -mt-16 mb-6">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl">
                👤
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.shopName}</h2>
                <p className="text-gray-600">Người bán</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shop Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Thông Tin Cửa Hàng</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tên Cửa Hàng
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfile.shopName}
                      onChange={(e) => handleChange('shopName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.shopName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Mô Tả Cửa Hàng
                  </label>
                  {isEditing ? (
                    <textarea
                      value={tempProfile.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none h-20"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    🌐 Website
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfile.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-blue-600 hover:underline cursor-pointer">{profile.website}</p>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Thông Tin Cá Nhân</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    👤 Tên Đầy Đủ
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfile.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    📧 Email
                  </label>
                  <p className="text-gray-700">{profile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    ☎️ Số Điện Thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempProfile.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            📍 Địa Chỉ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Thành Phố</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfile.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              ) : (
                <p className="text-gray-700">{profile.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Địa Chỉ</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfile.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              ) : (
                <p className="text-gray-700">{profile.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Thông Tin Kinh Doanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Mã Kinh Doanh</label>
              <p className="text-gray-700">{profile.businessLicense}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Mã Số Thuế</label>
              <p className="text-gray-700">{profile.taxId}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              ✕ Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              💾 Lưu Thay Đổi
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tham Gia Từ</p>
            <p className="text-2xl font-bold text-gray-900">2024</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Đánh Giá</p>
            <p className="text-2xl font-bold text-yellow-600">4.8 ⭐</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Sản Phẩm Bán</p>
            <p className="text-2xl font-bold text-gray-900">156</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tỉ Lệ Hoàn Hàng</p>
            <p className="text-2xl font-bold text-green-600">0.5%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
