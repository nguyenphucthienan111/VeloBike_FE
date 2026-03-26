import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Shield, RefreshCw, Zap, Crown, Sparkles, CreditCard, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BikeCard } from '../components/BikeCard';
import { API_BASE_URL } from '../constants';
import { BikeListing, InspectionStatus } from '../types';

// ── Carousel: shows 3 cards, nav with ← → ──────────────────────────────────
const BikeCarousel: React.FC<{ bikes: BikeListing[]; loading: boolean; emptyText?: string }> = ({ bikes, loading, emptyText }) => {
  const [idx, setIdx] = useState(0);
  const perPage = 3;
  const total = bikes.length;
  const maxIdx = Math.max(0, total - perPage);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(maxIdx, i + 1));

  if (loading) return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (total === 0) return <div className="py-12 text-center text-gray-500">{emptyText || 'No listings available.'}</div>;

  const visible = bikes.slice(idx, idx + perPage);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {visible.map(bike => (
          <div key={bike.id} className="relative">
            {(bike as any).boostedUntil && new Date((bike as any).boostedUntil) > new Date() && (
              <div className="absolute -top-2 -right-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                🚀 Boosted
              </div>
            )}
            <BikeCard bike={bike} />
          </div>
        ))}
        {/* Fill empty slots so grid stays 3-col */}
        {visible.length < perPage && Array.from({ length: perPage - visible.length }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
      </div>

      {/* Nav buttons - only show if more than 3 */}
      {total > perPage && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-500">{idx + 1}–{Math.min(idx + perPage, total)} of {total}</span>
          <button
            onClick={next}
            disabled={idx >= maxIdx}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Home component ────────────────────────────────────────────────────
export const Home: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trendingListings, setTrendingListings] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [plans, setPlans] = useState<Record<string, number>>({ FREE: 0, BASIC: 99000, PRO: 299000, PREMIUM: 500000 });

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('accessToken'));
    // Fetch subscription plans to get live pricing
    fetch(`${API_BASE_URL}/subscriptions/plans`)
      .then(r => r.json())
      .then(data => {
        const list: any[] = Array.isArray(data?.data) ? data.data : [];
        const map: Record<string, number> = { FREE: 0, BASIC: 99000, PRO: 299000, PREMIUM: 500000 };
        list.forEach(p => { if (p.planType && p.price !== undefined) map[p.planType] = p.price; });
        setPlans(map);
      })
      .catch(() => {});
  }, []);

  // Trending: limit=9 để carousel có đủ data
  useEffect(() => {
    let cancelled = false;
    setTrendingLoading(true);
    fetch(`${API_BASE_URL}/recommendations/trending?period=7d&limit=9`)
      .then(r => r.json())
      .then(async data => {
        if (cancelled) return;
        let list = data?.data?.trendingBikes ?? [];
        if (!Array.isArray(list) || list.length === 0) {
          const fb = await fetch(`${API_BASE_URL}/listings?page=1&limit=9`).then(r => r.json()).catch(() => ({}));
          list = Array.isArray(fb?.data) ? fb.data : [];
        }
        if (!cancelled) setTrendingListings(list);
      })
      .catch(async () => {
        if (cancelled) return;
        try {
          const fb = await fetch(`${API_BASE_URL}/listings?page=1&limit=9`).then(r => r.json());
          if (!cancelled) setTrendingListings(Array.isArray(fb?.data) ? fb.data : []);
        } catch { if (!cancelled) setTrendingListings([]); }
      })
      .finally(() => { if (!cancelled) setTrendingLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Featured: PREMIUM sellers, limit=9
  useEffect(() => {
    let cancelled = false;
    setFeaturedLoading(true);
    fetch(`${API_BASE_URL}/listings/featured?limit=9`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setFeaturedListings(Array.isArray(data?.data) ? data.data : []); })
      .catch(() => { if (!cancelled) setFeaturedListings([]); })
      .finally(() => { if (!cancelled) setFeaturedLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const mapToBikeCard = (listing: any): BikeListing | null => {
    if (!listing || !(listing._id || listing.id) || listing.status !== 'PUBLISHED') return null;
    const hasScore = typeof listing.inspectionScore === 'number' && listing.inspectionScore > 0;
    const sellerObj = listing.seller || listing.sellerId;
    const sellerName = (sellerObj && typeof sellerObj === 'object') ? sellerObj.fullName || 'Unknown' : 'Unknown';
    const isVerified = !!(sellerObj && typeof sellerObj === 'object' && (sellerObj as any).badge);
    return {
      id: listing._id || listing.id || '',
      title: listing.title || 'Untitled',
      brand: listing.generalInfo?.brand || 'Unknown',
      model: listing.generalInfo?.model || 'Unknown',
      year: listing.generalInfo?.year || 0,
      price: listing.pricing?.amount || 0,
      originalPrice: listing.pricing?.originalPrice || listing.pricing?.amount || 0,
      type: (listing.type || 'ROAD') as any,
      size: listing.generalInfo?.size || 'M',
      conditionScore: hasScore ? listing.inspectionScore : 0,
      inspectionStatus: (hasScore ? 'PASSED' : 'PENDING') as InspectionStatus,
      inspectionRequired: !!listing.inspectionRequired,
      imageUrl: listing.media?.thumbnails?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext fill='%239ca3af' x='200' y='200' font-size='20' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E",
      location: listing.location?.address || 'Unknown',
      specs: { frameMaterial: '', groupset: listing.specs?.groupset || 'Standard', wheelset: '', brakeType: 'Disc' },
      geometry: { stack: 0, reach: 0 },
      description: listing.description || '',
      sellerName,
      isVerified,
      boostedUntil: listing.boostedUntil,
    } as any;
  };

  const trendingCards = trendingListings.map(mapToBikeCard).filter((b): b is BikeListing => b != null && !!b.id);
  const featuredCards = featuredListings.map(mapToBikeCard).filter((b): b is BikeListing => b != null && !!b.id);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-gray-50">
        <div className="absolute inset-0 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=2070&auto=format&fit=crop"
            alt="Premium Road Bike" className="w-full h-full object-cover object-center brightness-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
            RIDE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">EXTRAORDINARY</span>
          </h1>
          <p className="text-gray-200 text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto">
            The managed marketplace for verified pre-owned performance bicycles. Inspection certified. Escrow secured.
          </p>
          <Link to="/marketplace" className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 font-bold text-sm tracking-widest hover:bg-accent-hover transition-colors">
            BROWSE BIKES <ArrowRight size={16} />
          </Link>
          {!isAuthenticated && (
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="px-6 py-2 text-sm font-semibold text-white border border-white rounded-lg hover:bg-white hover:text-black transition-colors">Log in</Link>
              <Link to="/register" className="px-6 py-2 text-sm font-semibold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors">Sign up</Link>
            </div>
          )}
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
            { icon: <Shield size={32} />, title: '50-Point Inspection', desc: 'Every bike is physically verified by certified mechanics. No cracks, no surprises.' },
            { icon: <RefreshCw size={32} />, title: 'Escrow Payments', desc: 'We hold your money safely. The seller only gets paid when you confirm the bike.' },
            { icon: <Zap size={32} />, title: 'Premium Selection', desc: 'Curated inventory of high-end Road, MTB, and Triathlon bikes from top brands.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-accent">{icon}</div>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Listings - Premium Sellers */}
      {(featuredLoading || featuredCards.length > 0) && (
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-xs font-bold tracking-widest text-amber-600 uppercase bg-amber-50 px-3 py-1 rounded-full">👑 Premium Sellers</span>
                <h2 className="text-3xl font-bold mt-3 mb-1">Featured Listings</h2>
                <p className="text-gray-500 text-sm">Hand-picked bikes from our top verified sellers. Rotates every hour for fair exposure.</p>
              </div>
              <Link to="/marketplace" className="text-accent font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                VIEW ALL <ArrowRight size={16} />
              </Link>
            </div>
            <BikeCarousel bikes={featuredCards} loading={featuredLoading} />
          </div>
        </section>
      )}

      {/* Trending Arrivals */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-1">Trending Arrivals</h2>
              <p className="text-gray-500 text-sm">Freshly inspected carbon machines, sorted by popularity.</p>
            </div>
            <Link to="/marketplace" className="text-accent font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              VIEW ALL <ArrowRight size={16} />
            </Link>
          </div>
          <BikeCarousel bikes={trendingCards} loading={trendingLoading} emptyText="No trending bikes in the last 7 days." />
        </div>
      </section>

      {/* Seller Plans */}
      <section className="py-24 px-4 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest text-accent uppercase mb-3 block">For Sellers</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Sell smarter with the right plan</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From casual sellers to professional dealers — pick a plan that fits your volume.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4"><span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><CreditCard size={18} className="text-gray-500" /></span><span className="font-bold">Free</span></div>
              <div className="mb-5"><span className="text-3xl font-extrabold">0</span><span className="text-gray-400 text-sm ml-1">VND/mo</span></div>
              <ul className="space-y-2.5 flex-1 mb-6 text-sm text-gray-600">{['2 listings/month','12% commission','Chatbot support','Approval: 24–48h'].map(f=><li key={f} className="flex items-center gap-2"><Check size={14} className="text-green-500 flex-shrink-0"/>{f}</li>)}</ul>
              <Link to={isAuthenticated ? "/seller/subscription" : "/register"} className="block text-center py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-400 transition-colors">Get started</Link>
            </div>
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4"><span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Zap size={18} className="text-amber-500" /></span><span className="font-bold">Basic</span></div>
              <div className="mb-5"><span className="text-3xl font-extrabold">{Math.round(plans.BASIC / 1000)}</span><span className="text-gray-400 text-sm ml-1">k/mo</span></div>
              <ul className="space-y-2.5 flex-1 mb-6 text-sm text-gray-600">{['10 listings/month','10% commission','"Verified Seller" badge','Approval: 12–24h','Basic analytics'].map(f=><li key={f} className="flex items-center gap-2"><Check size={14} className="text-green-500 flex-shrink-0"/>{f}</li>)}</ul>
              <Link to="/seller/subscription" className="block text-center py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition-colors">Upgrade</Link>
            </div>
            <div className="rounded-2xl border-2 border-accent bg-white p-6 flex flex-col relative shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most popular</div>
              <div className="flex items-center gap-2 mb-4"><span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Sparkles size={18} className="text-blue-500" /></span><span className="font-bold">Pro</span></div>
              <div className="mb-5"><span className="text-3xl font-extrabold">{Math.round(plans.PRO / 1000)}</span><span className="text-gray-400 text-sm ml-1">k/mo</span></div>
              <ul className="space-y-2.5 flex-1 mb-6 text-sm text-gray-600">{['30 listings/month','8% commission','"Pro Seller" badge ⭐','Priority in search','Approval: 8–12h','Detailed analytics','1 free boost/week'].map(f=><li key={f} className="flex items-center gap-2"><Check size={14} className="text-green-500 flex-shrink-0"/>{f}</li>)}</ul>
              <Link to="/seller/subscription" className="block text-center py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity">Upgrade</Link>
            </div>
            <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4"><span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Crown size={18} className="text-amber-600" /></span><span className="font-bold">Premium</span></div>
              <div className="mb-5"><span className="text-3xl font-extrabold">{Math.round(plans.PREMIUM / 1000)}</span><span className="text-gray-400 text-sm ml-1">k/mo</span></div>
              <ul className="space-y-2.5 flex-1 mb-6 text-sm text-gray-600">{['Unlimited listings','5% commission','"Premium Seller" badge 👑','Top search placement','Approval: 1–2h','2 free inspections/mo','24/7 hotline support','3 free boosts/week','Featured on homepage'].map(f=><li key={f} className="flex items-center gap-2"><Check size={14} className="text-green-500 flex-shrink-0"/>{f}</li>)}</ul>
              <Link to="/seller/subscription" className="block text-center py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors">Upgrade</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-24 px-4 text-center">
        <h2 className="text-4xl font-extrabold mb-6">UNSURE ABOUT THE SIZE?</h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">Don't risk buying a bike that doesn't fit. Use our Geometry comparison tool and AI Fit Calculator.</p>
        <button className="bg-white text-black px-8 py-3 font-bold text-sm hover:bg-gray-200 transition-colors">CHECK MY SIZE</button>
      </section>
    </div>
  );
};
