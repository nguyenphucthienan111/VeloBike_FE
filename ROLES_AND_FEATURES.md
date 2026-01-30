# VeloBike - Tổng Hợp Các Trang và Tính Năng Theo Role

## 1. BUYER (Người Mua)

### Dashboard Pages:
1. **BuyerDashboard** ✅
   - Hiển thị tổng quan
   - Các sản phẩm yêu thích
   - Đơn hàng gần đây
   - Thông báo

2. **BuyerOrders** ✅
   - Danh sách đơn hàng
   - Lọc theo trạng thái
   - Chi tiết đơn hàng
   - Theo dõi vận chuyển

3. **BuyerWishlist** ✅
   - Danh sách sản phẩm yêu thích
   - Quản lý wishlist
   - Xem giá cảnh báo

4. **BuyerProfile** ✅
   - Chỉnh sửa thông tin cá nhân
   - Quản lý địa chỉ giao hàng
   - Thay đổi mật khẩu

### Tính Năng Chính:
- ✅ Duyệt marketplace
- ✅ Tìm kiếm sản phẩm
- ✅ Xem chi tiết sản phẩm
- ✅ Thêm vào giỏ hàng
- ✅ Thanh toán đơn hàng
- ✅ Theo dõi đơn hàng
- ✅ Để lại đánh giá
- ✅ Quản lý wishlist

---

## 2. SELLER (Người Bán)

### Dashboard Pages:
1. **SellerDashboard** ✅
   - Thống kê tổng quan
   - Doanh thu
   - Số views
   - Conversion rate
   - Sản phẩm bán chạy nhất
   - Giao dịch gần đây

2. **SellerInventory** ✅
   - Danh sách sản phẩm
   - Tìm kiếm & lọc
   - Chỉnh sửa sản phẩm
   - Xóa sản phẩm
   - Bulk update status
   - Bulk delete
   - Submit for approval

3. **AddProduct** ✅
   - Form thêm sản phẩm
   - Upload hình ảnh (drag & drop)
   - Upload video
   - Nhập chi tiết sản phẩm
   - Quản lý giá

4. **SellerAnalytics** ✅
   - Doanh thu theo thời gian (7d/30d/90d)
   - Views & clicks detail
   - Conversion rate
   - Performance trends
   - Best performing products
   - Daily performance timeline

5. **SellerOrders** ✅
   - Danh sách đơn hàng
   - Lọc theo trạng thái
   - Chi tiết đơn hàng
   - Timeline & escrow status
   - Update status to SHIPPING
   - Ghi chú

6. **SellerWallet** ✅
   - Xem số dư ví
   - Lịch sử giao dịch
   - Lịch sử rút tiền
   - Form rút tiền
   - Tính phí tự động (miễn phí >= 1M, 10K nếu < 1M)
   - Minimum 50K VNĐ

7. **SellerMessages** ✅
   - Danh sách hội thoại
   - Chat box
   - Lịch sử tin nhắn
   - Số tin nhắn chưa đọc

8. **SellerReviews** ✅
   - Rating tổng thể
   - Biểu đồ phân bố rating
   - Danh sách reviews
   - Lọc theo số sao
   - Trả lời reviews

9. **SellerProfile** ✅
   - Chỉnh sửa thông tin cá nhân
   - Upload avatar
   - Upload banner
   - Shop information
   - Business registration
   - Địa chỉ & thành phố

### Tính Năng Chính:
- ✅ Tạo & quản lý sản phẩm
- ✅ Upload ảnh/video
- ✅ Xem analytics & performance
- ✅ Quản lý đơn hàng
- ✅ Rút tiền từ ví
- ✅ Chat với buyers
- ✅ Xem & trả lời reviews
- ✅ Chỉnh sửa profile

### API Routes:
```
GET /api/analytics/seller/dashboard
GET /api/analytics/seller/performance
GET /api/analytics/listing/:id
GET /api/listings/my-listings
POST /api/listings
PUT /api/listings/:id
DELETE /api/listings/:id
PUT /api/listings/:id/submit-approval
GET /api/orders (filter by seller)
PUT /api/orders/:id/status
GET /api/wallet/balance
GET /api/wallet/transactions
POST /api/wallet/withdraw
GET /api/withdrawals
GET /api/messages
GET /api/messages/conversation/:userId
POST /api/messages
GET /api/reviews/seller-reviews
POST /api/reviews/:reviewId/reply
GET /api/users/profile
PUT /api/users/profile
```

