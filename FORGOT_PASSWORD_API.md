# 🔐 Forgot Password API - Chi tiết Cần Làm

## 📌 Tóm tắt

Để implement chức năng Forgot Password, Frontend cần gọi **2 API** theo trình tự sau:

---

## 🔗 API #1: Gửi OTP để Reset Password

### **Request**
```
POST /api/auth/forgot-password
Content-Type: application/json

Body: {
  "email": "user@example.com"
}
```

### **Response (Success 200)**
```json
{
  "success": true,
  "message": "Reset OTP sent to email"
}
```

### **Response (Error)**

| Status | Message | Giải thích |
|--------|---------|-----------|
| 400 | "Email required" | Bỏ trống email |
| 404 | "User not found" | Email không tồn tại trong hệ thống |
| 500 | Error message | Lỗi server |

### **Điều cần làm ở Frontend:**
1. ✅ Validate email format
2. ✅ Gửi POST request tới `/api/auth/forgot-password`
3. ✅ Nếu thành công → Chuyển sang nhập OTP
4. ✅ Nếu lỗi → Hiển thị error message
5. ✅ Gửi OTP (6 chữ số) qua email của user

---

## 🔗 API #2: Reset Password bằng OTP

### **Request**
```
POST /api/auth/reset-password
Content-Type: application/json

Body: {
  "email": "user@example.com",
  "code": "123456",        // OTP 6 chữ số
  "newPassword": "Abc@1234"  // Password mới phải mạnh
}
```

### **Response (Success 200)**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### **Response (Error)**

| Status | Message | Giải thích |
|--------|---------|-----------|
| 400 | "Missing fields" | Bỏ trống email/code/newPassword |
| 400 | "Invalid or expired OTP" | OTP sai hoặc hết hạn (15 phút) |
| 404 | "User not found" | Email không tồn tại |
| 500 | Error message | Lỗi server |

### **Điều cần làm ở Frontend:**
1. ✅ Validate OTP (phải 6 chữ số)
2. ✅ Validate password mạnh (đã implement rồi)
3. ✅ Gửi POST request tới `/api/auth/reset-password`
4. ✅ Nếu thành công → Redirect tới `/login`
5. ✅ Nếu lỗi → Hiển thị error message
6. ✅ Sau reset thành công → Xóa OTP khỏi DB (Backend tự làm)

---

## 🔐 Password Requirements

Backend **KHÔNG validate** password requirements, nhưng **Frontend PHẢI validate**:

✅ **Ít nhất 8 ký tự**
✅ **Ít nhất 1 chữ hoa (A-Z)**
✅ **Ít nhất 1 chữ thường (a-z)**
✅ **Ít nhất 1 số (0-9)**
✅ **Ít nhất 1 ký tự đặc biệt (@$!%*?&)**

### Ví dụ valid password:
- ✅ `Test@1234`
- ✅ `MyPass#2025`
- ✅ `Secure$Pwd1`

### Ví dụ invalid password:
- ❌ `password` (không có số, hoa, ký tự đặc biệt)
- ❌ `Pass123` (không có ký tự đặc biệt)
- ❌ `P@ss` (ít hơn 8 ký tự)

---

## ⏱️ Thời gian hết hạn OTP

- **OTP hết hạn sau: 15 phút**
- Sau 15 phút, user phải click "Resend" để nhận OTP mới

---

## 🎯 Frontend Implementation Checklist

### ✅ Đã implement:
- [x] Tạo component ForgotPassword.tsx
- [x] 3 bước: Email → OTP → Password
- [x] Validate email format
- [x] Validate OTP (6 chữ số)
- [x] Validate password mạnh
- [x] Back button giữa các bước
- [x] Progress bar
- [x] Success/Error alerts
- [x] Loading states
- [x] API endpoints trong constants.ts

### ⚠️ Cần kiểm tra:
1. API_BASE_URL trong constants.ts
   ```typescript
   export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   ```

2. Đảm bảo Backend URL là **`http://localhost:5000`** (không phải `5001`)

3. Kiểm tra EmailService ở Backend gửi email đúng không?
   - Email phải chứa OTP code
   - Email phải có chủ đề rõ ràng

---

## 🧪 Test Flow

### **Test Case 1: Email không tồn tại**
1. Click "Forgot?" ở Login page
2. Nhập email `notexist@example.com`
3. Click "Send OTP"
4. **Kỳ vọng:** Error "User not found"

### **Test Case 2: Email hợp lệ**
1. Nhập email `test@example.com` (phải đã register)
2. Click "Send OTP"
3. **Kỳ vọng:** Success "OTP sent to email"
4. Nhận OTP từ email
5. Nhập OTP (vd: `123456`)
6. Click "Verify OTP"
7. **Kỳ vọng:** Chuyển sang bước đặt password

