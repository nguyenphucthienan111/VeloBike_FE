import React, { useState, useEffect } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { InspectorSidebar } from '../../components/InspectorSidebar';
import { InspectorHeader } from '../../components/InspectorHeader';
import { API_BASE_URL } from '../../constants';

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  categories: {
    professionalism: number;
    accuracy: number;
    communication: number;
    timeliness: number;
  };
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewerRole: string;
  reviewerId: { fullName: string; avatar?: string };
  inspectionId: { overallScore: number; grade: string; overallVerdict: string; completedAt: string };
  categories: { professionalism: number; accuracy: number; communication: number; timeliness: number };
  createdAt: string;
}

const StarDisplay = ({ value, size = 16 }: { value: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={size} className={s <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}
        fill={s <= Math.round(value) ? 'currentColor' : 'none'} />
    ))}
  </div>
);

export const InspectorReviews: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMyReviews();
  }, [page]);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      // Get current user id first
      const meRes = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) return;
      const meData = await meRes.json();
      const inspectorId = meData.data?._id || meData.data?.id;

      const res = await fetch(`${API_BASE_URL}/inspector-reviews/inspector/${inspectorId}?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.data || []);
        setStats(data.stats || null);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <InspectorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <InspectorSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <InspectorHeader />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Đánh giá của tôi</h1>

            {/* Stats Overview */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                    <StarDisplay value={stats.averageRating} size={20} />
                    <p className="text-sm text-gray-500 mt-1">{stats.totalReviews} đánh giá</p>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {([
                      ['professionalism', 'Chuyên nghiệp'],
                      ['accuracy', 'Độ chính xác'],
                      ['communication', 'Giao tiếp'],
                      ['timeliness', 'Đúng giờ'],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-600">{label}</span>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400" fill="currentColor" />
                          <span className="text-sm font-semibold">{stats.categories[key].toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {stats.totalReviews === 0 && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <TrendingUp size={16} />
                    <span>Chưa có đánh giá nào. Hoàn thành các inspection để nhận đánh giá từ khách hàng.</span>
                  </div>
                )}
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Star size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Chưa có đánh giá nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {review.reviewerId?.avatar
                            ? <img src={review.reviewerId.avatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-xs font-semibold text-gray-600">
                                {review.reviewerId?.fullName?.[0] || '?'}
                              </span>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.reviewerId?.fullName || 'Ẩn danh'}</p>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {review.reviewerRole === 'BUYER' ? 'Người mua' : 'Người bán'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <StarDisplay value={review.rating} />
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{review.comment}</p>

                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 border-t pt-3">
                      {(['professionalism', 'accuracy', 'communication', 'timeliness'] as const).map((k) => (
                        <div key={k} className="text-center">
                          <Star size={10} className="text-yellow-400 inline" fill="currentColor" />
                          <span className="ml-0.5">{review.categories[k]}</span>
                        </div>
                      ))}
                    </div>

                    {review.inspectionId && (
                      <div className="mt-2 text-xs text-gray-400">
                        Inspection: Grade {review.inspectionId.grade} · Score {review.inspectionId.overallScore}/10 · {review.inspectionId.overallVerdict}
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-40">Trước</button>
                    <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-40">Sau</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
