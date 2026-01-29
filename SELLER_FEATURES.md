# VeloBike Backend - Tổng Hợp Trang & Tính Năng (Role: SELLER)

## 📋 Các Trang Chính cho Seller

### 1. **Seller Dashboard** (Overview)
📍 Route: `GET /api/dashboard/seller/analytics`

**Tính năng:**
- 📊 Thống kê tổng quan (Total Listings, Total Views, Total Sales, Total Revenue)
- 💰 Average Order Value & Conversion Rate
- 📈 Listings by Status
- ⭐ Top Listings
- 🔄 Recent Transactions
- 🎯 Quick Actions (Quản lý kho, Xem phân tích, Đơn hàng mới, Tin nhắn)

---

### 2. **Inventory Management** (Quản Lý Kho)
📍 Route: `GET /api/listings/my-listings`

**Tính năng:**
- 📝 Danh sách sản phẩm của seller
- ➕ Tạo listing mới (POST `/api/listings`)
- ✏️ Chỉnh sửa listing (PUT `/api/listings/:id`)
- 🗑️ Xóa listing (DELETE `/api/listings/:id`)
- 🔍 Tìm kiếm & Filter
- 📊 Xem chi tiết sản phẩm
- 🏷️ Bulk Update Status (PUT `/api/bulk/listings/update-status`)
- 🗑️ Bulk Delete (DELETE `/api/bulk/listings/delete`)
- ✅ Submit listing for approval (PUT `/api/listings/:id/submit-approval`)

---

### 3. **Analytics & Performance**
📍 Routes:
- `GET /api/analytics/seller/dashboard`
- `GET /api/analytics/seller/performance` (query: period=7d/30d/90d)
- `GET /api/dashboard/seller/performance`

**Tính năng:**
- 📈 Doanh thu theo thời gian (7 ngày, 30 ngày, 90 ngày)
- 📊 Views & Clicks per listing
- 💹 Conversion Rate
- 📉 Performance Trends
- 🎯 Best Performing Products
- 🔍 Performance Metrics Detail

---

### 4. **Orders Management** (Quản Lý Đơn Hàng)
📍 Routes:
- `GET /api/orders` (filter by status, role, page, limit)
- `GET /api/orders/:id`
- `GET /api/orders/:id/timeline`
- `PUT /api/orders/:id/status`
- `GET /api/orders/:id/escrow-status`

**Tính năng:**
- 📋 Danh sách đơn hàng (buyers purchase their products)
- 🔍 Filter by status (CREATED, ESCROW_LOCKED, IN_INSPECTION, INSPECTION_PASSED, SHIPPING, DELIVERED, COMPLETED)
- ⏱️ Order Timeline & Status History
- 🚚 Update Status → SHIPPING (when inspection passed)
- 💰 Escrow Status & Transaction History
- 📝 Add notes to orders
- 🔄 Order Transitions

---

### 5. **Wallet & Withdrawals** (Ví & Rút Tiền)
📍 Routes:
- `POST /api/wallet/withdraw`
- `GET /api/wallet/balance`
- `GET /api/wallet/transactions`
- `GET /api/withdrawals` (history)

**Tính năng:**
- 💰 Xem số dư ví
- 💳 Lịch sử giao dịch
- 🏦 Yêu cầu rút tiền (min 50,000 VNĐ)
- 📊 Phí rút tiền:
  - Miễn phí nếu >= 1,000,000 VNĐ
  - 10,000 VNĐ nếu < 1,000,000 VNĐ
- 📋 Lịch sử rút tiền

---

### 6. **Messaging** (Tin Nhắn)
📍 Routes:
- `GET /api/messages/conversation/:userId`
- `POST /api/messages`
- `GET /api/messages` (get conversations)

**Tính năng:**
- 💬 Chat với buyers/customers
- 📨 Gửi tin nhắn
- 📖 Lịch sử trò chuyện
- 🔗 Liên kết đến listing hoặc order

---

### 7. **Reviews & Ratings** (Đánh Giá)
📍 Routes:
- `GET /api/reviews/seller-reviews`
- `POST /api/reviews/:reviewId/reply`

**Tính năng:**
- ⭐ Xem đánh giá từ buyers
- 📝 Trả lời đánh giá
- 🏆 Seller Rating Score
- 💬 Feedback Management

---

### 8. **Notifications** (Thông Báo)
📍 Route: `GET /api/notifications`