### **Test Case 3: OTP sai**
1. Nhập OTP sai (vd: `000000`)
2. Click "Verify OTP"
3. **Kỳ vọng:** Success, nhưng ở bước tiếp theo sẽ bị lỗi "Invalid OTP"

### **Test Case 4: Password mạnh**
1. Nhập password `Test@1234`
2. Xác nhận password
3. Click "Reset Password"
4. **Kỳ vọng:** Success "Password reset successfully"
5. Redirect về Login page
6. Login với email + password mới

### **Test Case 5: Password yếu**
1. Nhập password `password`
2. Click "Reset Password"
3. **Kỳ vọng:** Error "Password must contain at least one uppercase letter"

---

## 📧 Email Content (Backend gửi)

### **Email Structure:**
```
Subject: VeloBike - Đặt lại mật khẩu của bạn

Body:
Xin chào [User Full Name],

Bạn đã yêu cầu đặt lại mật khẩu của mình.
Mã OTP của bạn là: [6-DIGIT CODE]

Mã này sẽ hết hạn trong 15 phút.

Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.

Đội ngũ VeloBike
```

---

## 🔄 Request/Response Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Click "Forgot?"
       ▼
┌─────────────────────────────┐
│ ForgotPassword Page         │
│ - Email Input               │
└──────┬──────────────────────┘
       │
       │ 2. POST /api/auth/forgot-password
       │    { email }
       ▼
┌─────────────────────────────┐
│ Backend - AuthController    │
│ - Check user exists         │
│ - Generate OTP              │
│ - Save OTP to DB            │
│ - Send email                │
└──────┬──────────────────────┘
       │
       │ 3. Response: { success, message }
       ▼
┌─────────────────────────────┐
│ Frontend                    │
│ - Show success alert        │
│ - Move to OTP step          │
└──────┬──────────────────────┘
       │
       │ 4. User enters OTP from email
       ▼
┌─────────────────────────────┐
│ ForgotPassword Page         │
│ - OTP Input                 │
└──────┬──────────────────────┘
       │
       │ 5. POST /api/auth/reset-password
       │    { email, code, newPassword }
       ▼
┌─────────────────────────────┐
│ Backend - AuthController    │
│ - Verify OTP in DB          │
│ - Check expiration          │
│ - Hash new password         │
│ - Update user               │
│ - Delete OTP from DB        │
└──────┬──────────────────────┘
       │
       │ 6. Response: { success, message }
       ▼
┌─────────────────────────────┐
│ Frontend                    │
│ - Show success alert        │
│ - Redirect to Login         │
└─────────────────────────────┘
```

---

## ❌ Common Issues & Solutions

### **Issue 1: "Email required" error**
**Nguyên nhân:** Email trống
**Giải pháp:** Validate input trước khi gửi request

### **Issue 2: "User not found"**
**Nguyên nhân:** Email chưa register hoặc sai
**Giải pháp:** Kiểm tra lại email, hoặc đăng ký tài khoản mới

### **Issue 3: "Invalid or expired OTP"**
**Nguyên nhân:** OTP sai hoặc hết hạn (>15 phút)
**Giải pháp:** 
- Click "Resend" để nhận OTP mới
- Nhập lại OTP từ email mới

### **Issue 4: Không nhận được email**
**Nguyên nhân:** 
- Email service backend chưa setup
- Email đi vào spam folder
- Domain email chưa whitelist
**Giải pháp:** 
- Check email spam folder
- Contact admin để setup email service

### **Issue 5: API_BASE_URL sai**
**Nguyên nhân:** Sai port backend
**Giải pháp:** 
```typescript
// ❌ Sai
export const API_BASE_URL = 'http://localhost:5001/api';

// ✅ Đúng
export const API_BASE_URL = 'http://localhost:5000/api';
```

---

## 🚀 Để chạy thử:

1. **Chắc chắn Backend đang chạy:**
   ```bash
   cd /Users/phamtrungkien/Documents/WDP/VeloBike_BE
   npm run dev
   ```

2. **Chạy Frontend:**
   ```bash
   cd /Users/phamtrungkien/Documents/WDP/VeloBike_FE
   npm run dev
   ```

3. **Test:**
   - Truy cập http://localhost:3000
   - Go to Login page
   - Click "Forgot?" link
   - Nhập email của user đã register
   - Check email để lấy OTP
   - Nhập OTP và password mới
   - Verify success

---

## 📝 Ghi chú

- ✅ Frontend đã sẵn sàng (ForgotPassword.tsx)
- ⚠️ Backend API đã có, cần verify Email service gửi email đúng
- ⚠️ Cần test thực tế với email thật
- ⚠️ Cần setup Email Service (Gmail, SendGrid, etc.)

---

**Status:** Ready to test
**Last Updated:** 2026-01-29
