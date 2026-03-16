import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface ReviewModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ orderId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Detailed ratings
  const [categories, setCategories] = useState({
    itemAccuracy: 5,
    communication: 5,
    shipping: 5,
    packaging: 5
  });

  const handleCategoryChange = (category: keyof typeof categories, value: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          rating,
          comment,
          categories
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Không thể gửi đánh giá');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value: number, onChange: (val: number) => void, size = 24) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`${star <= value ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}
          >
            <Star size={size} fill={star <= value ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Đánh giá đơn hàng</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Overall Rating */}
          <div className="flex flex-col items-center justify-center mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2">Đánh giá tổng quan</label>
            {renderStars(rating, setRating, 32)}
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {rating === 5 ? 'Tuyệt vời' : rating === 4 ? 'Hài lòng' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Không hài lòng' : 'Tệ'}
            </p>
          </div>

          {/* Detailed Ratings */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Sản phẩm đúng mô tả</span>
              {renderStars(categories.itemAccuracy, (val) => handleCategoryChange('itemAccuracy', val), 16)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Giao tiếp người bán</span>
              {renderStars(categories.communication, (val) => handleCategoryChange('communication', val), 16)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Thời gian giao hàng</span>
              {renderStars(categories.shipping, (val) => handleCategoryChange('shipping', val), 16)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Đóng gói sản phẩm</span>
              {renderStars(categories.packaging, (val) => handleCategoryChange('packaging', val), 16)}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhận xét chi tiết
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm và người bán..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 font-medium disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
