import React from 'react';
import { ArrowRight, Shield, RefreshCw, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_LISTINGS } from '../constants';
import { BikeCard } from '../components/BikeCard';

export const Home: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-gray-50">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')` }}></div>
        
        {/* Simulated High-End Hero Image */}
        <div className="absolute inset-0 overflow-hidden">
             <img 
                src="https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=2070&auto=format&fit=crop" 
                alt="Premium Road Bike" 
                className="w-full h-full object-cover object-center brightness-75"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 animate-fade-in-up">
            RIDE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">EXTRAORDINARY</span>
          </h1>
          <p className="text-gray-200 text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto">
            The managed marketplace for verified pre-owned performance bicycles. 
            Inspection certified. Escrow secured.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace" className="bg-accent text-white px-8 py-4 font-bold text-sm tracking-widest hover:bg-accent-hover transition-colors flex items-center justify-center gap-2">
              BROWSE BIKES <ArrowRight size={16} />
            </Link>
            <Link to="/sell" className="bg-transparent border border-white text-white px-8 py-4 font-bold text-sm tracking-widest hover:bg-white hover:text-black transition-colors">
              SELL YOURS
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props - "Why Us" */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-accent">
              <Shield size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">50-Point Inspection</h3>
            <p className="text-gray-500 leading-relaxed">Every bike is physically verified by certified mechanics. No cracks, no surprises. We check what you can't see.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-accent">
              <RefreshCw size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Escrow Payments</h3>
            <p className="text-gray-500 leading-relaxed">We hold your money safely. The seller only gets paid when you receive the bike and confirm it matches the report.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-accent">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Premium Selection</h3>
            <p className="text-gray-500 leading-relaxed">Curated inventory of high-end Road, MTB, and Triathlon bikes. Brands like Specialized, Pinarello, and Cervélo.</p>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Trending Arrivals</h2>
                    <p className="text-gray-500">Freshly inspected carbon machines.</p>
                </div>
                <Link to="/marketplace" className="text-accent font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    VIEW ALL <ArrowRight size={16}/>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MOCK_LISTINGS.map(bike => (
                    <BikeCard key={bike.id} bike={bike} />
                ))}
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-24 px-4 text-center">
        <h2 className="text-4xl font-extrabold mb-6">UNSURE ABOUT THE SIZE?</h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">
            Don't risk buying a bike that doesn't fit. Use our Geometry comparison tool and AI Fit Calculator.
        </p>
        <button className="bg-white text-black px-8 py-3 font-bold text-sm hover:bg-gray-200 transition-colors">
            CHECK MY SIZE
        </button>
      </section>
    </div>
  );
};