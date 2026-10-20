# Favi-FE Technical Documentation Index

Chào mừng bạn đến với tài liệu kỹ thuật hoàn chỉnh của hệ thống **Favi Frontend (Favi-FE)** — giao diện người dùng mạng xã hội hiện đại được xây dựng trên nền tảng **Next.js 15 (App Router), React 19, TypeScript, PrimeReact và Tailwind CSS**.

---

## Danh mục tài liệu kỹ thuật

| # | Tài liệu | Mô tả chi tiết |
|---|---|---|
| **00** | [00_OVERVIEW_AND_FRONTEND_ARCHITECTURE.md](./00_OVERVIEW_AND_FRONTEND_ARCHITECTURE.md) | Tổng quan kiến trúc Next.js 15, App Router, React 19, phân định Server/Client Components, cấu trúc thư mục `src`. |
| **01** | [01_PAGES_ROUTING_AND_USER_JOURNEYS.md](./01_PAGES_ROUTING_AND_USER_JOURNEYS.md) | Bản đồ định tuyến (Routing map), luồng người dùng (User features) và Cổng quản trị Admin Portal toàn diện. |
| **02** | [02_LAYERS_STATE_MANAGEMENT_AND_DATA_FLOW.md](./02_LAYERS_STATE_MANAGEMENT_AND_DATA_FLOW.md) | Cấu trúc phân tầng UI - Contexts - Hooks - API Services - FetchWrapper, bộ nhớ đệm (Cache) và xử lý xung đột dữ liệu. |
| **03** | [03_IDEMPOTENCY_AUTH_AND_HTTP_COMMUNICATION.md](./03_IDEMPOTENCY_AUTH_AND_HTTP_COMMUNICATION.md) | Cơ chế sinh `Idempotency-Key` tự động, JWT Token Refresh tự động trên lỗi 401, chuyển đổi PascalCase ↔ camelCase. |
| **04** | [04_REALTIME_WEBRTC_AND_EXTERNAL_INTEGRATIONS.md](./04_REALTIME_WEBRTC_AND_EXTERNAL_INTEGRATIONS.md) | Tích hợp SignalR WebSockets (Chat, Notifications, Call), luồng WebRTC P2P Call, Supabase và Cloudinary Media. |
| **05** | [05_VERSION_CONTROL_RELEASE_AND_STANDARDS.md](./05_VERSION_CONTROL_RELEASE_AND_STANDARDS.md) | Chuẩn mực Git, biến môi trường `.env`, kiểm soát type TypeScript, tối ưu hóa bundle và quy trình build/deploy. |
| **06** | [06_UI_SYSTEM_AND_COMPONENT_GUIDE.md](./06_UI_SYSTEM_AND_COMPONENT_GUIDE.md) | Hướng dẫn phát triển UI với PrimeReact components, Tailwind CSS styling, Dialogs/Toasts và Accessibility. |

---

## Nguyên tắc bắt buộc đối với Kỹ sư & AI Agent

1. **Đọc tài liệu trước khi code**: Trước khi can thiệp vào bất kỳ page, hook, hoặc service nào, bắt buộc phải tra cứu tài liệu liên quan trong thư mục này.
2. **Cập nhật tài liệu song song**: Mọi thay đổi về API endpoint, giao diện màn hình, luồng xác thực hay cấu trúc state đều phải được cập nhật vào tài liệu tương ứng ngay trong cùng commit.
3. **Tuân thủ chuẩn mực UI/UX**: Sử dụng PrimeReact components có sẵn thay vì tự viết lại; luôn gửi kèm `Idempotency-Key` cho các mutating request và xử lý đầy đủ các trạng thái Loading, Empty, Error.
