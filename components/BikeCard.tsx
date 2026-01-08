import React from 'react';
import { BikeListing, InspectionStatus } from '../types';
import { MapPin, ShieldCheck, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BikeCardProps {
  bike: BikeListing;
}

export const BikeCard: React.FC<BikeCardProps> = ({ bike }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <Link to={`/bike/${bike.id}`} className="group block bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 ease-out overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img 
          src={bike.imageUrl} 
          alt={bike.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
           {bike.isVerified && (
            <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1 uppercase tracking-wider">
              <ShieldCheck size={12} className="text-accent" />
              Verified
            </span>
           )}
           {bike.inspectionStatus === InspectionStatus.PASSED && (
             <span className="bg-accent/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
               Passed 50-Point
             </span>
           )}
        </div>

        {/* Condition Score Bubble */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Activity size={12} className="text-accent" />
          {bike.conditionScore}/10
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{bike.brand}</div>
          <div className="text-xs text-gray-400">{bike.year}</div>
        </div>
        
        <h3 className="font-bold text-lg leading-tight mb-2 text-gray-900 group-hover:text-accent transition-colors line-clamp-2 min-h-[3rem]">
          {bike.model}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <span className="bg-gray-100 px-2 py-1 rounded">{bike.specs.groupset.split(' ')[0]}</span>
          <span className="bg-gray-100 px-2 py-1 rounded">{bike.size}</span>
          <span className="flex items-center gap-1"><MapPin size={12}/> {bike.location}</span>
        </div>

        <div className="flex items-end justify-between border-t border-gray-100 pt-3">
          <div>
            <span className="text-xs text-gray-400 line-through block">{formatPrice(bike.originalPrice)}</span>
            <span className="text-lg font-bold text-accent">{formatPrice(bike.price)}</span>
          </div>
          <button className="text-xs font-bold text-black border-b border-black pb-0.5 group-hover:border-accent group-hover:text-accent transition-colors">
            VIEW DETAILS
          </button>
        </div>
      </div>
    </Link>
  );
};