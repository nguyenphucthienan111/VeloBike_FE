import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface InspectorRatingModalProps {
  inspectionId: string;
  inspectorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const StarRating = ({ value, onChange, size = 24 }: { value: number; onChange: (v: number) => void; size?: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" onClick={() => onChange(star)}
        className={`${star <= value ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}>
        <Star size={size} fill={star <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

const ratingLabel = (r: number) =>
  r === 5 ? 'Xuất sắc' : r === 4 ? 'Tốt' : r === 3 ? 'Bình thường' : r === 2 ? 'Không hài lòng' : 'Tệ';

export const InspectorRatingModal: React.FC<InspectorRatingModalProps> = ({
  inspectionId, inspectorName, onClose, onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    professionalism: 5,
    accuracy: 5,
    communication: 5,
    timeliness: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/inspector-reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionId, rating, comment, categories }),
      });
      const data = await res.json();
      if (res.ok) { onSuccess(); onClose(); }
      else setError(data.message || 'Không thể gửi đánh giá');
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Đánh giá Inspector</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

          <p className="text-sm text-gray-600">Inspector: <span className="font-semibold text-gray-900">{inspectorName}</span></p>

          {/* Overall Rating */}
          <div className="flex flex-col items-center py-2">
            <label className="text-sm font-medium text-gray-700 mb-2">Đánh giá tổng quan</label>
            <StarRating value={rating} onChange={setRating} size={32} />
            <p className="text-sm text-gray-500 mt-1 font-medium">{ratingLabel(rating)}</p>
          </div>

          {/* Category Ratings */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            {([
              ['professionalism', 'Tính chuyên nghiệp'],
              ['accuracy', 'Độ chính xác kiểm định'],
              ['communication', 'Giao tiếp & thái độ'],
              ['timeliness', 'Đúng giờ & tiến độ'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{label}</span>
                <StarRating value={categories[key]} onChange={(v) => setCategories(p => ({ ...p, [key]: v }))} size={16} />
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét chi tiết</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} required rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn về inspector..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium">Hủy</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 font-medium disabled:opacity-50">
              {loading ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
