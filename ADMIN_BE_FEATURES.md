# ADMIN BACKEND - Chi Tiết API & Tính Năng

## 📋 Tổng Quan

**Base URL:** `/api/admin`  
**Authentication:** Bearer Token (Admin role required)

---

## 🎯 Các API Endpoints

### 1. **Dashboard** 📊
**GET** `/api/admin/dashboard`

#### Response Data:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalListings": 500,
    "totalOrders": 300,
    "totalRevenue": 50000000,
    "openDisputes": 5
  }
}
```

#### Tính năng:
- Tổng số users (tất cả roles)
- Tổng số listings
- Tổng số orders
- Tổng revenue (platform fees từ completed orders)
- Số disputes đang mở

---

### 2. **Users Management** 👥
**GET** `/api/admin/users`

#### Query Parameters:
- `role` (optional): BUYER, SELLER, INSPECTOR, ADMIN
- `status` (optional): active, inactive
- `page` (optional): số trang (default: 1)
- `limit` (optional): số items/trang (default: 20)

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "email": "user@example.com",
      "fullName": "User Name",
      "phone": "+84123456789",
      "role": "SELLER",
      "kycStatus": "VERIFIED",
      "isActive": true,
      "emailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "wallet": { "balance": 1000000, "currency": "VND" },
      "reputation": { "score": 4.5, "reviewCount": 10 }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

#### Tính năng:
- Lấy danh sách tất cả users
- Filter theo role (BUYER, SELLER, INSPECTOR, ADMIN)
- Filter theo status (active/inactive)
- Phân trang
- Sort theo createdAt (mới nhất trước)

---

**PUT** `/api/admin/users/:userId/kyc`

#### Request Body:
```json
{
  "kycStatus": "VERIFIED" // PENDING, VERIFIED, REJECTED
}
```

#### Response:
```json
{
  "success": true,
  "message": "KYC status updated",
  "data": { /* updated user */ }
}
```

#### Tính năng:
- Cập nhật KYC status của user
- Tự động set `kycData.verifiedAt` = current date
- Chỉ cho phép: PENDING, VERIFIED, REJECTED

---

**PUT** `/api/admin/users/:userId/status`

#### Request Body:
```json
{
  "isActive": false // true = activate, false = ban/deactivate
}
```

#### Response:
```json
{
  "success": true,
  "message": "User deactivated",
  "data": { /* updated user */ }
}
```

#### Tính năng:
- Ban/Unban user
- `isActive: false` → User không thể login
- `isActive: true` → User có thể login

---

### 3. **Listings Management** 📝
**GET** `/api/admin/listings`

#### Query Parameters:
- `status` (optional): DRAFT, PUBLISHED, IN_INSPECTION, SOLD, PENDING_APPROVAL
- `page` (optional): số trang
- `limit` (optional): số items/trang

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Bike Title",
      "description": "...",
      "amount": 10000000,
      "status": "PENDING_APPROVAL",
      "sellerId": {
        "_id": "...",
        "fullName": "Seller Name",
        "email": "seller@example.com",
        "reputation": { "score": 4.5 }
      },
      "brand": "Yamaha",
      "model": "YZF-R1",
      "year": 2023,
      "createdAt": "2024-01-01T00:00:00.000Z",
      // Nếu status = PENDING_APPROVAL, có thêm:
      "priorityLevel": 3,
      "approvalTimeHours": 24,
      "sellerPlanType": "PREMIUM"
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Tính năng đặc biệt:
- **Nếu filter `status=PENDING_APPROVAL`:**
  - Tự động sort theo subscription priority (Premium > Standard > Free)
  - Hiển thị `priorityLevel`, `approvalTimeHours`, `sellerPlanType`
  - Sort: Priority cao nhất trước, sau đó theo createdAt (cũ nhất trước)

---

**PUT** `/api/admin/listings/:listingId/status`

#### Request Body:
```json
{
  "status": "PUBLISHED", // hoặc "REJECTED"
  "rejectionReason": "Lý do từ chối (nếu REJECTED)"
}
```

#### Response:
```json
{
  "success": true,
  "message": "Listing approved and published per SRS BikeMarket workflow",
  "data": { /* updated listing */ }
}
```

#### Tính năng:
- **Approve listing:** `status = PUBLISHED`
- **Reject listing:** `status = REJECTED` + `rejectionReason`
- Chỉ cho phép: PUBLISHED hoặc REJECTED
- Tự động populate seller info
- TODO: Gửi notification cho seller

---

### 4. **Orders Management** 📋
**GET** `/api/admin/orders`

#### Query Parameters:
- `status` (optional): CREATED, ESCROW_LOCKED, IN_INSPECTION, INSPECTION_PASSED, SHIPPING, DELIVERED, COMPLETED
- `page` (optional): số trang
- `limit` (optional): số items/trang

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "buyerId": {
        "_id": "...",
        "fullName": "Buyer Name",
        "email": "buyer@example.com"
      },
      "sellerId": {
        "_id": "...",
        "fullName": "Seller Name",
        "email": "seller@example.com"
      },
      "listingId": {
        "_id": "...",
        "title": "Bike Title"
      },
      "status": "DELIVERED",
      "amount": 10000000,
      "financials": {
        "platformFee": 1000000,
        "sellerAmount": 9000000
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Tính năng:
- Lấy danh sách tất cả orders
- Populate buyer, seller, listing info
- Filter theo status
- Phân trang
- Sort theo createdAt (mới nhất trước)

---

**PUT** `/api/admin/orders/:id/payout`

#### Response:
```json
{
  "success": true,
  "message": "Payout released and order completed"
}
```

#### Tính năng:
- **Release payout cho seller**
- Chỉ hoạt động khi `order.status = DELIVERED`
- Tự động:
  - Complete order (status → COMPLETED)
  - Cập nhật wallet cho seller
  - Phân chia tiền: seller, inspector, platform
- Nếu order không ở status DELIVERED → Error 400

---

### 5. **Analytics** 📈
**GET** `/api/admin/analytics`

#### Query Parameters:
- `period` (optional): day, week, month, year (default: month)

#### Response:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "orders": 50,
    "revenue": 5000000,
    "newSellers": 10,
    "reviews": 30
  }
}
```

