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
  } | null;
  inspectionRequired: boolean;
  inspectionScore?: number;
  views: number;
  createdAt: string;
  boostedUntil?: string;
  boostCount?: number;
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [orderLoading, setOrderLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

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
    imageUrl: listing.media?.thumbnails?.[0] || 'https://via.placeholder.com/800',
    images: listing.media?.thumbnails || [listing.media?.thumbnails?.[0] || 'https://via.placeholder.com/800'],
    specs: listing.specs || {},
    geometry: listing.geometry || {},
    conditionScore: listing.inspectionScore || 8.5,
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

  // Handle Buy Now (Escrow) button
  const handleBuyNow = async () => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      showToast('Please login to purchase', 'warning');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    // Validate token format
    if (token.trim() === '' || token === 'null' || token === 'undefined') {
      showToast('Invalid authentication token. Please login again', 'error');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Check if user is buyer
      if (user.role !== 'BUYER') {
        showToast('Only buyers can purchase items', 'error');
        return;
      }

      // Check if listing is available
      if (listing?.status !== 'PUBLISHED') {
        showToast('This item is not available for purchase', 'error');
        return;
      }

      // Check if user is trying to buy their own listing
      if (listing?.sellerId?._id === user.id) {
        showToast('You cannot buy your own listing', 'error');
        return;
      }

      setOrderLoading(true);
      showToast('Creating order...', 'info');

      // Step 1: Create order
      // Logic theo BE:
      // - If listing.inspectionRequired = false → Buyer MUST send false (cannot request inspection)
      // - If listing.inspectionRequired = true → Buyer can choose true/false (default to true)
      const inspectionRequired = listing.inspectionRequired === false ? false : true;
      
      console.log('🔍 Order creation:', {
        listingId: listing._id,
        listingInspectionRequired: listing.inspectionRequired,
        sendingInspectionRequired: inspectionRequired,
      });

      const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing._id,
          inspectionRequired: inspectionRequired,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (orderResponse.status === 401) {
          showToast('Session expired. Please login again', 'error');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
        throw new Error(orderData.message || 'Failed to create order');
      }

      if (!orderData.success || !orderData.data) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const orderId = orderData.data._id;
      showToast('Order created! Redirecting to payment...', 'success');

      // Step 2: Create payment link
      const paymentResponse = await fetch(`${API_BASE_URL}/payment/create-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (paymentResponse.status === 401) {
          showToast('Session expired. Please login again', 'error');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
        
        // Handle PayOS configuration errors
        if (paymentData.message?.includes('signature') || 
            paymentData.message?.includes('PayOS') || 
            paymentData.message?.includes('payment signature')) {
          showToast('Payment service configuration error. Please contact administrator.', 'error');
          console.error('PayOS error:', paymentData.message);
          console.error('This error usually means PayOS credentials are missing or invalid in backend .env file');
          return;
        }
        
        throw new Error(paymentData.message || 'Failed to create payment link');
      }

      if (!paymentData.success || !paymentData.paymentLink) {
        throw new Error(paymentData.message || 'Failed to create payment link');
      }

      // Step 3: Redirect to payment link
      window.location.href = paymentData.paymentLink;

    } catch (err: any) {
      console.error('Error in handleBuyNow:', err);
      showToast(err.message || 'Failed to process purchase', 'error');
    } finally {
      setOrderLoading(false);
    }
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
          
          {/* Thumbnail Gallery */}
          {bike.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-4">
              {bike.images.map((img, index) => (
                <div 
                  key={index}
                  className={`aspect-square bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity border-2 ${
                    selectedImageIndex === index ? 'border-accent' : 'border-transparent'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={img} alt={`${bike.title} ${index + 1}`} className="w-full h-full object-cover"/>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={`https://picsum.photos/400?random=${i}`} className="w-full h-full object-cover"/>
                </div>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="mt-12 border border-gray-100 p-8 rounded-sm">
            <h2 className="text-2xl font-bold mb-4">Product Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {bike.description}
            </p>
          </div>

          {/* Inspection Report Section */}
          {bike.inspectionRequired && (
            <div className="mt-12 border border-gray-100 p-8 rounded-sm">
               <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                   <ShieldCheck className="text-accent" /> Inspection Report
               </h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                       <div className="flex justify-between mb-2">
                           <span className="font-medium">Overall Score</span>
                           <span className="font-bold text-accent">{bike.conditionScore}/10</span>
                       </div>
                       <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
                           <div className="bg-accent h-2 rounded-full" style={{ width: `${bike.conditionScore * 10}%` }}></div>
                       </div>
                       
                       <div className="space-y-3">
                           <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                               <CheckCircle size={16}/> Frame: Structurally Sound (Ultrasound verified)
                           </div>
                           <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                               <CheckCircle size={16}/> Transmission: Chain wear &lt; 0.5%
                           </div>
                           <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                               <AlertCircle size={16}/> Cosmetic: Minor scuffs on rear derailleur
                           </div>
                       </div>
                   </div>
                   
                   <div className="bg-gray-50 p-6 rounded text-sm text-gray-600">
                       <p className="italic">"Inspector note: {bike.description}"</p>
                       <div className="mt-4 flex items-center gap-2">
                           <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                           <div>
                               <p className="font-bold text-black">Inspector</p>
                               <p className="text-xs">Certified VeloBike Inspector</p>
                           </div>
                       </div>
                   </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Column: details & Action */}
        <div className="lg:col-span-4 space-y-8">
            <div>
                <div className="text-sm text-gray-400 mb-1">{bike.year} • {bike.type}</div>
                <h1 className="text-3xl font-extrabold leading-tight mb-2">{bike.title}</h1>
                
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
                    {listing.sellerId.reputation && (
                      <div className="text-xs text-gray-500">
                        ⭐ {listing.sellerId.reputation.score}/5 ({listing.sellerId.reputation.reviewCount} reviews)
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs font-bold bg-black text-white px-2 py-1">SIZE {bike.size}</span>
                    <span className="text-xs text-gray-500">Condition: {formatCondition(bike.condition)}</span>
                </div>

                {/* Views & Boost Info */}
                <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{listing.views || 0} views</span>
                  </div>
                  {listing.boostCount && listing.boostCount > 0 && (
                    <div className="text-accent font-semibold">
                      ⚡ Boosted {listing.boostCount}x
                    </div>
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
                    <button 
                      onClick={handleBuyNow}
                      disabled={orderLoading || listing?.status !== 'PUBLISHED'}
                      className="w-full bg-accent hover:bg-red-600 text-white py-4 font-bold uppercase tracking-widest transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {orderLoading ? 'PROCESSING...' : 'BUY NOW (ESCROW)'}
                    </button>
                    <button className="w-full border-2 border-black hover:bg-black hover:text-white text-black py-4 font-bold uppercase tracking-widest transition-colors">
                        MAKE AN OFFER
                    </button>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={14}/> 100% Money Back Guarantee if item differs from inspection
                </div>
            </div>

            {/* Technical Specs */}
            <div className="border-t border-gray-100 pt-8">
                <h3 className="font-bold mb-4">Technical Specifications</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
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
                </div>
            </div>

            {/* Geometry Chart */}
            {geometryData.length > 0 && (
              <div className="border-t border-gray-100 pt-8">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><Ruler size={16}/> Geometry</h3>
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

            {/* Location */}
            {listing.location?.address && (
              <div className="border-t border-gray-100 pt-8">
                <h3 className="font-bold mb-2 text-sm flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" /> Location
                </h3>
                <p className="text-sm text-gray-600">{listing.location.address}</p>
              </div>
            )}

             {/* Shipping */}
             <div className="border-t border-gray-100 pt-8 flex items-start gap-4">
                 <Truck className="text-gray-400 mt-1" />
                 <div>
                     <h4 className="font-bold text-sm">Professional Shipping</h4>
                     <p className="text-xs text-gray-500 mt-1">Bike is professionally packed in a dedicated box. Insured shipping via our logistics partner.</p>
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
