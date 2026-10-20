# 00 — Tổng Quan Kiến Trúc Frontend (Favi-FE)

## 1. Công Nghệ Nền Tảng (Technology Stack)

Frontend của Favi được xây dựng trên bộ công nghệ web hiện đại nhất hiện nay:
- **Framework**: [Next.js 15](https://nextjs.org/) sử dụng kiến trúc **App Router**.
- **Thư viện UI**: [React 19](https://react.dev/) kết hợp [PrimeReact](https://primereact.org/) cho bộ linh kiện giao diện phong phú (Form, DataTables, Dialogs, Charts).
- **Ngôn ngữ**: TypeScript 5 (Strict Mode).
- **Styling**: Tailwind CSS kết hợp PrimeFlex và CSS Modules cho khả năng tùy biến cao.
- **Đa ngôn ngữ (i18n)**: `next-intl` hỗ trợ chuyển đổi ngôn ngữ linh hoạt (`[locale]`: Tiếng Việt, Tiếng Anh,...).
- **Giao tiếp Realtime**: `@microsoft/signalr` kết nối tới cụm SignalR Hubs trên Backend.

---

## 2. Cấu Trúc Dự Án (Project Anatomy)

Toàn bộ mã nguồn chính nằm trong thư mục `favi-fe/src`:

```
favi-fe/
├── messages/                   # File từ điển dịch thuật đa ngôn ngữ (vi.json, en.json)
├── public/                     # Ảnh tĩnh, icons, logos
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── [locale]/           # Dynamic route đa ngôn ngữ
│   │   │   ├── (auth)/         # Nhóm trang xác thực (login, register, forgot-password)
│   │   │   ├── admin/          # Cổng quản trị Admin Portal
│   │   │   ├── chat/           # Màn hình nhắn tin trực tiếp & nhóm
│   │   │   ├── collections/    # Bộ sưu tập bài viết
│   │   │   ├── friends/        # Danh sách người theo dõi & gợi ý kết bạn
│   │   │   ├── home/           # Bảng tin chính (Feed & Stories)
│   │   │   ├── notifications/  # Trung tâm thông báo
│   │   │   ├── posts/[id]/     # Chi tiết bài viết & cây bình luận
│   │   │   ├── profile/[id]/   # Trang cá nhân người dùng
│   │   │   ├── search/         # Tìm kiếm ngữ nghĩa AI (Vector) & từ khóa
│   │   │   ├── settings/       # Cài đặt tài khoản & giao diện
│   │   │   ├── layout.tsx      # Root Layout (bọc AuthProvider, PrimeReactProvider)
│   │   │   └── page.tsx        # Trang chủ chuyển hướng
│   │   └── middleware.ts       # Định tuyến ngôn ngữ & bảo vệ private route
│   ├── components/             # Các React Components dùng chung
│   │   ├── AuthProvider.tsx    # Context quản lý phiên đăng nhập & User Profile
│   │   ├── RootProvider.tsx    # Quản lý Modal, Dialog toàn cục & Toast
│   │   ├── Navbar.tsx          # Sidebar menu điều hướng chính
│   │   ├── FeedCard.tsx        # Card hiển thị bài viết trên bảng tin
│   │   ├── Post.tsx            # Linh kiện hiển thị chi tiết bài viết
│   │   └── ...                 # Modals (Create Post, Edit Profile, Share Dialog)
│   ├── hooks/                  # Custom React Hooks
│   ├── i18n/                   # Cấu hình routing cho next-intl
│   ├── lib/                    # Tầng Service, Utility & HTTP Client
│   │   ├── api/                # Các API modules gọi backend
│   │   ├── cache/              # Client-side cache (ProfileCache, PostCache, CollectionCache)
│   │   ├── fetchWrapper.ts     # HTTP client wrapper (Idempotency, Auto Token Refresh)
│   │   ├── toast.ts            # Quản lý thông báo toast toàn cục
│   │   └── webrtc/             # Logic kết nối cuộc gọi thoại/video P2P
│   ├── theme/                  # Theme PrimeReact & style tùy biến
│   └── types/                  # TypeScript interface definitions (User, Post, Comment,...)
```

---

## 3. Ranh Giới Giữa Server Components & Client Components

Next.js 15 áp dụng mô hình Server Components theo mặc định. Tại Favi-FE, nguyên tắc phân định được quy định rõ ràng:

### 3.1 Server Components (RSC)
- **Áp dụng cho**: Khung bố cục (`layout.tsx`), trang nạp dữ liệu tĩnh SEO, các trang wrapper bọc ngoài.
- **Lợi ích**: Tối ưu hóa SEO, giảm dung lượng JavaScript bundle tải về trình duyệt, tăng tốc độ First Contentful Paint (FCP).

### 3.2 Client Components (`"use client"`)
- **Áp dụng cho**:
  - Tất cả các trang và components có tương tác người dùng: Click, Hover, Form Inputs, Modals, Dialogs.
  - Các components sử dụng React Hooks: `useState`, `useEffect`, `useContext`, `useCallback`.
  - Các linh kiện PrimeReact có event handlers (`DataTable`, `Dialog`, `Dropdown`, `Toast`).
  - Kết nối Realtime WebSocket (`SignalR`) và WebRTC.
- **Quy tắc**: Đặt chỉ thị `"use client"` ở dòng đầu tiên của file. Giữ Client Components nằm ở nhánh lá (leaf components) của cây DOM càng nhiều càng tốt để giữ phần trên là Server Components.
