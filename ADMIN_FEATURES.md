# ADMIN - Quản Trị Viên Hệ Thống

## 📋 Tổng Quan

**Role:** ADMIN  
**Mục đích:** Quản lý toàn bộ hệ thống VeloBike  
**Quyền hạn:** Quản lý users, sellers, listings, orders, inspectors, analytics

---

## 🎯 Các Trang Chính

### 1. **Admin Dashboard** (Trang Chủ)
**Route:** `/admin/dashboard`

#### Tính Năng:
- 📊 **Dashboard Statistics** - Thống kê tổng quan hệ thống
  - Total Users (Buyers, Sellers, Inspectors)
  - Total Revenue (Platform fee)
  - Total Orders
  - Total Transactions
  - Pending Listings (chờ duyệt)
  - Pending KYC (chờ xác minh)
  - Active Inspectors

- 📈 **Analytics**
  - Revenue by period (7d/30d/90d)
  - New users by period
  - New sellers by period
  - Top sellers
  - Most viewed listings

- 🔔 **Recent Activities**
  - Newly registered users
  - Pending listings
  - Reported listings
  - Failed inspections
  - Pending payouts

#### API Endpoints:
```
GET /api/admin/dashboard
```

---

### 2. **Admin Users** (Quản Lý Người Dùng)
**Route:** `/admin/users`

#### Tính Năng:
- 👥 **User List**
  - Danh sách tất cả users
  - Phân trang (page, limit)
  - Tìm kiếm user (email, fullName, id)

- 🔍 **Filters**
  - Lọc theo role: BUYER, SELLER, INSPECTOR, ADMIN
  - Lọc theo status: active, inactive
  - Lọc theo KYC status: PENDING, VERIFIED, REJECTED
  - Lọc theo email verified: yes, no

- 👤 **User Actions**
  - Xem chi tiết user
  - Ban/Unban user (set inactive/active)
  - Update KYC status (PENDING → VERIFIED/REJECTED)
  - Edit user info
  - View user's listings (nếu seller)
  - View user's orders

- 📋 **User Info Display**
  - Email
  - Full Name
  - Phone
  - Role (BUYER/SELLER/INSPECTOR)
  - Status (active/inactive)
  - KYC Status
  - Email Verified
  - Join Date
  - Last Login

- ⚠️ **KYC Management**
  - View KYC documents (front, back image)
  - KYC status: PENDING, VERIFIED, REJECTED
  - Confidence score
  - Verified by
  - Notes

#### API Endpoints:
```
GET /api/admin/users (query: role, status, page, limit)
PUT /api/admin/users/:userId/kyc (body: kycStatus, note)
PUT /api/admin/users/:userId/status (body: isActive)
```

---

### 3. **Admin Listings** (Duyệt Sản Phẩm)
**Route:** `/admin/listings`

#### Tính Năng:
- 📝 **Listings List**
  - Danh sách tất cả listings
  - Phân trang
  - Tìm kiếm (title, seller name, id)

- 🔍 **Filters**
  - Lọc theo status: DRAFT, PENDING_APPROVAL, PUBLISHED, SOLD, REJECTED
  - Lọc theo seller
  - Lọc theo category
  - Lọc theo date range

- ✅ **Listing Actions**
  - Xem chi tiết listing
  - Approve/Publish listing
  - Reject listing (with reason/note)
  - View seller info
  - View listing images
  - View pricing
  - View general info (brand, model, year, size)

- 📊 **Listing Info Display**
  - Title
  - Description
  - Seller name & email
  - Status
  - Price
  - Category
  - Brand, Model, Year, Size
  - Views count
  - Created date
  - Images

- 🚫 **Rejection**
  - Form để nhập lý do rejection
  - Note được gửi cho seller
  - Status → REJECTED

#### API Endpoints:
```
GET /api/admin/listings (query: status, page, limit)
PUT /api/admin/listings/:listingId/status (body: status, note)
```

---

### 4. **Admin Orders** (Quản Lý Đơn Hàng)
**Route:** `/admin/orders`

#### Tính Năng:
- 📋 **Orders List**
  - Danh sách tất cả orders
  - Phân trang
  - Tìm kiếm (order id, buyer, seller)

- 🔍 **Filters**
  - Lọc theo status: CREATED, ESCROW_LOCKED, IN_INSPECTION, INSPECTION_PASSED, SHIPPING, DELIVERED, COMPLETED
  - Lọc theo date range
  - Lọc theo price range

- 👁️ **Order Details**
  - Order ID
  - Buyer name & email
  - Seller name & email
  - Listing title
  - Price & Amount
  - Status
  - Timeline
  - Escrow status
  - Inspection status
  - Payment info
  - Shipping info

- 💰 **Payout Management**
  - Xem unpaid orders
  - View seller's pending payout
  - Release payout to seller (khi order COMPLETED)
  - Payout history

#### API Endpoints:
```
GET /api/admin/orders (query: status, page, limit)
PUT /api/admin/orders/:id/payout (release payout)
```

---

### 5. **Admin Analytics** (Phân Tích)
**Route:** `/admin/analytics`

#### Tính Năng:
- 📈 **System Metrics**
  - Total Revenue (platform fees)
  - Total Orders
  - Total Users
  - Total Sellers
  - Total Transactions
  - Active Listings

- 💹 **Revenue Analytics**
  - Revenue by period (7d/30d/90d/year)
  - Revenue by seller (top 10)
  - Revenue chart
  - Average order value

- 👥 **User Analytics**
  - New users by period
  - User growth chart
  - User by role (BUYER, SELLER, INSPECTOR)
  - Active users
  - Inactive users

