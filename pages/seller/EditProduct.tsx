import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useCatalog, CatalogBrand, CatalogCategory } from '../../hooks/useCatalog';
import { API_BASE_URL } from '../../constants';

export const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const { brands, categories, getTypeForCategory, fetch: fetchCatalog, loading: catalogLoading } = useCatalog();
  const [userLocation, setUserLocation] = useState({ address: 'Ho Chi Minh City', coordinates: [106.6297, 10.8231] });
  
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
    inspectionRequired: true,
    // Specs
    frameMaterial: '',
    groupset: '',
    brakeType: '',
    wheelset: '',
    suspensionType: '',
    travelFront: '',
    weight: '',
    motor: '',
    battery: '',
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string>('');
  const [existingVideo, setExistingVideo] = useState<string>('');

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Fetch seller profile để lấy địa chỉ thật
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    window.fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        const user = data.data;
        const parts = [user.address?.district, user.address?.city || user.address?.province].filter(Boolean);
        const addressStr = parts.join(', ') || user.address?.street || 'Ho Chi Minh City';
        setUserLocation(prev => ({ ...prev, address: addressStr }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        addToast('error', 'Please login');
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/listings/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const listing = data.data;
          setFormData({
            title: listing.title || '',
            description: listing.description || '',
            type: listing.type || 'MTB',
            brand: listing.generalInfo?.brand || '',
            model: listing.generalInfo?.model || '',
            year: listing.generalInfo?.year || new Date().getFullYear(),
            size: listing.generalInfo?.size || '',
            amount: listing.pricing?.amount?.toString() || '',
            videoUrl: listing.media?.videoUrl || '',
            inspectionRequired: listing.inspectionRequired !== undefined ? listing.inspectionRequired : true,
            frameMaterial: listing.specs?.frameMaterial || '',
            groupset: listing.specs?.groupset || '',
            brakeType: listing.specs?.brakeType || '',
            wheelset: listing.specs?.wheelset || '',
            suspensionType: listing.specs?.suspensionType || '',
            travelFront: listing.specs?.travelFront || '',
            weight: listing.specs?.weight?.toString() || '',
            motor: listing.specs?.motor || '',
            battery: listing.specs?.battery || '',
          });
          
          // Set existing images
          if (listing.media?.thumbnails && listing.media.thumbnails.length > 0) {
            setExistingImages(listing.media.thumbnails);
            setImagePreviews(listing.media.thumbnails);
          }
          
          // Set existing video
          if (listing.media?.videoUrl) {
            setExistingVideo(listing.media.videoUrl);
            setVideoPreviews(listing.media.videoUrl);
          }
        } else {
          addToast('error', 'Product not found');
          navigate('/seller/inventory');
        }
      } else {
        addToast('error', 'Unable to load product information');
        navigate('/seller/inventory');
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      addToast('error', 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

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
    // Check if it's an existing image or new upload
    if (index < existingImages.length) {
      // Remove existing image
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove new upload
      const newIndex = index - existingImages.length;
      setUploadedImages(prev => prev.filter((_, i) => i !== newIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const removeVideo = () => {
    setUploadedVideo(null);
    setVideoPreviews(existingVideo);
    setFormData(prev => ({ ...prev, videoUrl: existingVideo }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.brand || !formData.model || !formData.amount || !formData.size) {
      addToast('warning', 'Please fill in all required fields');
      return;
    }

    if (imagePreviews.length === 0) {
      addToast('warning', 'Please upload at least one image');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Dùng imagePreviews: existing URLs + base64 data URLs (tránh gọi upload API / Cloudinary)
      const allThumbnails = imagePreviews.filter((url) => url && url.trim());

      if (allThumbnails.length === 0) {
        addToast('error', 'Need at least 1 image');
        setSaving(false);
        return;
      }

      let videoUrl = existingVideo;

      // Update listing
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        generalInfo: {
          brand: formData.brand,
          model: formData.model,
          year: parseInt(formData.year.toString()),
          size: formData.size,
          condition: 'GOOD',
        },
        specs: {
          ...(formData.frameMaterial && { frameMaterial: formData.frameMaterial }),
          ...(formData.groupset && { groupset: formData.groupset }),
          ...(formData.brakeType && { brakeType: formData.brakeType }),
          ...(formData.wheelset && { wheelset: formData.wheelset }),
          ...(formData.suspensionType && { suspensionType: formData.suspensionType }),
          ...(formData.travelFront && { travelFront: formData.travelFront }),
          ...(formData.weight && { weight: parseFloat(formData.weight) }),
          ...(formData.motor && { motor: formData.motor }),
          ...(formData.battery && { battery: formData.battery }),
        },
        pricing: {
          amount: parseFloat(formData.amount),
          currency: 'VND',
        },
        media: {
          thumbnails: allThumbnails,
          videoUrl: videoUrl || undefined,
        },
        location: {
          type: 'Point',
          coordinates: userLocation.coordinates,
          address: userLocation.address,
        },
        inspectionRequired: formData.inspectionRequired,
      };

      const response = await fetch(`http://localhost:5000/api/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addToast('success', 'Product updated successfully!');
          setTimeout(() => {
            navigate('/seller/inventory');
          }, 1500);
        } else {
          addToast('error', data.message || 'Unable to update listing');
        }
      } else {
        const error = await response.json();
        const errorMessage = error.message || error.error || 'Error updating listing';
        addToast('error', errorMessage);
        console.error('API Error:', error);
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      addToast('error', 'Error updating product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="cursor-pointer hover:text-gray-900" onClick={() => navigate('/seller/inventory')}>Inventory</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Edit Product</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
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
              />
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
              />
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
                  <option value="" disabled>{catalogLoading ? 'Loading...' : 'Select bike type'}</option>
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
                  <span className="text-sm font-medium text-gray-900">Require Inspection (Inspection Required)</span>
                  <p className="text-xs text-gray-600 mt-1">
                    If enabled, the buyer will pay an additional 500,000 VND inspection fee. 
                    The bike will be inspected by an inspector before delivery, increasing trust.
                  </p>
                  <p className="text-xs text-blue-700 mt-1 font-medium">
                    ✓ Recommended to enable to increase credibility and protect both buyer and seller
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

            {/* Specs - by bike type */}
            {(formData.type === 'ROAD' || formData.type === 'TRIATHLON') && (
              <div className="border border-blue-100 bg-blue-50 rounded-lg p-5 space-y-4">
                <p className="text-sm font-semibold text-blue-800">Technical specifications (required for Road/Triathlon)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frame Material *</label>
                    <input type="text" name="frameMaterial" placeholder="Carbon, Aluminum..." value={formData.frameMaterial} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Groupset *</label>
                    <input type="text" name="groupset" placeholder="Shimano 105, SRAM Rival..." value={formData.groupset} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brake Type *</label>
                    <select name="brakeType" value={formData.brakeType} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="">Select brake type</option>
                      <option value="Disc">Disc</option>
                      <option value="Rim">Rim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wheelset</label>
                    <input type="text" name="wheelset" placeholder="Shimano RS500..." value={formData.wheelset} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input type="number" name="weight" placeholder="7.5" step="0.1" value={formData.weight} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'MTB' && (
              <div className="border border-green-100 bg-green-50 rounded-lg p-5 space-y-4">
                <p className="text-sm font-semibold text-green-800">MTB Technical Specifications</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frame Material</label>
                    <input type="text" name="frameMaterial" placeholder="Aluminum, Carbon..." value={formData.frameMaterial} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suspension Type</label>
                    <select name="suspensionType" value={formData.suspensionType} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="">Select type</option>
                      <option value="Hardtail">Hardtail</option>
                      <option value="Full-Suspension">Full-Suspension</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Travel Front (mm)</label>
                    <input type="text" name="travelFront" placeholder="120mm" value={formData.travelFront} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Groupset</label>
                    <input type="text" name="groupset" placeholder="Shimano Deore..." value={formData.groupset} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                    <input type="number" name="weight" placeholder="12.5" step="0.1" min="1" value={formData.weight} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'E_BIKE' && (
              <div className="border border-purple-100 bg-purple-50 rounded-lg p-5 space-y-4">
                <p className="text-sm font-semibold text-purple-800">E-Bike Specifications</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motor</label>
                    <input type="text" name="motor" placeholder="Bosch Performance CX..." value={formData.motor} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Battery</label>
                    <input type="text" name="battery" placeholder="625Wh" value={formData.battery} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frame Material</label>
                    <input type="text" name="frameMaterial" placeholder="Aluminum..." value={formData.frameMaterial} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                    <input type="number" name="weight" placeholder="22.0" step="0.1" min="1" value={formData.weight} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'GRAVEL' && (
              <div className="border border-orange-100 bg-orange-50 rounded-lg p-5 space-y-4">
                <p className="text-sm font-semibold text-orange-800">Gravel Technical Specifications</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frame Material</label>
                    <input type="text" name="frameMaterial" placeholder="Carbon, Aluminum..." value={formData.frameMaterial} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Groupset</label>
                    <input type="text" name="groupset" placeholder="SRAM Apex, Shimano GRX..." value={formData.groupset} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brake Type</label>
                    <select name="brakeType" value={formData.brakeType} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="">Select brake type</option>
                      <option value="Disc">Disc</option>
                      <option value="Rim">Rim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                    <input type="number" name="weight" placeholder="9.0" step="0.1" min="1" value={formData.weight} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" required />
                  </div>
                </div>
              </div>
            )}

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
                  <div className="text-4xl mb-2">📸</div>
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
                  <div className="text-3xl mb-2">🎥</div>
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
                disabled={saving}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </span>
                ) : (
                  'Update Product'
                )}
              </button>
            </div>
          </form>
        </div>

      {/* Toast Notification */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
