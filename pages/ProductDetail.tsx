import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Ruler, Truck, ChevronLeft, AlertCircle, CheckCircle, Eye, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { API_BASE_URL } from '../constants';
import { Toast, useToast } from '../components/Toast';

interface ListingData {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  generalInfo: {
    brand: string;
    model: string;
    year: number;
    size: string;
    condition?: string;
  };
  pricing: {
    amount: number;
    currency: string;
    originalPrice?: number;
  };
  media: {
    thumbnails: string[];
    spin360Urls?: string[];
    videoUrl?: string;
  };
  location: {
    address?: string;
    coordinates: number[];
  };
  specs?: {
    frameMaterial?: string;
    groupset?: string;
    wheelset?: string;
    brakeType?: string;
    suspensionType?: string;
    travelFront?: string;
    travelRear?: string;
    wheelSize?: string;
    weight?: number;
    motor?: string;
    battery?: string;
    range?: string;
    maxSpeed?: string;
    odometer?: number;
  };
  geometry?: {
    stack?: number;
    reach?: number;
  };
  sellerId: {
    _id: string;
    fullName: string;
    reputation?: {
      score: number;
      reviewCount: number;
    };
    badge?: string;
    planType?: string;
  } | null;
  inspectionRequired: boolean;
  inspectionScore?: number;
  views: number;
  createdAt: string;
  boostedUntil?: string;
  updatedAt?: string;
  boostCount?: number;
  sellerHasFreeInspection?: boolean;
  sellerPlanType?: string;
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toast, showToast, hideToast } = useToast();

  // Chỉ BUYER và SELLER mua hàng được — Admin/Inspector không
  const canPurchase = (() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return true;
    try {
      const u = JSON.parse(userStr);
      return u?.role === 'BUYER' || u?.role === 'SELLER';
    } catch { return true; }
  })();

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) {
        setError('Invalid listing ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch from API only - no mock data fallback
        const response = await fetch(`${API_BASE_URL}/listings/${id}`);
        
        if (!response.ok) {
          // HTTP error (404, 500, etc.)
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || `Failed to load listing (${response.status})`);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.success && data.data) {
          setListing(data.data);
          setLoading(false);
          return;
        } else {
          // API returned error response
          setError(data.message || 'Listing not found');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        // Network error or other exception
        console.error('Error fetching listing:', err);
        setError(err.message || 'Failed to connect to server. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // Tăng view count khi user xem trang (BE: PUT /listings/:id/view)
  useEffect(() => {
    if (!id || !listing?._id) return;
    fetch(`${API_BASE_URL}/listings/${id}/view`, { method: 'PUT' }).catch(() => {});
  }, [id, listing?._id]);

  if (loading) {
    return (
      <div className="bg-white pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading product information...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-white pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Bike not found</h2>
          <p className="text-gray-500 mb-4">{error || 'The listing you are looking for does not exist.'}</p>
          <Link to="/marketplace" className="text-accent hover:underline">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Map API data to component format
  const bike = {
    id: listing._id,
    title: listing.title,
    description: listing.description,
    year: listing.generalInfo.year,
    type: listing.type,
    size: listing.generalInfo.size,
    condition: listing.generalInfo.condition || 'GOOD',
    price: listing.pricing.amount,
    originalPrice: listing.pricing.originalPrice || listing.pricing.amount,
    imageUrl: listing.media?.thumbnails?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect fill='%23e5e7eb' width='800' height='800'/%3E%3Ctext fill='%239ca3af' x='400' y='400' font-size='24' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E",
    images: listing.media?.thumbnails?.length ? listing.media.thumbnails : ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect fill='%23e5e7eb' width='800' height='800'/%3E%3Ctext fill='%239ca3af' x='400' y='400' font-size='24' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E"],
    specs: listing.specs || {},
    geometry: listing.geometry || {},
    conditionScore: listing.inspectionScore ?? 0,
    inspectionRequired: listing.inspectionRequired,
  };

  const geometryData = [
    { name: 'Stack', value: listing.geometry?.stack || 0 },
    { name: 'Reach', value: listing.geometry?.reach || 0 },
  ].filter(item => item.value > 0);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: listing.pricing.currency || 'VND' 
    }).format(amount);
  };

  const formatCondition = (condition?: string) => {
    const conditionMap: { [key: string]: string } = {
      'NEW': 'New',
      'LIKE_NEW': 'Like New',
      'GOOD': 'Good',
      'FAIR': 'Fair',
      'PARTS': 'Parts Only',
    };
    return conditionMap[condition || 'GOOD'] || condition || 'Good';
  };

  const formatListedAt = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      showToast('Vui lòng đăng nhập để mua hàng', 'warning');
      navigate('/login', { state: { from: `/checkout/${listing._id}` } });
      return;
    }
    navigate(`/checkout/${listing._id}`);
  };

  const mainImage = bike.images[selectedImageIndex] || bike.imageUrl;

  return (
    <div className="bg-white pb-20">
      
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Link to="/marketplace" className="text-xs text-gray-500 hover:text-black flex items-center gap-1">
            <ChevronLeft size={12} /> BACK TO MARKETPLACE
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Media & 360 View */}
        <div className="lg:col-span-8">
          <div className="aspect-[4/3] bg-gray-100 mb-4 relative overflow-hidden group cursor-ew-resize">
             <img src={mainImage} alt={bike.title} className="w-full h-full object-cover" />
             
             {(listing.media?.spin360Urls && listing.media.spin360Urls.length > 0) && (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                   <div className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                       DRAG TO ROTATE 360°
                   </div>
               </div>
             )}
          </div>
          
          {/* Thumbnail Gallery - chỉ dùng ảnh từ API, không mock/picsum */}
          {bike.images.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {bike.images.map((img, index) => (
                <div
                  key={index}
                  className={`aspect-square bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity border-2 ${
                    selectedImageIndex === index ? 'border-accent' : 'border-transparent'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={img} alt={`${bike.title} ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Video - nếu có media.videoUrl từ BE */}
          {listing.media?.videoUrl && (
            <div className="mt-12 border border-gray-100 p-8 rounded-sm">
              <h2 className="text-2xl font-bold mb-4">Video</h2>
              <div className="aspect-video bg-black rounded overflow-hidden">
                <video src={listing.media.videoUrl} controls className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="mt-12 border border-gray-100 p-8 rounded-sm">
            <h2 className="text-2xl font-bold mb-4">Product Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {bike.description}
            </p>
          </div>

          {/* Inspection Report Section - chỉ hiện khi có inspectionScore thật */}
          {bike.inspectionRequired && (
            <div className="mt-12 border border-gray-100 p-8 rounded-sm">
               <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                   <ShieldCheck className="text-accent" /> Inspection Report
               </h2>
               
               {bike.conditionScore > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                     <div className="flex justify-between mb-2">
                       <span className="font-medium">Overall Score</span>
                       <span className="font-bold text-accent">{bike.conditionScore}/10</span>
                     </div>
                     <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
                       <div className="bg-accent h-2 rounded-full" style={{ width: `${bike.conditionScore * 10}%` }}></div>
                     </div>
                     <p className="text-sm text-gray-600">
                       Xe đã qua kiểm định 50 điểm của VeloBike Inspector.
                     </p>
                   </div>
                   <div className="bg-gray-50 p-6 rounded text-sm text-gray-600">
                     <p className="italic">&quot;Kết quả kiểm định đã được lưu trên hệ thống.&quot;</p>
                     <div className="mt-4 flex items-center gap-2">
                       <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                       <div>
                         <p className="font-bold text-black">Inspector</p>
                         <p className="text-xs">Certified VeloBike Inspector</p>
                       </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <p className="text-sm text-blue-800">
                     Xe chưa có báo cáo kiểm định. Bạn có thể yêu cầu kiểm định khi đặt mua — inspector sẽ kiểm tra xe trước khi giao hàng.
                   </p>
                 </div>
               )}
            </div>
          )}

          {/* Technical Specs - chuyển sang cột trái */}
          {(listing.specs?.frameMaterial || listing.specs?.groupset || listing.specs?.wheelset ||
            listing.specs?.brakeType || listing.specs?.suspensionType || listing.specs?.travelFront ||
            listing.specs?.wheelSize || listing.specs?.weight || listing.specs?.motor ||
            listing.specs?.battery || listing.specs?.range || listing.specs?.maxSpeed ||
            listing.specs?.odometer != null) && (
          <div className="mt-12 border border-gray-100 p-8 rounded-sm">
            <h2 className="text-2xl font-bold mb-4">Technical Specifications</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {listing.specs?.frameMaterial && (
                <>
                  <div className="text-gray-500">Frame</div>
                  <div className="font-medium">{listing.specs.frameMaterial}</div>
                </>
              )}
              {listing.specs?.groupset && (
                <>
                  <div className="text-gray-500">Groupset</div>
                  <div className="font-medium">{listing.specs.groupset}</div>
                </>
              )}
              {listing.specs?.wheelset && (
                <>
                  <div className="text-gray-500">Wheels</div>
                  <div className="font-medium">{listing.specs.wheelset}</div>
                </>
              )}
              {listing.specs?.brakeType && (
                <>
                  <div className="text-gray-500">Brakes</div>
                  <div className="font-medium">{listing.specs.brakeType}</div>
                </>
              )}
              {listing.specs?.suspensionType && (
                <>
                  <div className="text-gray-500">Suspension</div>
                  <div className="font-medium">{listing.specs.suspensionType}</div>
                </>
              )}
              {listing.specs?.travelFront && listing.specs?.travelRear && (
                <>
                  <div className="text-gray-500">Travel</div>
                  <div className="font-medium">{listing.specs.travelFront} F / {listing.specs.travelRear} R</div>
                </>
              )}
              {listing.specs?.wheelSize && (
                <>
                  <div className="text-gray-500">Wheel Size</div>
                  <div className="font-medium">{listing.specs.wheelSize}"</div>
                </>
              )}
              {listing.specs?.weight && (
                <>
                  <div className="text-gray-500">Weight</div>
                  <div className="font-medium">{listing.specs.weight} kg</div>
                </>
              )}
              {listing.specs?.motor && (
                <>
                  <div className="text-gray-500">Motor</div>
                  <div className="font-medium">{listing.specs.motor}</div>
                </>
              )}
              {listing.specs?.battery && (
                <>
                  <div className="text-gray-500">Battery</div>
                  <div className="font-medium">{listing.specs.battery}</div>
                </>
              )}
              {listing.specs?.range && (
                <>
                  <div className="text-gray-500">Range</div>
                  <div className="font-medium">{listing.specs.range}</div>
                </>
              )}
              {listing.specs?.maxSpeed && (
                <>
                  <div className="text-gray-500">Max Speed</div>
                  <div className="font-medium">{listing.specs.maxSpeed}</div>
                </>
              )}
              {listing.specs?.odometer != null && (
                <>
                  <div className="text-gray-500">Odometer</div>
                  <div className="font-medium">{listing.specs.odometer} km</div>
                </>
              )}
            </div>
          </div>
          )}

          {/* Geometry Chart - chuyển sang cột trái */}
          {geometryData.length > 0 && (
            <div className="mt-12 border border-gray-100 p-8 rounded-sm">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Ruler size={20}/> Geometry</h2>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geometryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px'}} />
                    <Bar dataKey="value" barSize={20} fill="#111" radius={[0, 4, 4, 0]}>
                      {geometryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#EF4444' : '#111'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: details & Action - sticky trên desktop */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20 space-y-6">
            <div>
                {/* Brand / Model rõ ràng */}
                {(listing.generalInfo?.brand || listing.generalInfo?.model) && (
                  <div className="text-sm text-gray-500 mb-1">
                    {listing.generalInfo.brand} {listing.generalInfo.model}
                    {bike.year && ` • ${bike.year}`} • {bike.type}
                  </div>
                )}
                {!listing.generalInfo?.brand && !listing.generalInfo?.model && (
                  <div className="text-sm text-gray-400 mb-1">{bike.year} • {bike.type}</div>
                )}
                <h1 className="text-2xl lg:text-3xl font-extrabold leading-tight mb-2">{bike.title}</h1>
                
                {/* Seller Info */}
                {listing.sellerId && (
                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Seller:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{listing.sellerId.fullName}</span>
                        {listing.sellerId.badge && (
                          <span className="text-xs bg-accent text-white px-2 py-0.5 rounded">
                            {listing.sellerId.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    {(listing.sellerId.reputation && (typeof listing.sellerId.reputation === 'object')) && (
                      <div className="text-xs text-gray-500">
                        ⭐ {(listing.sellerId.reputation as { score?: number; reviewCount?: number }).score ?? 0}/5 ({(listing.sellerId.reputation as { score?: number; reviewCount?: number }).reviewCount ?? 0} reviews)
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <span className="text-xs font-bold bg-black text-white px-2 py-1">SIZE {bike.size}</span>
                    <span className="text-xs text-gray-500">Condition: {formatCondition(bike.condition)}</span>
                    {/* Availability badge */}
                    {listing.status === 'SOLD' ? (
                      <span className="text-xs font-bold bg-gray-500 text-white px-2 py-1 rounded">ĐÃ BÁN</span>
                    ) : listing.status === 'RESERVED' ? (
                      <span className="text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded">ĐÃ CÓ NGƯỜI ĐẶT</span>
                    ) : listing.status === 'PUBLISHED' ? (
                      <span className="text-xs font-bold bg-green-600 text-white px-2 py-1 rounded">CÒN HÀNG</span>
                    ) : listing.status ? (
                      <span className="text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded">{listing.status}</span>
                    ) : null}
                </div>

                {/* Views, Boost, Listed at */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{listing.views || 0} views</span>
                  </div>
                  {listing.boostCount && listing.boostCount > 0 && (
                    <div className="text-accent font-semibold">
                      ⚡ Boosted {listing.boostCount}x
                    </div>
                  )}
                  {formatListedAt(listing.createdAt) && (
                    <span>Đăng {formatListedAt(listing.createdAt)}</span>
                  )}
                </div>
                
                <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-4xl font-bold text-accent">
                        {formatPrice(bike.price)}
                    </span>
                    {bike.originalPrice > bike.price && (
                      <span className="text-gray-400 line-through text-sm">
                          {formatPrice(bike.originalPrice)}
                      </span>
                    )}
                </div>

                <div className="space-y-3">
                    {!canPurchase && listing?.status === 'PUBLISHED' && (
                      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-3">
                        <p className="text-sm text-gray-700 font-medium">
                          Tài khoản Admin/Inspector không thể mua hàng.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Đăng nhập bằng tài khoản Buyer hoặc Seller để đặt mua.
                        </p>
                      </div>
                    )}
                    {canPurchase && listing?.status === 'PUBLISHED' && (
                      <button
                        onClick={handleBuyNow}
                        className="w-full bg-accent hover:bg-red-600 text-white py-4 font-bold uppercase tracking-widest transition-colors shadow-md"
                      >
                        MUA NGAY
                      </button>
                    )}
                    {listing?.status === 'SOLD' && (
                      <div className="bg-gray-200 rounded-lg py-4 text-center font-bold text-gray-600">ĐÃ BÁN</div>
                    )}
                    {listing?.status === 'RESERVED' && (
                      <div className="bg-amber-100 rounded-lg py-4 text-center font-bold text-amber-800">ĐÃ CÓ NGƯỜI ĐẶT</div>
                    )}
                </div>
                
                <div className="mt-4 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={14}/> 100% Money Back Guarantee if item differs from inspection
                </div>
            </div>

            {/* Location */}
            {listing.location?.address && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold mb-2 text-sm flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" /> Location
                </h3>
                <p className="text-sm text-gray-600">{listing.location.address}</p>
              </div>
            )}

            {/* Shipping */}
            <div className="border-t border-gray-100 pt-6 flex items-start gap-4">
              <Truck className="text-gray-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-sm">Professional Shipping</h4>
                <p className="text-xs text-gray-500 mt-1">Bike is professionally packed in a dedicated box. Insured shipping via our logistics partner.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Toast Notification */}
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
