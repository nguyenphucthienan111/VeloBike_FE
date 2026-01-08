# VeloBike - Project Roadmap & Strategy

## Trả lời câu hỏi của bạn (Answer to your question)

Bạn hỏi: *"bạn làm BE và FE và react native chung ở đoạn chat này luôn hay phải làm riêng ra vậy?"*

**Trả lời:**
Để đảm bảo chất lượng code tốt nhất và tránh việc vượt quá giới hạn bộ nhớ của một lần phản hồi (response limit), chúng ta nên **làm riêng từng phần (separately)**.

1.  **Bước 1 (Đã xong):** Frontend Web (React + TypeScript).
2.  **Bước 2 (Hiện tại):** **Backend (Node.js/Express + MongoDB)**. Tôi đã tạo thư mục `server/` chứa source code backend.
    *   *Lưu ý:* Code trong folder `server/` cần được chạy trong môi trường Node.js riêng biệt (không chạy chung process với React ở đây).
3.  **Bước 3:** Mobile App (React Native).

---

## Backend Implementation Details (Phase 2)

Source code Backend nằm trong thư mục `/server`. Bao gồm:

1.  **`models/Listing.ts`**: Sử dụng **Mongoose Discriminators** để xử lý đa hình (Polymorphism). Xe Road có `groupset`, xe MTB có `suspensionTravel`.
2.  **`services/OrderService.ts`**: Cài đặt **Finite State Machine (FSM)** để quản lý quy trình kiểm định và thanh toán Escrow. Chặn các chuyển đổi trạng thái không hợp lệ (ví dụ: Không thể ship hàng nếu chưa qua kiểm định).
3.  **Architecture**: Thiết kế theo mô hình Service-Repository layer, sử dụng TypeScript để đảm bảo type safety.

### Hướng dẫn chạy Backend (Local Dev)
1. Copy thư mục `server` ra ngoài.
2. Chạy `npm init -y`.
3. Cài đặt dependencies: `npm install express mongoose dotenv cors helmet`.
4. Cài đặt dev dependencies: `npm install -D typescript @types/node @types/express @types/mongoose`.
5. Cấu hình `tsconfig.json` và chạy `ts-node app.ts`.

---

## Current Release: Frontend Web (MVP)

Phiên bản này bao gồm:
1.  **High-End UI:** Giao diện tối giản, sang trọng phù hợp với xe đạp thể thao cao cấp.
2.  **Marketplace:** Trang danh sách sản phẩm với bộ lọc (Road, MTB, Gravel).
3.  **Product Detail (PDP):** Hiển thị thông số kỹ thuật (Geometry), trạng thái kiểm định (Inspection Status).
4.  **Mock Data:** Dữ liệu mẫu dựa trên báo cáo của bạn (Specialized Tarmac SL7, v.v.).

### Tech Stack
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (Icons)
- Recharts (Data visualization for Geometry/Price history)