#### Tính năng:
- **Orders:** Số orders trong period
- **Revenue:** Tổng platform fees trong period
- **New Sellers:** Số sellers mới đăng ký trong period
- **Reviews:** Số reviews trong period
- Period filter: day (1 ngày), week (7 ngày), month (30 ngày), year (365 ngày)

---

### 6. **Settings** ⚙️
**GET** `/api/admin/settings`

#### Response:
```json
{
  "success": true,
  "data": {
    "platformFeePercentage": 10,
    "inspectionFee": 500000,
    "shippingFee": 150000,
    "minimumBikePrice": 500000,
    "maximumBikePrice": 500000000
  }
}
```

#### Tính năng:
- Lấy platform settings
- TODO: Lưu vào database (hiện tại hardcode)

---

**PUT** `/api/admin/settings`

#### Request Body:
```json
{
  "platformFeePercentage": 10,
  "inspectionFee": 500000,
  "shippingFee": 150000,
  "minimumBikePrice": 500000,
  "maximumBikePrice": 500000000
}
```

#### Response:
```json
{
  "success": true,
  "message": "Settings updated",
  "data": { /* updated settings */ }
}
```

#### Tính năng:
- Cập nhật platform settings
- TODO: Lưu vào database

---

### 7. **Categories Management** 📂
**GET** `/api/admin/categories`
**POST** `/api/admin/categories`
**PUT** `/api/admin/categories/:id`
**DELETE** `/api/admin/categories/:id`

#### Tính năng:
- CRUD operations cho categories
- Quản lý danh mục sản phẩm

---

### 8. **Brands Management** 🏷️
**GET** `/api/admin/brands`
**POST** `/api/admin/brands`
**PUT** `/api/admin/brands/:id`
**DELETE** `/api/admin/brands/:id`

#### Tính năng:
- CRUD operations cho brands
- Quản lý thương hiệu xe

---

### 9. **Inspectors Management** 👨‍⚖️
**GET** `/api/admin/inspectors`

#### Query Parameters:
- `isActive` (optional): true, false
- `page` (optional): số trang
- `limit` (optional): số items/trang

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "email": "inspector@example.com",
      "fullName": "Inspector Name",
      "role": "INSPECTOR",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Tính năng:
