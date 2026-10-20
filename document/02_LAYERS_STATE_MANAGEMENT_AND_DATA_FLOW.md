# 02 — Phân Tầng Frontend, Quản Lý Trạng Thái & Luồng Dữ Liệu (Favi-FE)

## 1. Cấu Trúc Phân Tầng Ứng Dụng (Layered Architecture)

Dự án tuân thủ mô hình phân tầng từ giao diện người dùng xuống tầng mạng:

```
┌────────────────────────────────────────────────────────┐
│                   UI Layer (React 19)                  │
│       App Router Pages (src/app/[locale]/*)            │
│       Shared & Atomic Components (src/components/*)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Context & State Layer                  │
│      AuthProvider (User, Tokens, Permissions)          │
│      RootProvider (Modals, Dialogs, Global Toast)      │
│      Client Cache (ProfileCache, PostCache)            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Custom Hooks Layer                   │
│      useAuth, usePosts, useChat, useNotifications      │
│      (Đóng gói logic nghiệp vụ, debounce, state)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Service / API Layer                  │
│      src/lib/api/* (postService, authService, etc.)    │
│      Định nghĩa contracts, URLs và parameters          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Network & Client Layer                 │
│      src/lib/fetchWrapper.ts                           │
│      - Gắn Idempotency-Key tự động                     │
│      - Intercept 401 & Auto Refresh Token              │
│      - Chuẩn hóa PascalCase -> camelCase               │
└────────────────────────────────────────────────────────┘
```

---

## 2. Quản Lý Trạng Thái Toàn Cục (Global Context Providers)

Thay vì cài đặt các thư viện state phức tạp (như Redux) gây bloat mã nguồn, Favi-FE sử dụng React Contexts chuyên biệt:

### 2.1 `AuthProvider` (`src/components/AuthProvider.tsx`)
- Quản lý phiên làm việc của người dùng hiện tại (`currentUser: Profile | null`).
- Quản lý trạng thái xác thực (`isAuthenticated: boolean`, `isLoading: boolean`).
- Cung cấp các hàm: `login(email, password)`, `logout()`, `updateProfile(data)`.
- Lắng nghe sự kiện toàn cục `"auth-token-expired"` từ `fetchWrapper` để tự động dọn dẹp state và chuyển hướng về trang `/login` khi phiên làm việc hết hạn.

### 2.2 `RootProvider` (`src/components/RootProvider.tsx`)
- Quản lý trạng thái của các Modal dùng chung trên toàn ứng dụng:
  - `isCreatePostOpen`: Bật/tắt modal tạo bài viết từ bất kỳ đâu (Navbar, phím tắt).
  - `isShareModalOpen`: Bật/tắt modal chia sẻ bài viết.
  - `isImagePreviewOpen`: Xem ảnh phóng to toàn màn hình.
- Khởi tạo component `Toast` của PrimeReact và export instance ra `src/lib/toast.ts` để bất kỳ file `.ts` nào cũng có thể gọi `showToast.success(...)`, `showToast.error(...)` mà không cần hook.

---

## 3. Bộ Nhớ Đệm Phía Client (Client-Side Caching)

Để tăng tốc độ chuyển trang và giảm tải cho backend, Favi-FE triển khai các cache module có thời gian sống (TTL):

### 3.1 `profileCache.ts`
- Lưu trữ thông tin hồ sơ của các người dùng đã tải: `Map<userId, { profile, timestamp }>`.
- Giúp FeedCard hiển thị tức thì avatar và tên người đăng bài mà không cần gọi API lặp đi lặp lại.

### 3.2 `postCache.ts` & `collectionCache.ts`
- Lưu tạm danh sách bài viết trên bảng tin và chi tiết bộ sưu tập.
- Khi người dùng điều hướng sang trang khác rồi quay lại, bảng tin hiển thị ngay lập tức từ cache trong khi ngầm gửi request (Stale-While-Revalidate).

---

## 4. Xử Lý Xung Đột Đồng Thời (Concurrency Conflict Handling)

Khi xảy ra xung đột dữ liệu trên backend (HTTP `409 Conflict`), `fetchWrapper` phát ra một Custom Event trên trình duyệt:

```typescript
// Trong fetchWrapper.ts
if (res.status === 409 && typeof window !== "undefined") {
  window.dispatchEvent(new CustomEvent("favi-concurrency-conflict", { detail: thrownError }));
}
```

- Các components hoặc context lắng nghe sự kiện này:
  ```typescript
  window.addEventListener("favi-concurrency-conflict", (event) => {
    showToast.warn("Dữ liệu đang được cập nhật bởi một phiên khác hoặc yêu cầu trước đó đang được xử lý.");
  });
  ```
- Giúp người dùng hiểu rõ trạng thái thay vì hiển thị lỗi chung chung "Đã có lỗi xảy ra".
