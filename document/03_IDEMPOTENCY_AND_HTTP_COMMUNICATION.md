# 03 — Idempotency Phía Client, Xác Thực & Chuẩn Hóa HTTP (Favi-FE)

## 1. Cơ Chế Tự Động Gắn `Idempotency-Key`

Một trong những điểm quan trọng nhất của Favi-FE là **tự động đảm bảo tính Idempotent cho tất cả các HTTP request làm thay đổi dữ liệu**. 
Logic này được đóng gói tập trung duy nhất tại `src/lib/fetchWrapper.ts`.

### 1.1 Nguyên Lý Hoạt Động
Mỗi khi lập trình viên hoặc component gọi các phương thức mutating:
```typescript
fetchWrapper.post(url, body)
fetchWrapper.put(url, body)
fetchWrapper.patch(url, body)
fetchWrapper.del(url, body)
```

`fetchWrapper` sẽ thực hiện kiểm tra và tự động sinh header:
```typescript
const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
const idempotencyKey = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const headers: Record<string, string> = {
  ...(auth ? getAuthHeaders() : {}),
  ...(isFormData ? {} : { "Content-Type": "application/json" }),
  ...(isMutating ? { "Idempotency-Key": idempotencyKey } : {}),
};
```

### 1.2 Lợi Ích Của Thiết Kế Này
- **Lập trình viên không cần nhớ truyền key**: Mọi form submit, reaction click, comment post đều tự động được bảo vệ chống double-click và network retry.
- **Tương thích hoàn hảo với Backend**: Backend `IdempotencyMiddleware` yêu cầu header `Idempotency-Key` cho mọi request thay đổi dữ liệu dưới `/api/`; việc tự động hóa tại `fetchWrapper` giúp không bao giờ bị dính lỗi `400 MISSING_IDEMPOTENCY_KEY`.

---

## 2. Vòng Đời Xác Thực JWT & Tự Động Làm Mới Token (Auto Refresh)

Hệ thống sử dụng cơ chế **JWT Access Token + Refresh Token**:
- `access_token`: Có hạn ngắn (60 phút), gửi trong header `Authorization: Bearer <token>`.
- `refresh_token`: Có hạn dài (7 ngày), dùng để xin cấp access token mới khi token cũ hết hạn.

```
[ Request Gửi Đi ] ──▶ Backend trả về 401 Unauthorized (Token hết hạn)
                               │
                               ▼
               [ tryRefreshAndRetry Interceptor ]
                               │
                Lấy refresh_token từ localStorage
                               │
                               ▼
               Gọi POST /auth/refresh (Body: refresh_token)
                               │
              ┌────────────────┴────────────────┐
              │ (Thành công)                    │ (Thất bại / Hết hạn)
              ▼                                 ▼
       Lưu access_token mới               Xóa sạch localStorage
       Lưu refresh_token mới              Bắn event 'auth-token-expired'
       Tự động gửi lại request cũ         Chuyển hướng về trang /login
       và trả kết quả cho caller          Hiển thị thông báo "Phiên đăng nhập hết hạn"
```

### Mã nguồn xử lý tại `fetchWrapper.ts`:
```typescript
if (res.status === 401 && auth) {
  try {
    return await tryRefreshAndRetry<T>(url, init);
  } catch (err: unknown) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.dispatchEvent(new Event("auth-token-expired"));
    }
    throw err;
  }
}
```

---

## 3. Tự Động Chuẩn Hóa Casing (PascalCase ↔ camelCase)

### 3.1 Vấn Đề Khác Biệt Nền Tảng
- Backend C# / .NET tuân thủ chuẩn `PascalCase` (`CreatedAt`, `UserProfile`, `LikeCount`).
- Frontend TypeScript / React tuân thủ chuẩn `camelCase` (`createdAt`, `userProfile`, `likeCount`).

### 3.2 Giải Pháp Tự Động Hóa Trong `handleResponse`
`fetchWrapper` tích hợp sẵn hàm đệ quy chuyển đổi toàn bộ keys của object và array nhận từ backend về `camelCase` trước khi trả về component:

```typescript
function toCamelCase(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    acc[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
    return acc;
  }, {} as Record<string, unknown>);
}
```
Nhờ đó, lập trình viên frontend luôn viết code theo chuẩn JavaScript/TypeScript tự nhiên mà không cần viết các hàm mapper thủ công.

---

## 4. Xử Lý Upload File Đa Phương Tiện (FormData)

Khi gửi file ảnh hoặc media lên server:
- `fetchWrapper` tự động nhận diện `body instanceof FormData`.
- **Tuyệt đối không set header `Content-Type: application/json`** và **không set `Content-Type: multipart/form-data` bằng tay**. Trình duyệt bắt buộc phải tự sinh header này kèm chuỗi phân cách `boundary` ngẫu nhiên để server giải mã chính xác các phần file.
