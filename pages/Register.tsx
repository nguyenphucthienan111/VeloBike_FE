import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/profile');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Join VeloBike</h1>
          <p className="text-gray-500 text-sm">The premium marketplace for cyclists</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">First Name</label>
              <input type="text" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Last Name</label>
              <input type="text" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Email Address</label>
            <input type="email" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Password</label>
            <input type="password" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Confirm Password</label>
            <input type="password" className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input type="checkbox" className="mt-1" />
            <span className="text-xs text-gray-500">I agree to the <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.</span>
          </div>

          <button 
            type="submit"
            className="w-full bg-black text-white font-bold py-4 uppercase tracking-widest hover:bg-accent transition-colors mt-4"
          >
            Create Account
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-black font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};