import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ConfirmReceivedModalProps {
  orderId: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export const ConfirmReceivedModal: React.FC<ConfirmReceivedModalProps> = ({
  orderId,
  onClose,
  onConfirm,
  loading
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl transform transition-all">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Confirm receipt</h3>
          </div>
          
          <div className="space-y-3 mb-6">
            <p className="text-gray-600 text-sm">
              Do you confirm that you have received the package and the product matches the description?
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <span className="font-bold">Important note:</span> After confirmation, the money will be immediately transferred to the seller and you will <span className="font-bold">not be able to dispute</span> any damage, wrong item, or request a refund.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
            >
              Check again
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm & Complete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
