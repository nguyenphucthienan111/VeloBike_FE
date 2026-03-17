import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast, useToast } from '../../components/Toast';
import { API_BASE_URL } from '../../constants';
import { useCatalog, CatalogBrand, CatalogCategory } from '../../hooks/useCatalog';

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const { toast, showToast, hideToast } = useToast();
  const { brands, categories, getTypeForCategory, fetch: fetchCatalog, loading: catalogLoading } = useCatalog();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MTB',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    size: '',
    amount: '',
    videoUrl: '',
    inspectionRequired: true, // Default to true for safety
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string>('');

  // Double check KYC status
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'SELLER' && user.kycStatus !== 'VERIFIED' && user.kycStatus !== 'APPROVED') {
          showToast('Tài khoản chưa được xác thực KYC. Vui lòng hoàn tất xác thực.', 'error');
          navigate('/seller/kyc');
        }
      } catch {}
    }
    fetchCatalog();
  }, [navigate, fetchCatalog]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files) as File[];
      setUploadedImages(prev => [...prev, ...newImages]);
      
      newImages.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreviews(prev => [...prev, event.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedVideo(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoPreviews(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setUploadedVideo(null);
    setVideoPreviews('');
    setFormData(prev => ({ ...prev, videoUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    if (!formData.title || formData.title.length < 5 || formData.title.length > 200) {
      showToast('Title must be between 5 and 200 characters', 'warning');
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      showToast('Description must be at least 10 characters', 'warning');
      return;
    }

    if (!formData.brand || !formData.model || !formData.amount || !formData.size) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    if (uploadedImages.length === 0) {
      showToast('Please upload at least one image', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Dùng base64 data URL từ imagePreviews (tránh gọi upload API / Cloudinary)
      const thumbnails = imagePreviews.filter((url) => url && url.startsWith('data:'));

      if (thumbnails.length === 0) {
        showToast('Vui lòng chọn ảnh sản phẩm', 'error');
        setLoading(false);
        return;
      }

      let videoUrl = formData.videoUrl;

      // Create listing
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        generalInfo: {
          brand: formData.brand,
          model: formData.model,
          year: parseInt(formData.year.toString()),
          size: formData.size,
          condition: 'GOOD', // Default condition, can be added to form later
        },
        pricing: {
          amount: parseFloat(formData.amount), // Amount in VND (API expects VND)
          currency: 'VND', // API default is VND
        },
        media: {
          thumbnails: thumbnails,
          videoUrl: videoUrl || undefined,
        },
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231], // Default to Ho Chi Minh City, should be from geolocation or form
          address: 'Ho Chi Minh City', // Default address, should be from form
        },
        inspectionRequired: formData.inspectionRequired,
      };

      const response = await fetch(`${API_BASE_URL}/listings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast('Product added successfully! (Status: DRAFT)', 'success');
          setTimeout(() => {
            navigate('/seller/inventory');
          }, 1500);
        } else {
          showToast(data.message || 'Không thể tạo listing', 'error');
        }
      } else {
        const error = await response.json();
        const errorMessage = error.message || error.error || 'Error creating listing';
        
        // Log validation errors if available
        if (error.errors && Array.isArray(error.errors)) {
          console.error('Validation Errors:', error.errors);
          const errorDetails = error.errors.map((e: any) => e.message || e).join(', ');
          showToast(`${errorMessage}: ${errorDetails}`, 'error');
        } else {
          showToast(errorMessage, 'error');
        }
        
        console.error('API Error:', error);
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      showToast('Error adding product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate('/seller/inventory')}>Inventory</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Add New Product</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          </div>

          {/* Single Form Container */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-gray-200 p-8 space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                name="title"
                placeholder="Ví dụ: Specialized Tarmac SL7 2023"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
                minLength={5}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">5-200 characters</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                placeholder="Detailed description about bike condition, features, usage history..."
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y"
                rows={4}
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">At least 10 characters</p>
            </div>

            {/* Category (from admin) & Price */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bike Type *</label>
                <select
                  value={
                    categories.find(
                      (c: CatalogCategory) =>
                        getTypeForCategory(c.slug, c.name) === formData.type
                    )?.slug || ''
                  }
                  onChange={(e) => {
                    const slug = e.target.value;
                    const cat = categories.find((c: CatalogCategory) => c.slug === slug);
                    const mapped = cat ? getTypeForCategory(cat.slug, cat.name) : formData.type;
                    if (!mapped) return;
                    setFormData((prev) => ({ ...prev, type: mapped }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  required
                >
                  <option value="">{catalogLoading ? 'Loading categories...' : 'Select category'}</option>
                  {categories
                    .filter((c: CatalogCategory) => c.isActive)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cat) => (
                      <option key={cat._id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (VND) *</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="120000000"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Example: 120000000 (120 million VND)</p>
              </div>
            </div>

            {/* Inspection Required */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inspectionRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspectionRequired: e.target.checked }))}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 cursor-pointer">Yêu cầu kiểm định (Inspection Required)</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Nếu bật, buyer sẽ phải trả thêm 500,000 VNĐ phí kiểm định. 
                    Xe sẽ được inspector kiểm tra trước khi giao hàng, tăng độ tin cậy.
                  </p>
                  <p className="text-xs text-blue-700 mt-1 font-medium">
                    ✓ Khuyến nghị bật để tăng uy tín và bảo vệ cả buyer lẫn seller
                  </p>
                </div>
              </label>
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  required
                >
                  <option value="">
                    {catalogLoading ? 'Loading brands...' : 'Select a brand'}
                  </option>
                  {brands
                    .filter((b: CatalogBrand) => b.isActive)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((brand) => (
                      <option key={brand._id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                <input
                  type="text"
                  name="model"
                  placeholder="Ví dụ: Tarmac SL7, X-Caliber"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Year & Size */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size *</label>
                <input
                  type="text"
                  name="size"
                  placeholder="Ví dụ: 54, M, L, 29 Inch"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images <span className="text-red-500">*</span></label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <p className="text-gray-700 font-medium">Drag and drop images here or <span className="text-blue-600 underline">click to select</span></p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF - Max 5MB per image</p>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview} alt={`preview-${index}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Video <span className="text-gray-500 text-xs font-normal">(Optional)</span></label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer block">
                  <p className="text-gray-700 font-medium"><span className="text-blue-600 underline">Select video</span> or drag and drop here</p>
                  <p className="text-xs text-gray-500 mt-1">MP4, WebM - Max 100MB</p>
                </label>
              </div>

              {/* Video Preview */}
              {videoPreviews && (
                <div className="mt-4 relative">
                  <video src={videoPreviews} className="w-full h-48 object-cover rounded-lg border border-gray-200" controls />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/seller/inventory')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </span>
                ) : (
                  'Save Product'
                )}
              </button>
            </div>
          </form>
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
