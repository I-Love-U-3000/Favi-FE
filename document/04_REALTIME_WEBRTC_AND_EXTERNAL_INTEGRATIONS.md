# 04 — Kết Nối Thời Gian Thực (SignalR), WebRTC & Dịch Vụ Đám Mây (Favi-FE)

## 1. Tích Hợp SignalR WebSockets

Favi-FE sử dụng thư viện `@microsoft/signalr` để duy trì kết nối hai chiều với backend thông qua 3 Hubs chính:

```
[ Frontend Client ]
        │
        ├──▶ /chatHub          (Nhắn tin trực tiếp, trạng thái đang soạn thảo 'typing', đã xem)
        ├──▶ /notificationHub  (Thông báo tương tác: Like, Comment, Follow, System alerts)
        └──▶ /callHub          (Báo hiệu cuộc gọi thoại & video WebRTC Signaling)
```

### 1.1 Cấu Hình Kết Nối & Tương Thích NGINX Sticky Session
Để đảm bảo kết nối SignalR không bị lỗi khi chạy qua cụm NGINX nhiều node (Load Balancer):
1. Client thiết lập kết nối với `withUrl`:
   ```typescript
   import * as signalR from "@microsoft/signalr";

   const connection = new signalR.HubConnectionBuilder()
     .withUrl(`${process.env.NEXT_PUBLIC_API_URL}/chatHub`, {
       accessTokenFactory: () => localStorage.getItem("access_token") || "",
       transport: signalR.HttpTransportType.WebSockets // Ưu tiên WebSockets thuần
     })
     .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Tự động kết nối lại
     .build();
   ```
2. Nhờ cấu hình `ip_hash` trên NGINX Gateway, bước Negotiate ban đầu và kết nối WebSocket tiếp theo luôn được giữ đúng trên cùng một replica backend.

---

## 2. Luồng Cuộc Gọi Trực Tuyến WebRTC (Peer-to-Peer Calls)

Hệ thống hỗ trợ gọi video và gọi thoại 1-1 trực tiếp trên trình duyệt sử dụng chuẩn WebRTC kết hợp SignalR làm kênh báo hiệu (Signaling Channel):

```
User A (Caller)                     SignalR /callHub                     User B (Callee)
      │                                    │                                    │
      │── 1. Gửi 'CallUser' (Offer SDP) ──▶│                                    │
      │                                    │── 2. Chuyển 'IncomingCall' ───────▶│
      │                                    │                                    │
      │                                    │◀── 3. Chấp nhận 'AnswerCall' (SDP)─│
      │◀── 4. Nhận 'CallAccepted' ─────────│                                    │
      │                                    │                                    │
      │── 5. Trao đổi ICE Candidates ─────▶│── 5. Trao đổi ICE Candidates ─────▶│
      │◀──    (Thông tin địa chỉ mạng)   ──│◀──    (Thông tin địa chỉ mạng)   ──│
      │                                    │                                    │
      ▼═════════════════════════════════════════════════════════════════════════▼
                         [ Kết Nối P2P Audio/Video Trực Tiếp ]
```

- Mã nguồn quản lý kết nối P2P và xử lý camera/microphone được đặt tại `src/lib/webrtc/`.

---

## 3. Tích Hợp Các Dịch Vụ Đám Mây Ngoài (Cloud Services)

### 3.1 Lưu Trữ Đa Phương Tiện: Supabase Storage & Cloudinary
- **Ảnh bài viết và media lớn**: Được upload và lưu trữ trên Cloudinary hoặc Supabase Storage bucket.
- **Tối ưu hóa ảnh**:
  - Tự động chuyển đổi định dạng sang `WebP` hoặc `AVIF` để giảm 40-60% dung lượng tải.
  - Sử dụng tham số CDN để resize ảnh phù hợp với kích thước màn hình (thumbnail, feed card, hoặc full preview).

### 3.2 Dịch Vụ Địa Lý & Gợi Ý Vị Trí: LocationIQ
- Màn hình tạo bài viết (`CreatePostModal`) tích hợp LocationIQ Autocomplete API.
- Cho phép người dùng tìm kiếm tên địa điểm/thành phố và lưu trữ tọa độ kinh độ/vĩ độ (`latitude`, `longitude`) kèm tên địa danh.
