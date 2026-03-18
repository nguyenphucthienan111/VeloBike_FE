import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../constants';

const SPECIALIZATIONS = ['ROAD', 'MTB', 'GRAVEL', 'TRIATHLON', 'E_BIKE'];

interface Certificate {
  name: string;
  issuedBy: string;
  issuedYear: number;
  imageUrl: string;
}

interface ExistingApplication {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  rejectionReason?: string;
  certificates: Certificate[];
  bio: string;
  yearsOfExperience: number;
}

export const InspectorApply: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [kycStatus, setKycStatus] = useState('');
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [form, setForm] = useState({
    phone: '',
    yearsOfExperience: 0,
    specializations: [] as string[],
    bio: '',
  });
  const [certificates, setCertificates] = useState<Certificate[]>([
    { name: '', issuedBy: '', issuedYear: new Date().getFullYear(), imageUrl: '' },
  ]);

  useEffect(() => {
    fetchUserStatus();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { navigate('/login'); return; }

      const [meRes, appRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/inspector-applications/my`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setKycStatus(meData.data?.kycStatus || 'PENDING');
        setForm(f => ({ ...f, phone: meData.data?.phone || '' }));
      }
      if (appRes.ok) {
        const appData = await appRes.json();
        setExistingApp(appData.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecToggle = (spec: string) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter(s => s !== spec)
        : [...f.specializations, spec],
    }));
  };

  const handleCertChange = (idx: number, field: keyof Certificate, value: string | number) => {
    setCertificates(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const handleCertImageUpload = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        handleCertChange(idx, 'imageUrl', data.data.url);
      } else {
        setError('Upload ảnh thất bại');
      }
    } catch {
      setError('Lỗi upload ảnh');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (certificates.some(c => !c.name || !c.issuedBy || !c.imageUrl)) {
      setError('Vui lòng điền đầy đủ thông tin và upload ảnh cho tất cả chứng chỉ');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/inspector-applications`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, certificates }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Đơn đăng ký đã được gửi! Admin sẽ xem xét trong vòng 1-3 ngày làm việc.');
        await fetchUserStatus();
      } else {
        setError(data.message || 'Gửi đơn thất bại');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show existing application status
  if (existingApp) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Đơn đăng ký Inspector</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            {existingApp.status === 'PENDING' && (
              <>
                <Clock size={48} className="text-yellow-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Đang chờ duyệt</h2>
                <p className="text-gray-600">Đơn của bạn đã được gửi vào {new Date(existingApp.createdAt).toLocaleDateString('vi-VN')}. Admin sẽ xem xét trong 1-3 ngày làm việc.</p>
              </>
            )}
            {existingApp.status === 'APPROVED' && (
              <>
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Đơn đã được duyệt</h2>
                <p className="text-gray-600 mb-4">Chúc mừng! Bạn đã trở thành Inspector của VeloBike.</p>
                <button onClick={() => navigate('/inspector/dashboard')}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                  Vào Inspector Dashboard
                </button>
              </>
            )}
            {existingApp.status === 'REJECTED' && (
              <>
                <XCircle size={48} className="text-red-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Đơn bị từ chối</h2>
                {existingApp.rejectionReason && (
                  <p className="text-gray-600 mb-4">Lý do: {existingApp.rejectionReason}</p>
                )}
                <p className="text-sm text-gray-500">Bạn có thể nộp lại đơn sau khi bổ sung thêm chứng chỉ.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký làm Inspector</h1>
        <p className="text-gray-600 mb-8">Trở thành chuyên gia kiểm định xe đạp trên VeloBike. Yêu cầu: KYC đã xác minh + có chứng chỉ kỹ thuật.</p>

        {/* KYC Warning */}
        {kycStatus !== 'VERIFIED' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium">⚠️ Bạn cần hoàn thành KYC trước khi nộp đơn.</p>
            <button onClick={() => navigate('/seller/kyc')}
              className="mt-2 text-sm text-yellow-700 underline">Xác minh KYC ngay →</button>
          </div>
        )}

        {/* Conflict of interest notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 font-medium">ℹ️ Lưu ý quan trọng</p>
          <p className="text-sm text-blue-700 mt-1">
            Inspector là vai trò độc lập. Nếu được duyệt, tài khoản của bạn sẽ chuyển sang role <strong>INSPECTOR</strong> và không thể đồng thời mua bán xe trên nền tảng. Điều này đảm bảo tính khách quan trong kiểm định.
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Thông tin cơ bản</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required placeholder="0901234567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số năm kinh nghiệm</label>
              <input type="number" min={0} max={50} value={form.yearsOfExperience}
                onChange={e => setForm(f => ({ ...f, yearsOfExperience: Number(e.target.value) }))}
                required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chuyên môn</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(s => (
                  <button key={s} type="button" onClick={() => handleSpecToggle(s)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                      form.specializations.includes(s)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu bản thân</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                required rows={4} placeholder="Mô tả kinh nghiệm, kỹ năng và lý do bạn muốn làm inspector..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Chứng chỉ kỹ thuật</h2>
              <button type="button"
                onClick={() => setCertificates(p => [...p, { name: '', issuedBy: '', issuedYear: new Date().getFullYear(), imageUrl: '' }])}
                className="text-sm text-gray-600 hover:text-black underline">+ Thêm chứng chỉ</button>
            </div>
            <div className="space-y-5">
              {certificates.map((cert, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                  {certificates.length > 1 && (
                    <button type="button" onClick={() => setCertificates(p => p.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tên chứng chỉ *</label>
                      <input value={cert.name} onChange={e => handleCertChange(idx, 'name', e.target.value)}
                        required placeholder="VD: Certified Bicycle Mechanic"
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tổ chức cấp *</label>
                      <input value={cert.issuedBy} onChange={e => handleCertChange(idx, 'issuedBy', e.target.value)}
                        required placeholder="VD: SBMA, Shimano, Trek"
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Năm cấp *</label>
                      <input type="number" value={cert.issuedYear} min={1990} max={new Date().getFullYear()}
                        onChange={e => handleCertChange(idx, 'issuedYear', Number(e.target.value))}
                        required className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                    </div>
                  </div>
                  {/* Certificate image upload */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ảnh chứng chỉ *</label>
                    {cert.imageUrl ? (
                      <div className="flex items-center gap-3">
                        <img src={cert.imageUrl} alt="cert" className="w-20 h-14 object-cover rounded border" />
                        <button type="button" onClick={() => handleCertChange(idx, 'imageUrl', '')}
                          className="text-xs text-red-500 hover:underline">Xóa</button>
                      </div>
                    ) : (
                      <label className={`flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-gray-500 transition-colors ${uploadingIdx === idx ? 'opacity-50' : ''}`}>
                        <Upload size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {uploadingIdx === idx ? 'Đang upload...' : 'Click để upload ảnh chứng chỉ'}
                        </span>
                        <input type="file" accept="image/*" className="hidden"
                          disabled={uploadingIdx !== null}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleCertImageUpload(idx, f); }} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting || kycStatus !== 'VERIFIED'}
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Đang gửi...' : 'Nộp đơn đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
};
