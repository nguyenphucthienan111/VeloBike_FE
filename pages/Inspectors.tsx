import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, MapPin, Clock, Search } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface Inspector {
  _id: string;
  fullName: string;
  avatar?: string;
  address?: { district?: string; city?: string; province?: string };
  reputation: { score: number; reviewCount: number };
  bio: string;
  yearsOfExperience: number;
  specializations: string[];
}

const specializationLabel: Record<string, string> = {
  ROAD: 'Road', MTB: 'MTB', E_BIKE: 'E-Bike',
  BMX: 'BMX', GRAVEL: 'Gravel', TRACK: 'Track', CITY: 'City',
};

const StarDisplay = ({ value }: { value: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} size={13}
        className={s <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}
        fill={s <= Math.round(value) ? 'currentColor' : 'none'} />
    ))}
  </div>
);

export const Inspectors: React.FC = () => {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/users/inspectors`)
      .then(r => r.json())
      .then(d => { if (d.success) setInspectors(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = inspectors.filter(i =>
    i.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (i.address?.city || i.address?.province || '').toLowerCase().includes(search.toLowerCase()) ||
    i.specializations.some(s => specializationLabel[s]?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Inspectors</h1>
          <p className="text-gray-500 text-sm">Browse and review profiles of VeloBike-certified inspectors.</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, location, specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p>No inspectors found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(inspector => {
              const location = [inspector.address?.district, inspector.address?.city || inspector.address?.province]
                .filter(Boolean).join(', ');
              return (
                <Link key={inspector._id} to={`/inspector/${inspector._id}/profile`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {inspector.avatar
                        ? <img src={inspector.avatar} alt={inspector.fullName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                            {inspector.fullName[0]}
                          </div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{inspector.fullName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarDisplay value={inspector.reputation.score} />
                        <span className="text-xs font-semibold text-gray-700">{inspector.reputation.score.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({inspector.reputation.reviewCount})</span>
                      </div>
                    </div>
                  </div>

                  {inspector.bio && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{inspector.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {inspector.specializations.slice(0, 3).map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {specializationLabel[s] || s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    {location && (
                      <span className="flex items-center gap-1"><MapPin size={11} />{location}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock size={11} />{inspector.yearsOfExperience} yrs exp</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
