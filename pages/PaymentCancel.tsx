import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const PaymentCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [listingId, setListingId] = useState<string | null>(null);

  useEffect(() => {
    const cancelOrder = async () => {
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      const savedListingId = localStorage.getItem('pendingListingId');
      const token = localStorage.getItem('accessToken');

      if (savedListingId) {
        setListingId(savedListingId);
      }

      if (pendingOrderId && token) {
        try {
          // Cancel the order
          await fetch(`${API_BASE_URL}/orders/${pendingOrderId}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'CANCELLED',
              note: 'User cancelled payment on PayOS',
            }),
          });

          // Clear pending order
          localStorage.removeItem('pendingOrderId');
          localStorage.removeItem('pendingListingId');
        } catch (err) {
          console.error('Error cancelling order:', err);
        }
      }
    };

    cancelOrder();
  }, []);

  const handleBackToProduct = () => {
    if (listingId) {
      navigate(`/bike/${listingId}`);
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cancel Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment has been cancelled.
          </h1>
          <p className="text-gray-600">
            Your order has been canceled and no payment has been made.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">What happened?</h2>
          <p className="text-gray-600 mb-4">
            You cancelled the payment transaction on the PayOS payment gateway. 
            The order has been automatically cancelled and no charges have been made.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> If you still want to purchase this product, 
              please go back to the product page and complete the payment again.
            </p>
          </div>
        </div>

        {/* Reasons */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Common reasons:</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>You changed your mind about the purchase</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>You wanted to review the order details again</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>You had an issue with the payment method</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>You wanted to add or remove items from the order</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleBackToProduct}
            className="flex-1 bg-accent text-white py-3 px-6 rounded-lg font-semibold hover:bg-accent/90 transition flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to product
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Browse other products
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Need help? {' '}
            <a href="/contact" className="text-accent hover:underline font-medium">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