**Tính năng:**
- 🔔 Thông báo đơn hàng mới
- 📬 Thông báo tin nhắn
- ⚠️ Thông báo hệ thống
- ✅ Mark as read

---

### 9. **Profile Management** (Hồ Sơ)
📍 Routes:
- `GET /api/users/profile`
- `PUT /api/users/profile`

**Tính năng:**
- 👤 Xem thông tin cá nhân
- ✏️ Chỉnh sửa profile
- 🏪 Shop information
- 🏷️ Business registration
- 📸 Avatar/Banner upload

---

### 10. **Subscription Management** (Gói Đăng Ký)
📍 Routes:
- `GET /api/subscriptions/current`
- `GET /api/subscriptions/plans`
- `POST /api/subscriptions/upgrade` hoặc `PUT /api/subscriptions/downgrade`

**Tính năng:**
- 💎 Xem gói hiện tại
- 📋 Danh sách gói có sẵn
- 📈 Upgrade/Downgrade gói
- 🎁 Benefits của mỗi gói

---

## 📊 Order Status Flow cho Seller

```
CREATED → ESCROW_LOCKED → IN_INSPECTION → INSPECTION_PASSED → SHIPPING → DELIVERED → COMPLETED
                                                   ↓
                                         INSPECTION_FAILED (Refund)
```

**Seller Actions:**
1. Tạo listing
2. Buyer tạo order
3. Seller xem đơn hàng
4. Sau khi inspection passed → Seller update status → SHIPPING
5. Theo dõi đơn hàng
6. Nhận tiền khi COMPLETED

---

## 🔗 API Endpoints Summary

### Dashboard & Analytics
- `GET /api/dashboard/seller/analytics` - Dashboard overview
- `GET /api/dashboard/seller/performance` - Performance metrics
- `GET /api/dashboard/seller/inventory` - Inventory data
- `GET /api/analytics/seller/dashboard` - Detailed analytics
- `GET /api/analytics/seller/performance` - Performance over time
- `GET /api/analytics/listing/:id` - Single listing analytics

### Inventory
- `GET /api/listings/my-listings` - Get seller's listings
- `POST /api/listings` - Create listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `PUT /api/listings/:id/submit-approval` - Submit for approval
- `PUT /api/bulk/listings/update-status` - Bulk update status
- `DELETE /api/bulk/listings/delete` - Bulk delete

### Orders
- `GET /api/orders` - Get seller's orders
- `GET /api/orders/:id` - Get order detail
- `GET /api/orders/:id/timeline` - Get order timeline
- `PUT /api/orders/:id/status` - Update status
- `GET /api/orders/:id/escrow-status` - Get escrow status
- `POST /api/orders/:id/transition` - Advanced transition

### Wallet
- `GET /api/wallet/balance` - Get balance
- `GET /api/wallet/transactions` - Transaction history
- `POST /api/wallet/withdraw` - Request withdrawal
- `GET /api/withdrawals` - Withdrawal history

### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/conversation/:userId` - Get conversation
- `POST /api/messages` - Send message

### Reviews
- `GET /api/reviews/seller-reviews` - Get reviews
- `POST /api/reviews/:reviewId/reply` - Reply to review

### Profile
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile

### Subscription
- `GET /api/subscriptions/current` - Current subscription
- `GET /api/subscriptions/plans` - Available plans
- `POST /api/subscriptions/upgrade` - Upgrade
- `PUT /api/subscriptions/downgrade` - Downgrade

### Notifications
- `GET /api/notifications` - Get notifications

---

## 🎯 Frontend Pages to Build

1. ✅ Seller Dashboard (Overview)
2. ✅ Seller Inventory (Manage Listings)
3. ✅ Seller Analytics (Performance)
4. ⏳ Seller Orders (Order Management)
5. ⏳ Seller Wallet (Balance & Withdrawals)
6. ⏳ Seller Messages (Conversations)
7. ⏳ Seller Reviews (Feedback)
8. ⏳ Seller Profile (Settings)
9. ⏳ Seller Subscription (Plans)
10. ⏳ Seller Notifications (Alerts)

---

## 🔐 Authentication & Authorization

- Tất cả endpoints đều yêu cầu `protect` middleware (Bearer token)
- Seller chỉ có thể access các endpoint được `authorize(UserRole.SELLER)`
- Seller chỉ có thể xem/edit data của chính họ
