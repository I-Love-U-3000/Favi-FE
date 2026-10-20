# 05 — Quản Lý Phiên Bản, Môi Trường & Tiêu Chuẩn Release (Favi-FE)

## 1. Quản Lý Phiên Bản (Git & Code Standards)

### 1.1 Quy Chuẩn Nhánh & Commit
- Tương tự như backend, frontend áp dụng chuẩn **Conventional Commits**:
  - `feat(admin): add audit log data table with date range picker`
  - `fix(chat): scroll to bottom when new realtime message arrives`
  - `refactor(feed): extract feed card into memoized component`
  - `docs(fe): document client-side idempotency wrapper`

### 1.2 Kiểm Tra Chất Lượng Code Trước Khi Commit (Lint & Type Check)
Mọi thay đổi trước khi merge vào nhánh chính bắt buộc phải vượt qua:
```bash
# Kiểm tra lỗi Typescript
npm run build
# hoặc npx tsc --noEmit

# Kiểm tra cú pháp và quy tắc ESLint
npm run lint
```
- Tuyệt đối không sử dụng `any` bừa bãi; luôn khai báo interface hoặc type rõ ràng trong thư mục `src/types/`.

---

## 2. Quản Lý Biến Môi Trường (Environment Variables)

Các biến cấu hình được lưu trong file `.env.local` (phục vụ phát triển local) hoặc set trực tiếp trong môi trường production:

| Tên Biến | Ý Nghĩa | Ví Dụ Giá Trị |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Địa chỉ gốc của NGINX API Gateway | `http://localhost:5000` |
| `NEXT_PUBLIC_WS_URL` | Địa chỉ WebSocket SignalR (nếu tách rời) | `http://localhost:5000` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL kết nối Supabase project | `https://jgounylmgjcmlwyzzzhv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon key của Supabase | `eyJhbGci...` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name tài khoản Cloudinary | `dumyugxhm` |

> **Quy tắc bảo mật**: Chỉ những biến có tiền tố `NEXT_PUBLIC_` mới được phép truy cập trong mã nguồn Client-side. Tuyệt đối không lưu trữ API Secret Keys, Master Keys trong mã nguồn Frontend.

---

## 3. Quy Trình Build & Deploy Production

1. **Tối ưu hóa Bundle**:
   - Sử dụng Dynamic Imports (`React.lazy` hoặc `next/dynamic`) cho các component nặng (ví dụ: Chart đồ thị của Admin, Trình chỉnh sửa ảnh, WebRTC Video Modal).
   - Tối ưu font chữ thông qua `next/font` (Geist / Inter) để loại bỏ hiện tượng giật layout (Cumulative Layout Shift - CLS).

2. **Docker hóa Frontend**:
   Ứng dụng có thể được đóng gói dạng standalone container với `output: 'standalone'` trong `next.config.ts`, giúp dung lượng image dưới 150MB và khởi động cực nhanh.
