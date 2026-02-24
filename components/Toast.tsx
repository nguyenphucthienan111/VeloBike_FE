import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
      border: 'border-green-600',
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
      border: 'border-red-600',
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
      border: 'border-blue-600',
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠',
      border: 'border-yellow-600',
    },
  };

  const style = styles[type];

  return (
    <div 
      className="fixed top-4 right-4 z-50"
      style={{
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div
        className={`${style.bg} text-white px-6 py-4 rounded-lg shadow-xl border-l-4 ${style.border} min-w-[300px] max-w-[500px] flex items-center gap-3 backdrop-blur-sm`}
      >
        <div className="flex-shrink-0 text-xl font-bold">{style.icon}</div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-80 transition-opacity text-white text-lg font-bold"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Hook để dùng Toast dễ dàng hơn
export const useToast = () => {
  const [toast, setToast] = React.useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  return {
    toast,
    showToast,
    hideToast,
  };
};
