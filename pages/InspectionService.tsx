import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle, FileCheck } from 'lucide-react';

export const InspectionService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <ShieldCheck className="text-accent" size={36} />
            Dịch vụ kiểm định
          </h1>
          <p className="mt-4 text-gray-600 text-lg">
            Xe được kiểm định chuyên nghiệp trước khi giao – bảo vệ người mua.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <FileCheck className="text-accent mb-3" size={32} />
            <h2 className="font-semibold text-gray-900 mb-2">Kiểm tra kỹ thuật</h2>
            <p className="text-sm text-gray-600">Chuyên gia kiểm tra khung, nhóm lái, truyền động và tình trạng tổng thể.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <CheckCircle className="text-accent mb-3" size={32} />
            <h2 className="font-semibold text-gray-900 mb-2">Báo cáo chi tiết</h2>
            <p className="text-sm text-gray-600">Bạn nhận báo cáo điểm số, hình ảnh và đánh giá trước khi thanh toán.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <ShieldCheck className="text-accent mb-3" size={32} />
            <h2 className="font-semibold text-gray-900 mb-2">Bảo vệ mua hàng</h2>
            <p className="text-sm text-gray-600">Tiền được giữ an toàn (escrow) cho đến khi bạn xác nhận hài lòng.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
          <p className="text-gray-600 mb-4">Khi mua xe trên Marketplace, bạn có thể chọn kiểm định cho đơn hàng. Chi phí kiểm định được hiển thị rõ khi đặt hàng.</p>
          <Link to="/marketplace" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Xem Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
};
