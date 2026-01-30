import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerSidebar } from '../../components/SellerSidebar';

interface Review {
  id: string;
  buyerName: string;
  buyerAvatar?: string;
  rating: number;
  title: string;
  content: string;
  productTitle: string;
  createdAt: string;
  reply?: string;
  replyDate?: string;
}

interface SellerRating {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export const SellerReviews: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerRating, setSellerRating] = useState<SellerRating | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/reviews/seller-reviews', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.data?.reviews || []);
        setSellerRating(data.data?.rating);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyReview = async () => {
    if (!replyText.trim() || !selectedReview) return;

    try {
      setReplyLoading(true);
      setReplyError('');
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`http://localhost:5000/api/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reply: replyText,
        }),
      });

      if (response.ok) {
        // Update the review with the reply
        setReplyText('');
        setSelectedReview(null);
        // Refresh reviews
        await fetchReviews();
      } else {
        const data = await response.json();
        setReplyError(data.message || 'Gửi phản hồi thất bại');
      }
    } catch (error) {
      console.error('Error replying to review:', error);
      setReplyError('Lỗi khi gửi phản hồi');
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  const filteredReviews = filterRating 
    ? reviews.filter(r => r.rating === filterRating)
    : reviews;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <SellerSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your reviews and ratings</p>
            </div>

            {/* Profile Section */}
            <button 
              onClick={() => navigate('/seller/profile')}
              className="flex items-center gap-3 pl-4 border-l border-gray-300 hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500">SELLER</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center font-bold text-white text-sm">
                {user?.fullName?.charAt(0) || 'S'}
              </div>
            </button>
          </div>

          {/* Rating Summary */}
          {sellerRating && (
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Overall Rating */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Overall Rating</h2>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold text-gray-900">{sellerRating.averageRating.toFixed(1)}</div>
                  <div>
                    <div className="flex gap-1 mb-2">
                      {renderStars(Math.round(sellerRating.averageRating))}
                    </div>
                    <p className="text-sm text-gray-600">Based on {sellerRating.totalReviews} reviews</p>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Rating Distribution</h2>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-8">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width: `${sellerRating.totalReviews > 0 ? (sellerRating.ratingDistribution[rating as keyof typeof sellerRating.ratingDistribution] / sellerRating.totalReviews) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">
                        {sellerRating.ratingDistribution[rating as keyof typeof sellerRating.ratingDistribution]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filter by Rating */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilterRating(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterRating === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Reviews
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterRating === rating
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {rating}★
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-gray-900">{review.buyerName}</p>
                        <div className="flex gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">For: {review.productTitle}</p>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>

                  {/* Review Title and Content */}
                  <div className="mb-4">
                    <p className="font-semibold text-gray-900 mb-2">{review.title}</p>
                    <p className="text-gray-700 text-sm">{review.content}</p>
                  </div>

                  {/* Seller Reply */}
                  {review.reply ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-xs font-semibold text-blue-900 mb-2">Your Reply</p>
                      <p className="text-sm text-gray-700">{review.reply}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(review.replyDate || '')}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setReplyText('');
                        setReplyError('');
                      }}
                      className="text-sm font-semibold text-accent hover:underline mb-4"
                    >
                      Reply to this review
                    </button>
                  )}

                  {/* Reply Form */}
                  {selectedReview?.id === review.id && !review.reply && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Your Reply</label>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 resize-none"
                          rows={3}
                        />
                      </div>

                      {replyError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">{replyError}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedReview(null);
                            setReplyText('');
                            setReplyError('');
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReplyReview}
                          disabled={!replyText.trim() || replyLoading}
                          className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-600 transition-colors font-medium"
                        >
                          {replyLoading ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">
                  {filterRating ? `No reviews with ${filterRating}★ rating` : 'No reviews yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
