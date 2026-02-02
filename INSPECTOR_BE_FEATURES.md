# INSPECTOR BACKEND - Chi Tiết API & Tính Năng

## 📋 Tổng Quan

**Role:** INSPECTOR  
**Mục đích:** Kiểm định chất lượng xe đạp cho các đơn hàng  
**Base URL:** `/api/inspections` và `/api/dashboard/inspector`  
**Authentication:** Bearer Token (Inspector role required)

---

## 🎯 Các API Endpoints

### 1. **Dashboard Statistics** 📊
**GET** `/api/dashboard/inspector/stats`

#### Response Data:
```json
{
  "success": true,
  "data": {
    "totalInspections": 50,
    "pendingInspections": 5,
    "completedInspections": 45,
    "passRate": 85.5,
    "averageScore": 7.8
  }
}
```

#### Tính năng:
- Tổng số inspections đã làm
- Số inspections đang pending
- Số inspections đã hoàn thành
- Tỷ lệ pass (PASSED / total)
- Điểm trung bình

---

**GET** `/api/dashboard/inspector/earnings`

#### Response Data:
```json
{
  "success": true,
  "data": {
    "totalEarnings": 5000000,
    "pendingEarnings": 500000,
    "completedEarnings": 4500000,
    "currency": "VND"
  }
}
```

#### Tính năng:
- Tổng thu nhập từ inspections
- Thu nhập đang pending
- Thu nhập đã nhận
- Currency (VND)

---

### 2. **Pending Inspections** ⏳
**GET** `/api/inspections/pending`

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "orderId": "...",
      "order": {
        "id": "...",
        "status": "IN_INSPECTION",
        "amount": 10000000,
        "listingId": {
          "title": "Bike Title",
          "brand": "Yamaha",
          "model": "YZF-R1",
          "type": "ROAD"
        },
        "buyerId": {
          "fullName": "Buyer Name",
          "email": "buyer@example.com"
        },
        "sellerId": {
          "fullName": "Seller Name",
          "email": "seller@example.com"
        }
      },
      "assignedAt": "2024-01-01T00:00:00.000Z",
      "deadline": "2024-01-03T00:00:00.000Z"
    }
  ]
}
```

#### Tính năng:
- Lấy danh sách inspections đang pending (chưa submit report)
- Hiển thị order info, listing info, buyer/seller info
- Deadline để hoàn thành inspection

---

### 3. **My Inspections (Completed)** ✅
**GET** `/api/inspections/my-inspections`

#### Query Parameters:
- `page` (optional): số trang
- `limit` (optional): số items/trang

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "orderId": "...",
      "overallVerdict": "PASSED",
      "overallScore": 8.5,
      "grade": "A",
      "checkpoints": [
        {
          "component": "Frame - Overall Condition",
          "status": "PASS",
          "observation": "Khung xe tốt"
        }
      ],
      "submittedAt": "2024-01-01T00:00:00.000Z",
      "order": {
        "status": "INSPECTION_PASSED",
        "listingId": {
          "title": "Bike Title"
        }
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### Tính năng:
- Lấy danh sách inspections đã hoàn thành
- Hiển thị verdict, score, grade
- Phân trang

---

### 4. **Get Inspection Checklist** 📋
**GET** `/api/inspections/checklist/:bikeType`

#### Path Parameters:
- `bikeType`: ROAD, MTB, GRAVEL, TRIATHLON

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "component": "Frame - Overall Condition",
      "category": "FRAME",
      "required": true,
      "description": "Kiểm tra tổng thể khung xe"
    },
    {
      "component": "Front Brake",
      "category": "BRAKES",
      "required": true,
      "description": "Kiểm tra phanh trước"
    }
  ]
}
```

#### Tính năng:
- Lấy checklist động dựa trên loại xe
- Mỗi loại xe có checklist khác nhau
- Categories: FRAME, BRAKES, DRIVETRAIN, WHEELS, etc.

---

**GET** `/api/inspections/checklist/order/:orderId`

#### Tính năng:
- Lấy checklist dựa trên order's listing bike type
- Tự động detect bike type từ order

---

### 5. **Get Inspection Report** 📄
**GET** `/api/inspections/:orderId`

#### Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderId": "...",
    "inspectorId": "...",
    "overallVerdict": "PASSED",
    "overallScore": 8.5,
    "grade": "A",
    "checkpoints": [
      {
        "component": "Frame - Overall Condition",
        "status": "PASS",
        "observation": "Khung xe tốt, không có vết nứt",
        "severity": null,
        "evidenceImages": []
      },
      {
        "component": "Front Brake",
        "status": "WARN",
        "severity": "LOW",
        "observation": "Má phanh còn 40%, nên thay trong 1 tháng",
        "evidenceImages": ["url1", "url2"]
      },
      {
        "component": "Chain",
        "status": "FAIL",
        "severity": "MEDIUM",
        "observation": "Xích đã kéo dài 0.75%, cần thay ngay",
        "evidenceImages": ["url3"]
      }
    ],
    "inspectorNote": "Xe tổng thể tốt nhưng cần thay xích và má phanh trước khi giao",
    "submittedAt": "2024-01-01T00:00:00.000Z",
    "order": {
      "status": "INSPECTION_PASSED",
      "listingId": {
        "title": "Bike Title"
      }
    }
  }
}
```

#### Tính năng:
- Xem chi tiết inspection report cho một order
- Hiển thị tất cả checkpoints, verdict, score, grade
- Evidence images

---

### 6. **Submit Inspection Report** ✍️
**POST** `/api/inspections`

#### Request Body:
```json
{
  "orderId": "696cba63ad1e5d95a2bcde45",
  "checkpoints": [
    {
      "component": "Frame - Overall Condition",
      "status": "PASS",
      "observation": "Khung xe tốt, không có vết nứt"
    },
    {
      "component": "Front Brake",
      "status": "WARN",
      "severity": "LOW",
      "observation": "Má phanh còn 40%, nên thay trong 1 tháng",
      "evidenceImages": ["url1", "url2"]
    },
    {
      "component": "Chain",
      "status": "FAIL",
      "severity": "MEDIUM",
      "observation": "Xích đã kéo dài 0.75%, cần thay ngay",
      "evidenceImages": ["url3"]
    }
  ],
  "overallVerdict": "SUGGEST_ADJUSTMENT",
  "overallScore": 7.5,
  "inspectorNote": "Xe tổng thể tốt nhưng cần thay xích và má phanh trước khi giao"
}
```

#### Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderId": "...",
    "overallVerdict": "SUGGEST_ADJUSTMENT",
    "overallScore": 7.5,
    "grade": "B"
  },
  "orderStatus": "INSPECTION_PASSED",
  "message": "Inspection submitted successfully"
}
```

#### Tính năng:
- **Submit inspection report** cho một order
- **Checkpoints:**
  - `component`: Tên bộ phận (required)
  - `status`: PASS, FAIL, WARN (required)
  - `observation`: Ghi chú chi tiết (optional)
  - `severity`: LOW, MEDIUM, CRITICAL (required nếu status = FAIL hoặc WARN)
  - `evidenceImages`: Array of image URLs (optional)
- **Overall Verdict:** PASSED, FAILED, SUGGEST_ADJUSTMENT (optional, tự tính nếu không có)
- **Overall Score:** 1-10 (optional, tự tính nếu không có)
- **Inspector Note:** Ghi chú tổng quan (optional)

#### Auto Calculation:
- Nếu không có `overallVerdict` hoặc `overallScore`, hệ thống tự tính:
  - Score dựa trên checkpoints (weighted average)
  - Verdict dựa trên score:
    - Score >= 6.5 → PASSED
    - Score < 4.0 → FAILED
    - 4.0 <= Score < 6.5 → SUGGEST_ADJUSTMENT
- Grade: A (8.5-10), B (6.5-8.4), C (4.0-6.4), D (1.0-3.9)

#### Order Status Update:
- PASSED → Order status → `INSPECTION_PASSED` → Tiếp tục shipping
- FAILED → Order status → `INSPECTION_FAILED` → Refund buyer
- SUGGEST_ADJUSTMENT → Order status → `INSPECTION_PASSED` → Tiếp tục nhưng có ghi chú

---

## 📊 Scoring System

### Condition Score Calculation:
- **PASS:** 10 points
- **WARN:** 6 points (weight 1.5x)
- **FAIL:**
  - LOW severity: 4 points (weight 1.5x)
  - MEDIUM severity: 2 points (weight 2x)
  - CRITICAL severity: 0 points (weight 3x)

### Grade Mapping:
- **A (8.5-10):** Excellent - Không lỗi + Ngoại hình xước < 5%
- **B (6.5-8.4):** Good - Có lỗi hao mòn nhẹ nhưng khung sườn tốt
- **C (4.0-6.4):** Fair - Cần bảo dưỡng lớn
- **D (1.0-3.9):** Poor - Không đạt chuẩn an toàn

---

## 🎯 Workflows