- Lấy danh sách tất cả inspectors (role = INSPECTOR)
- Filter theo isActive
- Phân trang
- Sort theo createdAt (mới nhất trước)

---

## 🔐 Authentication & Authorization

Tất cả endpoints yêu cầu:
- **Bearer Token** trong header: `Authorization: Bearer <token>`
- **Admin Role** (một số endpoints có `protect, authorize(UserRole.ADMIN)`)

---

## 📊 Data Models

### User Model:
```typescript
{
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: "BUYER" | "SELLER" | "INSPECTOR" | "ADMIN";
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isActive: boolean;
  emailVerified: boolean;
  wallet: { balance: number; currency: string };
  reputation: { score: number; reviewCount: number };
  createdAt: Date;
}
```

### Listing Model:
```typescript
{
  id: string;
  title: string;
  description: string;
  amount: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "SOLD" | "REJECTED";
  sellerId: User;
  brand: string;
  model: string;
  year: number;
  createdAt: Date;
}
```

### Order Model:
```typescript
{
  id: string;
  buyerId: User;
  sellerId: User;
  listingId: Listing;
  status: "CREATED" | "ESCROW_LOCKED" | "IN_INSPECTION" | "INSPECTION_PASSED" | "SHIPPING" | "DELIVERED" | "COMPLETED";
  amount: number;
  financials: {
    platformFee: number;
    sellerAmount: number;
  };
  createdAt: Date;
}
```

---

## 🎯 Workflows

### 1. **Approve Listing:**
```
1. GET /api/admin/listings?status=PENDING_APPROVAL
2. Xem danh sách listings chờ duyệt (sort theo priority)
3. Xem chi tiết listing
4. PUT /api/admin/listings/:listingId/status
   { "status": "PUBLISHED" }
5. Listing được publish, seller nhận notification
```

### 2. **Reject Listing:**
```
1. GET /api/admin/listings?status=PENDING_APPROVAL
2. Xem chi tiết listing
3. PUT /api/admin/listings/:listingId/status
   { "status": "REJECTED", "rejectionReason": "Lý do..." }
4. Listing bị reject, seller nhận notification với lý do
```

### 3. **Ban User:**
```
1. GET /api/admin/users?role=SELLER
2. Xem danh sách sellers
3. Xem chi tiết user
4. PUT /api/admin/users/:userId/status
   { "isActive": false }
5. User bị ban, không thể login
```

### 4. **Verify KYC:**
```
1. GET /api/admin/users?role=SELLER
2. Xem user có KYC PENDING
3. Xem KYC documents (từ user.kycData)
4. PUT /api/admin/users/:userId/kyc
   { "kycStatus": "VERIFIED" }
5. User được verify, có thể upgrade lên SELLER
```

### 5. **Release Payout:**
```
1. GET /api/admin/orders?status=DELIVERED
2. Xem danh sách orders đã delivered
3. Xem chi tiết order
4. PUT /api/admin/orders/:id/payout
5. Payout được release, order → COMPLETED
```

---

## 📝 Notes

1. **Pagination:** Tất cả list endpoints hỗ trợ pagination với `page` và `limit`
2. **Sorting:** Mặc định sort theo `createdAt: -1` (mới nhất trước)
3. **Filtering:** Hầu hết endpoints hỗ trợ filter theo status, role, etc.
4. **Populate:** Orders và Listings tự động populate buyer/seller info
5. **Priority Sorting:** Listings với status PENDING_APPROVAL được sort theo subscription priority
6. **TODO Items:**
   - Settings model trong database
   - Notification system cho sellers
   - Inspector assignment API
   - Inspector inspection history API

---

## 🚀 Next Steps for Frontend

1. **AdminDashboard** - Hiển thị stats từ `/api/admin/dashboard`
2. **AdminUsers** - Table với filter, search, actions (ban, verify KYC)
3. **AdminListings** - Table với filter, approve/reject actions
4. **AdminOrders** - Table với filter, release payout action
5. **AdminAnalytics** - Charts từ `/api/admin/analytics`
6. **AdminInspectors** - Table với inspector stats
7. **AdminSettings** - Form để update settings
8. **AdminCategories** - CRUD cho categories
9. **AdminBrands** - CRUD cho brands
