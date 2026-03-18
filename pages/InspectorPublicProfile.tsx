import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, Award, MapPin, Clock, ChevronLeft, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface Certificate {
  name: string;
  issuedBy: string;
  issuedYear: number;
  imageUrl: string;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewerRole: string;
  reviewerId: { fullName: string; avatar?: string };
  categories: { professionalism: number; accuracy: number; communication: number; timeliness: number };
  createdAt: string;
}

interface InspectorProfile {
  _id: string;
  fullName: string;
  avatar?: string;
  address?: { district?: string; city?: string; province?: string };
  memberSince: string;
  bio: string;
  yearsOfExperience: number;
  specializations: string[];
  certificates: Certificate[];
  reputation: {
    score: number;
    reviewCount: number;
    categories: { professionalism: number; accuracy: number; communication: number; timeliness: number };
  };
  recentReviews: Review[];
}

const StarDisplay = ({ value, size = 16 }: { value: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={size}
        className={s <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}
        fill={s <= Math.round(value) ? 'currentColor' : 'none'} />
    ))}
  </div>
);

const specializationLabel: Record<string, string> = {
  ROAD: 'Road Bike', MTB: 'Mountain Bike', E_BIKE: 'E-Bike',
  BMX: 'BMX', GRAVEL: 'Gravel', TRACK: 'Track', CITY: 'City Bike',
};

export const InspectorPublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<InspectorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE_URL}/users/inspectors/${id}/profile`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProfile(d.data);
        else setError(d.message || 'Inspector not found');
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">{error || 'Inspector not found'}</p>
        <Link to="/marketplace" className="text-sm text-black underline mt-2 inline-block">Back to Marketplace</Link>
      </div>
    </div>
  );

  const location = [profile.address?.district, profile.address?.city || profile.address?.province]
    .filter(Boolean).join(', ');

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/marketplace" className="text-xs text-gray-500 hover:text-black flex items-center gap-1 mb-6">
          <ChevronLeft size={12} /> BACK
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.fullName} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                    {profile.fullName[0]}
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{profile.fullName}</h1>
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  <ShieldCheck size={12} /> Certified Inspector
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-gray-500">
                {location && (
                  <span className="flex items-center gap-1"><MapPin size={13} />{location}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={13} />{profile.yearsOfExperience} yrs experience
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StarDisplay value={profile.reputation.score} size={18} />
                <span className="font-bold text-gray-900">{profile.reputation.score.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({profile.reputation.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t pt-4">{profile.bio}</p>
          )}

          {profile.specializations.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.specializations.map(s => (
                <span key={s} className="text-xs bg-black text-white px-2 py-1 rounded">
                  {specializationLabel[s] || s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rating Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Detailed Ratings</h2>
            {profile.reputation.reviewCount === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {([
                  ['professionalism', 'Professionalism'],
                  ['accuracy', 'Accuracy'],
                  ['communication', 'Communication'],
                  ['timeliness', 'Timeliness'],
                ] as const).map(([key, label]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold">{profile.reputation.categories[key].toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-yellow-400 h-1.5 rounded-full"
                        style={{ width: `${(profile.reputation.categories[key] / 5) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award size={16} /> Certificates
            </h2>
            {profile.certificates.length === 0 ? (
              <p className="text-sm text-gray-400">No certificates.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {profile.certificates.map((cert, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedCert(cert)}
                    className="rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors group"
                  >
                    <img
                      src={cert.imageUrl}
                      alt={`Certificate ${i + 1}`}
                      className="w-full aspect-[4/3] object-cover group-hover:opacity-90 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        {profile.recentReviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-6">
            <h2 className="font-bold text-gray-900 mb-4">Recent Reviews</h2>
            <div className="space-y-4">
              {profile.recentReviews.map(review => (
                <div key={review._id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {review.reviewerId?.avatar
                          ? <img src={review.reviewerId.avatar} alt="" className="w-full h-full object-cover" />
                          : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                              {review.reviewerId?.fullName?.[0] || '?'}
                            </span>
                        }
                      </div>
                      <span className="text-sm font-medium text-gray-800">{review.reviewerId?.fullName || 'Anonymous'}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {review.reviewerRole === 'BUYER' ? 'Buyer' : 'Seller'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarDisplay value={review.rating} size={13} />
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certificate Lightbox */}
      {selectedCert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCert(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-3">
              <button onClick={() => setSelectedCert(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <img src={selectedCert.imageUrl} alt="Certificate" className="w-full rounded-lg object-contain max-h-[75vh]" />
          </div>
        </div>
      )}
    </div>
  );
};
