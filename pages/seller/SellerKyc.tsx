import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, CONNECTION_ERROR_MESSAGE, isConnectionError } from '../../constants';
import { Store, Upload } from 'lucide-react';

type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export const SellerKyc: React.FC = () => {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/kyc/my-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data?.data?.kycStatus) {
          if (data.data.kycStatus === 'VERIFIED') {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (user?.role === 'BUYER') {
              const upRes = await fetch(`${API_BASE_URL}/users/me/upgrade-to-seller`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (upRes.ok) {
                const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
                if (meRes.ok) {
                  const meData = await meRes.json();
                  const u = meData.data;
                  localStorage.setItem('user', JSON.stringify({ id: u._id || u.id, email: u.email, fullName: u.fullName, role: 'SELLER', kycStatus: 'VERIFIED', emailVerified: u.emailVerified, avatar: u.avatar }));
                  window.dispatchEvent(new Event('authStatusChanged'));
                }
              }
            } else if (user?.role === 'SELLER') {
              const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
              if (meRes.ok) {
                const meData = await meRes.json();
                const u = meData.data;
                localStorage.setItem('user', JSON.stringify({ id: u._id || u.id, email: u.email, fullName: u.fullName, role: u.role, kycStatus: 'VERIFIED', emailVerified: u.emailVerified, avatar: u.avatar }));
                window.dispatchEvent(new Event('authStatusChanged'));
              }
            }
            navigate('/seller/dashboard');
            return;
          }
          setKycStatus(data.data.kycStatus);
        } else setKycStatus(null);
      } catch {
        setKycStatus(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (frontPreview) {
        URL.revokeObjectURL(frontPreview);
      }
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }
    };
  }, [frontPreview, selfiePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!idCardFront || !selfie) {
      setError('Vui lòng chọn đủ ảnh CCCD mặt trước và ảnh selfie.');
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    setSubmitLoading(true);
    try {
      const form = new FormData();
      form.append('idCardFront', idCardFront);
      form.append('selfie', selfie);
      const res = await fetch(`${API_BASE_URL}/kyc/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Gửi eKYC thất bại.');
        return;
      }

      // eKYC thành công
      // KHÔNG tự động set VERIFIED và redirect ngay.
      // Fetch lại status thực tế từ BE để quyết định.
      try {
        const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (meRes.ok) {
          const meData = await meRes.json();
          const u = meData.data;
          
          // Cập nhật localStorage
          localStorage.setItem('user', JSON.stringify({ 
            id: u._id || u.id, 
            email: u.email, 
            fullName: u.fullName, 
            role: u.role, 
            kycStatus: u.kycStatus, // Status thực tế từ DB
            emailVerified: u.emailVerified, 
            avatar: u.avatar 
          }));
          window.dispatchEvent(new Event('authStatusChanged'));

          if (u.kycStatus === 'VERIFIED' || u.kycStatus === 'APPROVED') {
            // Nếu eKYC tự động thành công (VERIFIED) -> gọi upgrade-to-seller
            if (u.role !== 'SELLER') {
               await fetch(`${API_BASE_URL}/users/me/upgrade-to-seller`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              // Update local storage role manually to avoid another fetch
              const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), role: 'SELLER' };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              window.dispatchEvent(new Event('authStatusChanged'));
            }

            setSuccess('KYC đã được duyệt tự động! Đang chuyển hướng...');
            setTimeout(() => navigate('/seller/dashboard'), 1500);
          } else {
            setKycStatus('PENDING'); // Hiển thị trạng thái chờ
            setSuccess('Hồ sơ KYC đã được gửi thành công và đang chờ Admin duyệt. Vui lòng quay lại sau.');
            // Không navigate, để user đọc thông báo
          }
        }
      } catch (err) {
        console.error('Error refreshing user status:', err);
        setSuccess('Hồ sơ đã gửi. Vui lòng tải lại trang để cập nhật trạng thái.');
      }
      
      setIdCardFront(null);
      setSelfie(null);
    } catch (err: unknown) {
      setError(isConnectionError(err) ? CONNECTION_ERROR_MESSAGE : (err as Error).message || 'Gửi eKYC thất bại.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-gray-500">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Store className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Đăng ký cửa hàng</h1>
            <p className="text-sm text-gray-500">Xác thực danh tính (KYC) để mở cửa hàng trên VeloBike</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {kycStatus === 'PENDING' && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Hồ sơ KYC của bạn đang chờ Admin duyệt. Bạn vẫn có thể cập nhật lại thông tin bên dưới nếu cần.
            </div>
          )}
          {kycStatus === 'REJECTED' && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 space-y-1">
              <p className="font-medium">Hệ thống không xác thực được giấy tờ của bạn.</p>
              <p>Vui lòng chụp lại ảnh CCCD và selfie rõ nét, đủ ánh sáng. Đảm bảo khuôn mặt trên CCCD khớp với ảnh selfie. Bạn có thể gửi lại bất cứ lúc nào.</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">{success}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh CCCD mặt trước</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setIdCardFront(file);

                if (frontPreview) {
                  URL.revokeObjectURL(frontPreview);
                  setFrontPreview(null);
                }

                if (file) {
                  const url = URL.createObjectURL(file);
                  setFrontPreview(url);
                }
              }}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
            />
            {frontPreview && (
              <div className="mt-2">
                <img
                  src={frontPreview}
                  alt="Ảnh CCCD mặt trước xem trước"
                  className="h-32 rounded border border-gray-200 object-contain bg-gray-50"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh selfie khuôn mặt</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelfie(file);

                if (selfiePreview) {
                  URL.revokeObjectURL(selfiePreview);
                  setSelfiePreview(null);
                }

                if (file) {
                  const url = URL.createObjectURL(file);
                  setSelfiePreview(url);
                }
              }}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
            />
            {selfiePreview && (
              <div className="mt-2">
                <img
                  src={selfiePreview}
                  alt="Ảnh selfie xem trước"
                  className="h-32 rounded border border-gray-200 object-contain bg-gray-50"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
            >
              {submitLoading ? 'Đang gửi...' : 'Gửi xác thực'}
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