- 📊 **Listing Analytics**
  - Total listings
  - Listings by status
  - Listings by category
  - Top 10 most viewed listings
  - Sold vs Active listings

- 🚚 **Order Analytics**
  - Total orders
  - Completed orders
  - Failed inspections
  - Average order processing time

- 🏆 **Top Performers**
  - Top 10 sellers by revenue
  - Top 10 sellers by orders
  - Most reviewed sellers

#### API Endpoints:
```
GET /api/admin/analytics (query: period)
GET /api/admin/analytics/revenue
GET /api/admin/analytics/users
GET /api/admin/analytics/listings
```

---

### 6. **Admin Inspectors** (Quản Lý Thanh Tra Viên)
**Route:** `/admin/inspectors`

#### Tính Năng:
- 👨‍⚖️ **Inspectors List**
  - Danh sách tất cả inspectors (role = INSPECTOR)
  - Phân trang
  - Tìm kiếm

- 📊 **Inspector Stats**
  - Total inspections
  - Completed inspections
  - Pending inspections
  - Inspection pass rate
  - Average inspection score
  - Last inspection date

- 📋 **Inspector Details**
  - Full name
  - Email
  - Phone
  - Status (active/inactive)
  - Total inspections done
  - Pass rate %
  - Completed inspections list
  - Rating from system

- 🎯 **Assign Inspection**
  - Assign new inspection task
  - Select order
  - Select inspector
  - Set deadline
  - Add notes

- ⚙️ **Inspector Management**
  - View inspection reports
  - View evidence images
  - View verdicts
  - Manage workload
  - Rate inspector performance

#### API Endpoints:
```
GET /api/admin/inspectors
PUT /api/admin/inspectors/:inspectorId/status
POST /api/admin/inspectors/:inspectorId/assign-inspection
GET /api/admin/inspectors/:inspectorId/inspections
```

---

## 📊 Quy Trình Công Việc (Workflows)

### 1. **Approve New Seller**
```
1. Seller registers (BUYER role)
2. Seller upgrade request
3. Admin xem user info
4. Admin check KYC status
5. Nếu KYC VERIFIED → Approve (change role to SELLER)
6. Nếu KYC PENDING → Xem KYC documents
7. Nếu documents OK → Update KYC status to VERIFIED → Approve seller
8. Nếu documents NOT OK → Update KYC status to REJECTED
```

### 2. **Moderate Listing**
```
1. Seller tạo listing (status = DRAFT hoặc PENDING_APPROVAL)
2. Admin xem danh sách listings
3. Admin filter by PENDING_APPROVAL
4. Admin xem chi tiết listing
5. Nếu OK → Approve (status = PUBLISHED)
6. Nếu NOT OK → Reject (status = REJECTED, add note)
7. Note được gửi cho seller
```

### 3. **Ban User**
```
1. Admin xem user
2. Nếu user có violation → Ban user
3. Click "Ban User" button
4. Update user status to inactive
5. User's listings → DRAFT
6. User không thể login
```

### 4. **Release Payout**
```
1. Order status = COMPLETED
2. Admin xem Admin Orders
3. Filter by COMPLETED & unpaid
4. Click "Release Payout" for seller
5. Transfer seller's commission from escrow
6. Mark as paid
```

### 5. **Manage Inspector**
```
1. User registers as INSPECTOR
2. Admin verify inspector's qualifications
3. Admin assign inspection tasks
4. Inspector completes inspection → Submit report
5. Admin review report
6. Verdict sent to order
7. Order proceeds to SHIPPING or INSPECTION_FAILED
```

---

## 🔐 Permissions

Admin có quyền:
- ✅ Xem tất cả users
- ✅ Ban/Unban users
- ✅ Update KYC status
- ✅ Approve/Reject listings
- ✅ View all orders
- ✅ Release payouts
- ✅ Manage inspectors
- ✅ View system analytics
- ✅ Modify user info

Admin KHÔNG có quyền:
- ❌ Xóa users/listings/orders (chỉ ban/deactivate)
- ❌ Thay đổi order prices
- ❌ Cancel orders trực tiếp
- ❌ Refund buyers (chỉ thông qua inspection failure)

---

## 📱 UI/UX Design

### Layout:
- **Sidebar**: Navigation (Dashboard, Users, Listings, Orders, Analytics, Inspectors)
- **Header**: Admin info, Logout
- **Main Content**: Tables, Charts, Forms

### Components:
- **DataTable**: Danh sách với pagination, filter, search
- **DetailModal**: Chi tiết user/listing/order
- **StatsCard**: Thống kê nhanh
- **Chart**: Revenue, users, orders charts
- **ActionButtons**: Approve, Reject, Ban, Release Payout

### Colors:
- Green (✅ Approve)
- Red (❌ Reject/Ban)
- Orange (⚠️ Pending)
- Blue (ℹ️ Info)

---

## 🛠️ Technical Stack

- **Framework**: React + TypeScript
- **Routing**: React Router
- **UI**: Tailwind CSS
- **Components**: SellerSidebar (reuse, maybe rename to AdminSidebar)
- **State**: useState, useEffect
- **API**: Fetch API with Bearer Token

---

## 📝 Next Steps

1. Create AdminDashboard page
2. Create AdminUsers page
3. Create AdminListings page
4. Create AdminOrders page
5. Create AdminAnalytics page
6. Create AdminInspectors page
7. Create reusable components (DataTable, DetailModal, etc)
8. Create AdminSidebar component
9. Add routes to App.tsx
10. Test all functionality