---

## 3. ADMIN (Quản Trị Viên) - TODO

### Dashboard Pages:
1. **AdminDashboard** ❌
   - Thống kê hệ thống
   - Tổng users
   - Tổng sellers
   - Tổng revenue
   - Pending listings

2. **AdminUsers** ❌
   - Danh sách tất cả users
   - Lọc theo role (BUYER/SELLER/INSPECTOR)
   - Lọc theo status (active/inactive)
   - Update KYC status (PENDING/VERIFIED/REJECTED)
   - Ban/unban users
   - Search users

3. **AdminListings** ❌
   - Danh sách tất cả listings
   - Lọc theo status
   - Approve/reject listings
   - Add note khi reject

4. **AdminOrders** ❌
   - Danh sách tất cả orders
   - Xem chi tiết order
   - Release payout

5. **AdminAnalytics** ❌
   - Revenue metrics
   - User metrics
   - Transaction stats

6. **AdminInspectors** ❌
   - Danh sách inspectors
   - Assign inspection tasks
   - View inspection reports

### Tính Năng Chính:
- ❌ Quản lý users
- ❌ Quản lý sellers
- ❌ Duyệt listings
- ❌ Quản lý KYC
- ❌ Ban/unban users
- ❌ Quản lý inspectors
- ❌ Xem analytics

### API Routes:
```
GET /api/admin/dashboard
GET /api/admin/users (filter by role/status)
PUT /api/admin/users/:userId/kyc
PUT /api/admin/users/:userId/status
GET /api/admin/listings
PUT /api/admin/listings/:listingId/status
GET /api/admin/orders
PUT /api/admin/orders/:id/payout
GET /api/admin/inspectors
```

---

## 4. INSPECTOR (Thanh Tra Viên) - TODO

### Dashboard Pages:
1. **InspectorDashboard** ❌
   - Danh sách inspection tasks
   - Pending inspections
   - Completed inspections
   - Stats

2. **InspectionDetail** ❌
   - Chi tiết inspection
   - Form fill inspection report
   - Checkpoints
   - Evidence images upload
   - Overall verdict & score

3. **InspectionHistory** ❌
   - Lịch sử inspections
   - Filter by status
   - View completed reports

### Tính Năng Chính:
- ❌ Nhận inspection tasks
- ❌ Điền inspection report
- ❌ Upload hình chứng cứ
- ❌ Submit final verdict
- ❌ Xem lịch sử inspections

### API Routes:
```
POST /api/inspections
GET /api/inspections/:orderId
PUT /api/inspections/:inspectionId
```

---

## 5. GUEST (Khách) 
- Không cần dashboard
- Chỉ có thể duyệt marketplace và xem chi tiết sản phẩm
- Không cần login

---

## Mô Tả Quy Trình Kiểm Định (Inspection Flow)

```
1. Seller tạo listing
2. Buyer mua hàng
3. Order được tạo với status = CREATED
4. Admin assign inspector
5. Inspector nhận inspection task
6. Inspector điền report:
   - Các checkpoints (Frame, Brake, Chain, v.v)
   - Status: PASS/FAIL/WARN
   - Severity: LOW/MEDIUM/CRITICAL
   - Evidence images
   - Overall verdict: PASSED/FAILED/SUGGEST_ADJUSTMENT
7. Nếu PASSED: Order → INSPECTION_PASSED → SHIPPING
8. Nếu FAILED: Refund buyer
9. Nếu SUGGEST_ADJUSTMENT: Seller có thể chỉnh sửa
10. Order → DELIVERED → COMPLETED
11. Release payout to seller
```

---

## Summary

| Role | Pages | Status | API Routes |
|------|-------|--------|-----------|
| BUYER | 4 | ✅ Done | Ready |
| SELLER | 9 | ✅ Done | Ready |
| ADMIN | 6 | ❌ TODO | Ready |
| INSPECTOR | 3 | ❌ TODO | Ready |
| GUEST | - | N/A | N/A |

---

## Next Steps

1. **Priority 1:** Admin Dashboard & User Management
2. **Priority 2:** Inspector Dashboard & Inspection Form
3. **Priority 3:** Admin Listings & Orders Management