### 1. **Complete Inspection:**
```
1. GET /api/inspections/pending
   → Xem danh sách inspections đang pending
2. Chọn một inspection
3. GET /api/inspections/checklist/order/:orderId
   → Lấy checklist cho bike type
4. Điền inspection form:
   - Check từng component
   - Status: PASS/WARN/FAIL
   - Observation (ghi chú)
   - Severity (nếu WARN/FAIL)
   - Upload evidence images (nếu có)
5. POST /api/inspections
   → Submit report
6. Hệ thống tự động:
   - Tính overallScore và overallVerdict
   - Update order status
   - Gửi notification cho buyer/seller
```

### 2. **View Inspection History:**
```
1. GET /api/inspections/my-inspections
   → Xem danh sách inspections đã hoàn thành
2. Click vào một inspection
3. GET /api/inspections/:orderId
   → Xem chi tiết report
```

### 3. **View Dashboard:**
```
1. GET /api/dashboard/inspector/stats
   → Xem statistics (total, pending, completed, pass rate, avg score)
2. GET /api/dashboard/inspector/earnings
   → Xem earnings (total, pending, completed)
```

---

## 📱 Frontend Pages Needed

### 1. **Inspector Dashboard** (`/inspector/dashboard`)
- Stats cards: Total, Pending, Completed, Pass Rate, Avg Score
- Earnings: Total, Pending, Completed
- Recent inspections
- Quick actions

### 2. **Pending Inspections** (`/inspector/pending`)
- List of pending inspections
- Order info, listing info, buyer/seller info
- Deadline countdown
- "Start Inspection" button → Navigate to inspection form

### 3. **Inspection Form** (`/inspector/inspect/:orderId`)
- Dynamic checklist based on bike type
- Form for each checkpoint:
  - Status selector (PASS/WARN/FAIL)
  - Observation textarea
  - Severity selector (if WARN/FAIL)
  - Image upload for evidence
- Overall verdict selector (optional)
- Overall score input (optional)
- Inspector note textarea
- Submit button

### 4. **My Inspections** (`/inspector/history`)
- List of completed inspections
- Filter by verdict (PASSED/FAILED/SUGGEST_ADJUSTMENT)
- Search by order ID
- Pagination
- Click to view details

### 5. **Inspection Detail** (`/inspector/inspection/:orderId`)
- Full inspection report
- All checkpoints with status, observation, evidence images
- Overall verdict, score, grade
- Inspector note
- Order info
- Timeline

### 6. **Inspector Profile** (`/inspector/profile`)
- Personal info
- Statistics
- Earnings history
- Settings

---

## 🔐 Authentication & Authorization

Tất cả endpoints yêu cầu:
- **Bearer Token** trong header: `Authorization: Bearer <token>`
- **Inspector Role** (`authorize(UserRole.INSPECTOR)`)

---

## 📝 Notes

1. **Checklist:** Dynamic dựa trên bike type (ROAD, MTB, GRAVEL, TRIATHLON)
2. **Scoring:** Tự động tính nếu không có overallScore/overallVerdict
3. **Order Status:** Tự động update sau khi submit inspection
4. **Evidence Images:** Upload trước, sau đó gửi URLs trong request
5. **Deadline:** Có deadline cho mỗi inspection (từ order)
6. **Earnings:** Inspector nhận tiền khi order completed (từ platform fee)

---

## 🚀 Next Steps for Frontend

1. **InspectorSidebar** - Navigation component
2. **InspectorDashboard** - Stats và earnings
3. **PendingInspections** - List pending inspections
4. **InspectionForm** - Dynamic form với checklist
5. **MyInspections** - History với pagination
6. **InspectionDetail** - View full report
7. **InspectorProfile** - Profile management
8. **Image Upload** - Component để upload evidence images

---

## 📊 Data Models

### Inspection Model:
```typescript
{
  id: string;
  orderId: string;
  inspectorId: string;
  checkpoints: Array<{
    component: string;
    status: "PASS" | "FAIL" | "WARN";
    observation?: string;
    severity?: "LOW" | "MEDIUM" | "CRITICAL";
    evidenceImages?: string[];
  }>;
  overallVerdict: "PASSED" | "FAILED" | "SUGGEST_ADJUSTMENT";
  overallScore: number; // 1-10
  grade: "A" | "B" | "C" | "D";
  inspectorNote?: string;
  submittedAt: Date;
}
```

### Order Model (for Inspector):
```typescript
{
  id: string;
  status: "IN_INSPECTION" | "INSPECTION_PASSED" | "INSPECTION_FAILED";
  listingId: {
    id: string;
    title: string;
    brand: string;
    model: string;
    type: "ROAD" | "MTB" | "GRAVEL" | "TRIATHLON";
  };
  buyerId: {
    fullName: string;
    email: string;
  };
  sellerId: {
    fullName: string;
    email: string;
  };
  amount: number;
  assignedInspectorId?: string;
  inspectionDeadline?: Date;
}
```
