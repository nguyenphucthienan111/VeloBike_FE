import React, { useState } from 'react';

interface Review {
  id: string;
  buyerName: string;
  rating: number;
  content: string;
  date: string;
  product: string;
  replied: boolean;
  reply?: string;
}

export const SellerReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      buyerName: 'Nguyễn Văn A',
      rating: 5,
      content: 'Sản phẩm rất tốt, giao hàng nhanh. Sẽ mua lại!',
      date: '28/01/2026',
      product: 'Trek X-Caliber',
      replied: true,
      reply: 'Cảm ơn bạn đã đánh giá! Chúng tôi rất vui được phục vụ bạn.',
    },
    {
      id: '2',
      buyerName: 'Trần Thị B',
      rating: 4,
      content: 'Chất lượng tốt nhưng giao hàng hơi chậm.',
      date: '25/01/2026',
      product: 'Giant Talon',
      replied: false,
    },
    {
      id: '3',
      buyerName: 'Phạm Văn C',
      rating: 5,
      content: 'Tuyệt vời! Hàng đúng như mô tả. Rất hài lòng.',
      date: '22/01/2026',
      product: 'Specialized Rockhopper',
      replied: false,
    },
  ]);

  const [replyText, setReplyText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const handleReply = (reviewId: string) => {
    if (!replyText.trim()) return;

    setReviews(reviews.map(r =>
      r.id === reviewId
        ? { ...r, replied: true, reply: replyText }
        : r
    ));
    setReplyText('');
    setReplyingToId(null);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array(rating).fill(0).map((_, i) => (
          <span key={i}>⭐</span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Đánh Giá & Phản Hồi</h1>
          <p className="text-gray-600 mt-1">Quản lý đánh giá từ khách hàng</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Đánh Giá Trung Bình</p>
            <div className="flex items-end gap-4">
              <p className="text-5xl font-bold text-gray-900">{averageRating}</p>
              <div>
                {renderStars(Math.round(parseFloat(averageRating)))}
                <p className="text-xs text-gray-500 mt-1">{reviews.length} đánh giá</p>
              </div>
            </div>
          </div>

          {/* Total Reviews */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Tổng Đánh Giá</p>
            <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-green-600 text-sm mt-2">+3 tuần này</p>
          </div>

          {/* Positive Reviews */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Đánh Giá Tích Cực (4-5 ⭐)</p>
            <p className="text-3xl font-bold text-green-600">
              {reviews.filter(r => r.rating >= 4).length}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100).toFixed(0)}%
            </p>
          </div>

          {/* Replied */}
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Đã Trả Lời</p>
            <p className="text-3xl font-bold text-blue-600">
              {reviews.filter(r => r.replied).length}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {((reviews.filter(r => r.replied).length / reviews.length) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            📊 Phân Bố Đánh Giá
          </h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-16">
                  <span className="text-sm font-medium text-gray-900">{stars}</span>
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${(ratingDistribution[stars as keyof typeof ratingDistribution] / reviews.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">
                  {ratingDistribution[stars as keyof typeof ratingDistribution]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">
            💬 Tất Cả Đánh Giá
          </h2>
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              {/* Review Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-gray-900">{review.buyerName}</p>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm text-gray-600">{review.product} • {review.date}</p>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-gray-700 mb-4">{review.content}</p>

              {/* Reply */}
              {review.replied && review.reply && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Trả lời của bạn:</p>
                  <p className="text-sm text-blue-800">{review.reply}</p>
                </div>
              )}

              {/* Reply Form */}
              {replyingToId === review.id ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Viết phản hồi của bạn..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none h-20"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReply(review.id)}
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                    >
                      Gửi Trả Lời
                    </button>
                    <button
                      onClick={() => {
                        setReplyingToId(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                !review.replied && (
                  <button
                    onClick={() => setReplyingToId(review.id)}
                    className="text-accent font-medium text-sm hover:text-red-600 transition-colors"
                  >
                    Trả Lời
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
