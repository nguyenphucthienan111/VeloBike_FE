import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_LISTINGS } from '../constants';
import { ShieldCheck, Ruler, Truck, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bike = MOCK_LISTINGS.find(b => b.id === id);

  if (!bike) return <div className="p-20 text-center">Bike not found</div>;

  const geometryData = [
    { name: 'Stack', value: bike.geometry.stack },
    { name: 'Reach', value: bike.geometry.reach },
    { name: 'Top Tube', value: bike.geometry.topTubeLength || 540 },
  ];

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
             <img src={bike.imageUrl} alt={bike.title} className="w-full h-full object-cover" />
             
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                 <div className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                     DRAG TO ROTATE 360°
                 </div>
             </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity">
                      <img src={`https://picsum.photos/400?random=${i}`} className="w-full h-full object-cover"/>
                  </div>
              ))}
          </div>

          {/* Inspection Report Section */}
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
                             <p className="font-bold text-black">Alex M.</p>
                             <p className="text-xs">Certified VeloBike Inspector</p>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
        </div>

        {/* Right Column: details & Action */}
        <div className="lg:col-span-4 space-y-8">
            <div>
                <div className="text-sm text-gray-400 mb-1">{bike.year} • {bike.type}</div>
                <h1 className="text-3xl font-extrabold leading-tight mb-2">{bike.title}</h1>
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs font-bold bg-black text-white px-2 py-1">SIZE {bike.size}</span>
                    <span className="text-xs text-gray-500">Ideal height: 172-178cm</span>
                </div>
                
                <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-4xl font-bold text-accent">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bike.price)}
                    </span>
                    <span className="text-gray-400 line-through text-sm">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bike.originalPrice)}
                    </span>
                </div>

                <div className="space-y-3">
                    <button className="w-full bg-accent hover:bg-red-600 text-white py-4 font-bold uppercase tracking-widest transition-colors shadow-lg shadow-red-200">
                        Buy Now (Escrow)
                    </button>
                    <button className="w-full border border-black hover:bg-black hover:text-white text-black py-4 font-bold uppercase tracking-widest transition-colors">
                        Make an Offer
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
                    <div className="text-gray-500">Frame</div>
                    <div className="font-medium">{bike.specs.frameMaterial}</div>
                    
                    <div className="text-gray-500">Groupset</div>
                    <div className="font-medium">{bike.specs.groupset}</div>
                    
                    <div className="text-gray-500">Wheels</div>
                    <div className="font-medium">{bike.specs.wheelset}</div>
                    
                    <div className="text-gray-500">Brakes</div>
                    <div className="font-medium">{bike.specs.brakeType}</div>

                    {bike.specs.suspensionTravel && (
                        <>
                            <div className="text-gray-500">Suspension</div>
                            <div className="font-medium">{bike.specs.suspensionTravel}</div>
                        </>
                    )}
                </div>
            </div>

            {/* Geometry Chart */}
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
    </div>
  );
};