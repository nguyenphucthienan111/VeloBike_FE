# VeloBike Seller Dashboard - Backend Requirements

## Overview
Seller Dashboard là giao diện chính cho người bán hàng quản lý xe đạp và kinh doanh của họ.

---

## 1. INVENTORY MANAGEMENT (Quản lý hàng)

### 1.1 Danh sách xe của seller (My Listings)
- **Endpoint**: `GET /api/listings/my-listings`
- **Auth**: Required (SELLER)
- **Hiển thị**:
  - Danh sách tất cả xe của seller
  - Status: DRAFT, PUBLISHED, SOLD
  - Xem, chỉnh sửa, xóa từng xe
  - Bulk operations (update status, delete nhiều)

### 1.2 Tạo listing mới (Create Listing)
- **Endpoint**: `POST /api/listings`
- **Auth**: Required (SELLER)
- **Fields**:
  - title, description
  - type (ROAD, MTB, GRAVEL, TRIATHLON, E_BIKE)
  - generalInfo: brand, model, year, size, condition
  - specs: frameMaterial, groupset, wheelset, brakeType, weight
  - pricing: amount, originalPrice, currency
  - media: thumbnails, videoUrl
  - location: coordinates, address
  - inspectionRequired: boolean

### 1.3 Chỉnh sửa listing (Update Listing)
- **Endpoint**: `PUT /api/listings/:id`
- **Auth**: Required (SELLER)
- **Tính năng**:
  - Update bất kỳ field nào
  - Chỉ seller là owner hoặc admin mới được sửa

### 1.4 Xóa listing (Delete Listing)
- **Endpoint**: `DELETE /api/listings/:id`
- **Auth**: Required (SELLER)

### 1.5 Submit listing cho approval
- **Endpoint**: `PUT /api/listings/:id/submit-approval`
- **Auth**: Required (SELLER)
- **Mô tả**: Gửi listing từ DRAFT sang pending approval

### 1.6 Bulk Operations
- **Update Status**: `PUT /api/bulk/listings/update-status`
  - Request: { listingIds, status }
  - Cập nhật status nhiều listings cùng lúc
- **Bulk Delete**: `DELETE /api/bulk/listings/delete`
  - Xóa nhiều listings

---

## 2. ANALYTICS & PERFORMANCE

### 2.1 Seller Analytics Dashboard
- **Endpoint**: `GET /api/analytics/seller/dashboard`
- **Auth**: Required (SELLER)
- **Dữ liệu trả về**:
  - **Overview**:
    - totalListings: tổng xe
    - totalViews: tổng lượt xem
    - totalSales: tổng đơn bán
    - totalRevenue: tổng doanh thu
    - averageOrderValue: giá trung bình đơn hàng
    - conversionRate: tỷ lệ chuyển đổi
  - **listingsByStatus**: số listing theo status
  - **topListings**: 5 listing hot nhất
  - **recentTransactions**: giao dịch gần đây

### 2.2 Seller Performance Over Time
- **Endpoint**: `GET /api/analytics/seller/performance`
- **Auth**: Required (SELLER)
- **Query**: period (7d, 30d, 90d)
- **Dữ liệu**:
  - Sales trends theo thời gian
  - Revenue trends
  - Performance metrics

### 2.3 Seller Analytics (Dashboard)
- **Endpoint**: `GET /api/dashboard/seller/analytics`
- **Auth**: Required (SELLER)
- **Trả về**: Sales, revenue, trends

### 2.4 Seller Performance Metrics
- **Endpoint**: `GET /api/dashboard/seller/performance`
- **Auth**: Required (SELLER)
- **Dữ liệu**: Performance metrics

---

## 3. LOGISTICS & SHIPPING

### 3.1 Create Shipment
- **Endpoint**: `POST /api/logistics/create-shipment`
- **Auth**: Required (SELLER/ADMIN)
- **Request**:
  - orderId: ID đơn hàng
  - serviceId: dịch vụ vận chuyển (GHN, GHTK, ...)
- **Mô tả**: Tạo đơn vận chuyển cho order

### 3.2 Track Shipment
- **Endpoint**: `GET /api/logistics/tracking/:trackingNumber`
- **Auth**: Optional
- **Trả về**: Tracking info của shipment

### 3.3 Calculate Shipping Fee
- **Endpoint**: `POST /api/logistics/calculate-fee`
- **Auth**: Optional
- **Mô tả**: Tính phí vận chuyển dựa trên địa điểm

---

## 4. ORDERS & TRANSACTIONS

### 4.1 Get Seller Orders
- **Endpoint**: `GET /api/orders` (filter by seller)
- **Auth**: Required (SELLER)
- **Hiển thị**: Danh sách đơn hàng của seller

### 4.2 View Order Details
- **Endpoint**: `GET /api/orders/:orderId`
- **Auth**: Required (SELLER)

