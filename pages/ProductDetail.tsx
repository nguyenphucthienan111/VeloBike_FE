import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Ruler, Truck, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Eye, MapPin, MessageCircle, Flag, Heart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { API_BASE_URL } from '../constants';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { ReportModal } from '../components/ReportModal';

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

// Inline component: Seller reviews visible to buyers
const SellerReviewsSection: React.FC<{ sellerId: string; listingId: string }> = ({ sellerId, listingId }) => {
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/reviews/${sellerId}?limit=5&listingId=${listingId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setReviews(d.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId, listingId]);

  if (loading || reviews.length === 0) return null;

  return (
    <div className="mt-12 border border-gray-100 p-8 rounded-sm">
      <h2 className="text-2xl font-bold mb-6">Seller Reviews</h2>
      <div className="space-y-5">
        {reviews.map((r: any) => (
          <div key={r._id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-gray-900">{r.reviewerId?.fullName || 'Buyer'}</span>
              <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={s <= r.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
              ))}
            </div>
            <p className="text-sm text-gray-700">{r.comment}</p>
            {r.reply && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Seller reply</p>
                <p className="text-sm text-gray-700">{r.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgVisible, setImgVisible] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const thumbContainerRef = useRef<HTMLDivElement>(null);
  const thumbItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [sellerContact, setSellerContact] = useState<{ fullName?: string; phone?: string; address?: { street?: string; district?: string; city?: string; province?: string } } | null>(null);

  const changeImage = (index: number) => {
    setImgVisible(false);
    setTimeout(() => {
      setSelectedImageIndex(index);
      setImgVisible(true);
    }, 150);
  };

  const toggleWishlist = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
    addToast('warning', 'Please sign in to save to wishlist');
      return;
    }
    if (!listing) return;
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await fetch(`${API_BASE_URL}/wishlist/${listing._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsWishlisted(false);
        addToast('info', 'Removed from wishlist');
      } else {
        await fetch(`${API_BASE_URL}/wishlist`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId: listing._id })
        });
        setIsWishlisted(true);
        addToast('success', 'Added to wishlist');
      }
    } catch {
      addToast('error', 'An error occurred');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Chỉ BUYER và SELLER mua hàng được — Admin/Inspector không
  // Seller không được mua sản phẩm của chính mình
  const canPurchase = React.useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return true;
    try {
      const u = JSON.parse(userStr);
      if (u?.role !== 'BUYER' && u?.role !== 'SELLER') return false;
      if (listing?.sellerId?._id && u?._id && listing.sellerId._id === u._id) return false;
      return true;
    } catch { return true; }
  }, [listing]);

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

  // Check wishlist status
  useEffect(() => {
    if (!listing?._id) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API_BASE_URL}/wishlist/check/${listing._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setIsWishlisted(d.data?.isWishlisted ?? false); })
      .catch(() => {});
  }, [listing?._id]);

  // Fetch seller contact info (phone + address)
  useEffect(() => {
    if (!listing?.sellerId?._id) return;
    fetch(`${API_BASE_URL}/users/${listing.sellerId._id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSellerContact(d.data); })
      .catch(() => {});
  }, [listing?.sellerId?._id]);

  // Auto-scroll thumbnail strip để active thumb luôn visible
  useEffect(() => {
    const el = thumbItemRefs.current[selectedImageIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedImageIndex]);

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
    return new Intl.NumberFormat('vi-VN', { 
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
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      addToast('warning', 'Please sign in to purchase');
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
             <img
               src={mainImage}
               alt={bike.title}
               className="w-full h-full object-cover transition-opacity duration-150"
               style={{ opacity: imgVisible ? 1 : 0 }}
             />
             
             {/* Prev Arrow */}
             {bike.images.length > 1 && (
               <button
                 onClick={() => changeImage((selectedImageIndex - 1 + bike.images.length) % bike.images.length)}
                 className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
               >
                 <ChevronLeft size={20} />
               </button>
             )}

             {/* Next Arrow */}
             {bike.images.length > 1 && (
               <button
                 onClick={() => changeImage((selectedImageIndex + 1) % bike.images.length)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
               >
                 <ChevronRight size={20} />
               </button>
             )}
             
             {/* Image counter */}
             {bike.images.length > 1 && (
               <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                 {selectedImageIndex + 1} / {bike.images.length}
               </div>
             )}

             {(listing.media?.spin360Urls && listing.media.spin360Urls.length > 0) && (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                   <div className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                       DRAG TO ROTATE 360°
                   </div>
               </div>
             )}
          </div>
          
          {/* Thumbnail Gallery */}
          {bike.images.length > 0 && (
            <div className="relative group/thumb">
              {/* Prev */}
              <button
                onClick={() => changeImage((selectedImageIndex - 1 + bike.images.length) % bike.images.length)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-50 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
              >
                <ChevronLeft size={16} />
              </button>

              <div ref={thumbContainerRef} className="flex gap-3 overflow-hidden scroll-smooth">
                {bike.images.map((img, index) => (
                  <div
                    key={index}
                    ref={el => { thumbItemRefs.current[index] = el; }}
                    className={`flex-shrink-0 w-[calc(25%-9px)] aspect-square bg-gray-100 cursor-pointer hover:opacity-80 transition-all border-2 ${
                      selectedImageIndex === index ? 'border-accent ring-2 ring-accent ring-offset-1 opacity-100' : 'border-transparent opacity-70'
                    }`}
                    onClick={() => changeImage(index)}
                  >
                    <img src={img} alt={`${bike.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Next */}
              <button
                onClick={() => changeImage((selectedImageIndex + 1) % bike.images.length)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-50 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
              >
                <ChevronRight size={16} />
              </button>
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

          {/* Seller Reviews Section */}
          {listing.sellerId?._id && <SellerReviewsSection sellerId={listing.sellerId._id} listingId={listing._id} />}

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
                       The bike has passed VeloBike Inspector's 50-point inspection.
                     </p>
                   </div>
                   <div className="bg-gray-50 p-6 rounded text-sm text-gray-600">
                     <p className="italic">&quot;Inspection results have been saved on the system.&quot;</p>
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
                     This bike has no inspection report yet. You can request an inspection when placing an order — an inspector will check the bike before delivery.
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
                
                <h1 className="text-2xl lg:text-3xl font-extrabold leading-tight mb-4">{bike.title}</h1>
                
                {/* Price Section - Di chuyển lên trên */}
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

                {/* Tags & Stats */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-xs font-bold bg-black text-white px-2 py-1">SIZE {bike.size}</span>
                    <span className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded">Condition: {formatCondition(bike.condition)}</span>
                    {listing.status === 'SOLD' ? (
                      <span className="text-xs font-bold bg-gray-500 text-white px-2 py-1 rounded">SOLD</span>
                    ) : (listing.status === 'RESERVED' || listing.status === 'IN_INSPECTION') ? (
                      <span className="text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded">RESERVED</span>
                    ) : listing.status === 'PUBLISHED' ? (
                      <span className="text-xs font-bold bg-green-600 text-white px-2 py-1 rounded">IN STOCK</span>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-8 text-xs text-gray-500">
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
                    <span>Listed {formatListedAt(listing.createdAt)}</span>
                  )}
                </div>

                {/* Actions Buttons */}
                <div className="space-y-3 mb-8">
                    {/* Status Alert - Always visible if not PUBLISHED */}
                    {listing.status !== 'PUBLISHED' && (
                      <div className={`rounded-lg p-4 mb-3 text-center font-bold border-2 ${
                        listing.status === 'SOLD' 
                          ? 'bg-gray-100 border-gray-300 text-gray-600' 
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {listing.status === 'SOLD' ? 'PRODUCT SOLD' : 'PRODUCT RESERVED'}
                        <p className="text-xs font-normal mt-1 opacity-80">
                          {listing.status === 'SOLD' 
                            ? 'This product is no longer available.' 
                            : 'Please choose another product or check back later.'}
                        </p>
                      </div>
                    )}

                    {!canPurchase && listing?.status === 'PUBLISHED' && (
                      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-3">
                        <p className="text-sm text-gray-700 font-medium">
                          {(() => {
                            const userStr = localStorage.getItem('user');
                            try {
                              const u = JSON.parse(userStr || '{}');
                              if (listing?.sellerId?._id && u?._id && listing.sellerId._id === u._id) {
      return "This is your product, you can't buy your own product.";
    }

                            } catch {}
                            return 'Admin/Inspector accounts cannot make purchases.';
                          })()}
                        </p>
                      </div>
                    )}
                    
                    {canPurchase && listing?.status === 'PUBLISHED' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <button
                            onClick={handleBuyNow}
                            className="flex-1 bg-accent hover:bg-red-600 text-white py-4 font-bold uppercase tracking-widest transition-colors shadow-md rounded-sm text-lg"
                          >
                            MUA NGAY
                          </button>
                          <button
                            onClick={toggleWishlist}
                            disabled={wishlistLoading}
                            className={`px-4 py-4 border-2 rounded-sm transition-all shadow-sm ${
                              isWishlisted
                                ? 'border-red-400 bg-red-50 text-red-500 hover:bg-red-100'
                                : 'border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400 hover:bg-red-50'
                            }`}
                            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <Heart size={22} fill={isWishlisted ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        
                        {listing.sellerId && (
                          <button
                            type="button"
                            onClick={() => navigate(`/messages?contact=${listing.sellerId!._id}&listingId=${listing._id}`)}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-sm hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
                          >
                            <MessageCircle size={18} />
                            Message seller
                          </button>
                        )}
                      </div>
                    )}
                    
                    {listing?.status === 'SOLD' && (
                      <div className="bg-gray-200 rounded-lg py-4 text-center font-bold text-gray-600">SOLD</div>
                    )}
                    {listing?.status === 'RESERVED' && (
                      <div className="bg-amber-100 rounded-lg py-4 text-center font-bold text-amber-800">RESERVED</div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500 text-center flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1">
                            <ShieldCheck size={14}/> 100% Money Back Guarantee if item differs from inspection
                        </div>
                        <button 
                            onClick={() => setShowReportModal(true)}
                            className="text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                            <Flag size={12} /> Report listing
                        </button>
                    </div>
                </div>
                
                {/* Seller Info - Compact */}
                {listing.sellerId && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg overflow-hidden">
                      {listing.sellerId.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{listing.sellerId.fullName}</span>
                        {listing.sellerId.badge && (
                          <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded">
                            {listing.sellerId.badge}
                          </span>
                        )}
                      </div>
                      {(listing.sellerId.reputation && (typeof listing.sellerId.reputation === 'object')) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          ⭐ {(listing.sellerId.reputation as { score?: number; reviewCount?: number }).score ?? 0}/5 • {(listing.sellerId.reputation as { score?: number; reviewCount?: number }).reviewCount ?? 0} reviews
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Contact */}
            {sellerContact && (sellerContact.fullName || sellerContact.phone || sellerContact.address?.city) && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold mb-3 text-sm flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" /> Contact
                </h3>
                <div className="space-y-1.5 text-sm text-gray-600">
                  {sellerContact.fullName && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">👤</span>
                      <span className="font-medium text-gray-800">{sellerContact.fullName}</span>
                    </div>
                  )}
                  {sellerContact.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📞</span>
                      <a href={`tel:${sellerContact.phone}`} className="hover:text-accent transition-colors">
                        {sellerContact.phone}
                      </a>
                    </div>
                  )}
                  {sellerContact.address && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">📍</span>
                      <span>
                        {[
                          sellerContact.address.street,
                          sellerContact.address.district,
                          sellerContact.address.city || sellerContact.address.province,
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
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

      <Toast
        toasts={toasts}
        onRemove={removeToast}
      />

      {showReportModal && listing && (
        <ReportModal 
            listingId={listing._id}
            onClose={() => setShowReportModal(false)}
            onSuccess={() => addToast('success', 'Report submitted successfully. Admin will review it shortly.')}
        />
      )}
    </div>
  );
};
