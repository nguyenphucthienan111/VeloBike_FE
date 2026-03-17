import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, FileCheck } from 'lucide-react';

export const InspectionService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <ShieldCheck className="text-accent" size={36} />
            Inspection service
          </h1>
          <p className="mt-4 text-gray-600 text-lg">
            Every bike is professionally inspected before hand‑off – protecting the buyer.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <FileCheck className="text-accent mb-3" size={32} />
            <h2 className="font-semibold text-gray-900 mb-2">Technical inspection</h2>
            <p className="text-sm text-gray-600">
              Experts inspect the frame, cockpit, drivetrain, wheels and overall condition.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <CheckCircle className="text-accent mb-3" size={32} />
            <h2 className="font-semibold text-gray-900 mb-2">Detailed report</h2>
            <p className="text-sm text-gray-600">
              You receive a score, photos, and comments before you commit to payment.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <ShieldCheck className="text-accent mb-3" size={32} />
            <h2 className="font-semibold text-gray-900 mb-2">Purchase protection</h2>
            <p className="text-sm text-gray-600">
              Funds are held safely in escrow until you confirm you&apos;re happy with the bike.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
          <p className="text-gray-600 mb-4">
            When you buy a bike on the Marketplace, you can add an inspection to your order.
            The inspection fee is shown clearly at checkout.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
};