### 4.3 View Transactions
- **Endpoint**: `GET /api/transactions` (seller's transactions)
- **Auth**: Required (SELLER)

---

## 5. SUBSCRIPTION & UPGRADES

### 5.1 Current Subscription
- **Endpoint**: `GET /api/subscriptions/current`
- **Auth**: Required (SELLER)
- **Trả về**:
  - Current plan: FREE, BASIC, PREMIUM, ENTERPRISE
  - Expiry date
  - Features available

### 5.2 Available Plans
- **Endpoint**: `GET /api/subscriptions/plans`
- **Auth**: Optional
- **Trả về**: Danh sách subscription plans

### 5.3 Upgrade/Downgrade
- **Endpoint**: `POST /api/subscriptions/upgrade` or `PUT /api/subscriptions/downgrade`
- **Auth**: Required (SELLER)

---

## 6. WALLET & WITHDRAWALS

### 6.1 Wallet Balance
- **Endpoint**: `GET /api/wallet/balance`
- **Auth**: Required (SELLER)
- **Trả về**: Current balance

### 6.2 Wallet Transactions
- **Endpoint**: `GET /api/wallet/transactions`
- **Auth**: Required (SELLER)

### 6.3 Request Withdrawal
- **Endpoint**: `POST /api/withdrawals`
- **Auth**: Required (SELLER)
- **Request**: { amount, bankAccount }

### 6.4 Withdrawal History
- **Endpoint**: `GET /api/withdrawals`
- **Auth**: Required (SELLER)

---

## 7. PROFILE & ACCOUNT MANAGEMENT

### 7.1 Update Profile
- **Endpoint**: `PUT /api/users/profile`
- **Auth**: Required
- **Fields**: fullName, email, avatar, phone, address

### 7.2 View Profile
- **Endpoint**: `GET /api/users/profile`
- **Auth**: Required

### 7.3 Change Password
- **Endpoint**: `POST /api/auth/change-password`
- **Auth**: Required
- **Request**: { oldPassword, newPassword }

---

## 8. REVIEWS & RATINGS

### 8.1 Seller Reviews
- **Endpoint**: `GET /api/reviews/seller-reviews`
- **Auth**: Required (SELLER)
- **Trả về**: Tất cả reviews cho seller

### 8.2 Reply to Review
- **Endpoint**: `POST /api/reviews/:reviewId/reply`
- **Auth**: Required (SELLER/ADMIN)

---

## 9. LISTING BOOST & PROMOTION

### 9.1 Boost Listing
- **Endpoint**: `POST /api/listings/:id/boost`
- **Auth**: Required (SELLER)
- **Mô tả**: Đẩy listing lên đầu tìm kiếm

### 9.2 Featured Listings
- **Endpoint**: `GET /api/listings/featured`
- **Auth**: Optional
- **Trả về**: Featured listings (premium sellers only)

---

## 10. MESSAGES & NOTIFICATIONS

### 10.1 Messages (Chat with Buyers)
- **Endpoint**: `GET /api/messages` (seller's conversations)
- **Auth**: Required (SELLER)

### 10.2 Send Message
- **Endpoint**: `POST /api/messages`
- **Auth**: Required

### 10.3 Notifications
- **Endpoint**: `GET /api/notifications`
- **Auth**: Required (SELLER)
- **Types**: New order, message, review, payment, etc.

---

## SELLER DASHBOARD PAGES TO BUILD

### 1. **Dashboard Overview** (Home)
- Analytics cards: Total sales, revenue, listings, views
- Recent orders
- Top selling bikes
- Performance chart (sales trend)

### 2. **Inventory Management**
- List my listings (with filters: status, type)
- Create new listing button
- Edit/Delete actions per item
- Bulk actions (update status, delete)
- Filters: Status (DRAFT, PUBLISHED, SOLD), Type, Date

### 3. **Analytics & Reports**
- Sales chart (7d, 30d, 90d)
- Revenue chart
- Top products
- Conversion rate
- Views per listing

### 4. **Orders**
- Order list with status (pending, processing, delivered, cancelled)
- Order details
- Track shipment
- Mark as delivered

### 5. **Listings Management** (Alternative to Inventory)
- Same as Inventory but more detailed view

### 6. **Shipping & Logistics**
- Create shipment
- Track shipment
- Shipping history

### 7. **Subscription & Upgrades**
- Current plan info
- Available plans to upgrade
- Upgrade/Downgrade button
- Plan features comparison

### 8. **Wallet & Withdrawals**
- Current balance
- Transaction history
- Withdraw button
- Withdrawal requests history

### 9. **Profile Settings**
- Edit profile (name, avatar, phone, address)
- Change password
- Bank account for withdrawal
- Account settings

### 10. **Reviews & Ratings**
- All reviews received
- Reply to reviews
- Rating statistics

### 11. **Messages** (Optional)
- Chat with buyers
- Message list

---

## PRIORITY IMPLEMENTATION ORDER

1. **Phase 1 (MVP)**:
   - Dashboard Overview
   - Inventory Management (CRUD listings)
   - Analytics & Reports

2. **Phase 2**:
   - Orders Management
   - Shipping & Logistics
   - Profile Settings

3. **Phase 3**:
   - Subscription Management
   - Wallet & Withdrawals
   - Reviews & Ratings

4. **Phase 4 (Nice to have)**:
   - Messages
   - Advanced Analytics
   - Promotions & Boost

---

## NOTES

- Tất cả seller endpoints cần authentication (Bearer token)
- Seller chỉ có thể xem/sửa data của chính họ
- Admin có thể xem tất cả (có authorize check)
- Implement pagination cho danh sách lớn
- Thêm error handling cho tất cả API calls
