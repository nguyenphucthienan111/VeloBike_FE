import React from 'react';
import { MessageCircle } from 'lucide-react';

export const BuyerMessages: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No messages yet.</p>
        <p className="text-sm text-gray-500 mt-1">Contact the seller from the bike detail page.</p>
      </div>
    </div>
  );
};
