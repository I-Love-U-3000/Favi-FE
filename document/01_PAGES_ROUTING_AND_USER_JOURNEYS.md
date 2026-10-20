# 01 — Danh Sách Trang, Định Tuyến & Luồng Người Dùng (Favi-FE)

## 1. Bản Đồ Định Tuyến Ứng Dụng Người Dùng (User App Routing)

Mọi đường dẫn người dùng đều được tiền tố hóa bằng mã ngôn ngữ `/[locale]` (mặc định: `vi` hoặc `en`).

| Đường dẫn (Route) | Tên Màn Hình | Loại Truy Cập | Chức Năng Cốt Lõi |
|---|---|---|---|
| `/[locale]/home` | Trang Bảng Tin (Home Feed) | Công khai / Đăng nhập | Hiển thị Stories bar, danh sách bài viết theo thuật toán bảng tin, tương tác Like/Comment nhanh, nút thêm vào bộ sưu tập. |
| `/[locale]/search` | Khám Phá & Tìm Kiếm | Công khai / Đăng nhập | Tìm kiếm ngữ nghĩa bằng AI (Semantic Vector Search qua OpenCLIP), tìm theo hashtag, từ khóa, hiển thị bộ sưu tập nổi bật. |
| `/[locale]/chat` | Tin Nhắn Trực Tiếp (Chat) | Yêu cầu đăng nhập | Danh sách hội thoại 1-1 và nhóm, nhắn tin văn bản, ảnh thời gian thực qua SignalR ChatHub, nút gọi video WebRTC. |
| `/[locale]/notifications` | Trung Tâm Thông Báo | Yêu cầu đăng nhập | Danh sách thông báo (Like, Comment, Follow, System), lọc đã đọc/chưa đọc, đánh dấu đã đọc tất cả, deep-link tới bài viết. |
| `/[locale]/profile/[id]` | Trang Cá Nhân (Profile) | Công khai / Đăng nhập | Avatar, Cover, Bio, liên kết MXH, số lượng Follower/Following, các tab: Bài viết đã đăng, Bộ sưu tập, Bài viết đã thích. |
| `/[locale]/posts/[id]` | Chi Tiết Bài Viết | Công khai / Đăng nhập | Hiển thị ảnh chất lượng cao, caption, cây bình luận đa cấp (nested replies), danh sách người đã thích. |
| `/[locale]/collections` | Bộ Sưu Tập Của Tôi | Yêu cầu đăng nhập | Danh sách các bộ sưu tập ảnh cá nhân, quản lý quyền riêng tư (Public / Followers / Private), thêm/bớt bài viết. |
| `/[locale]/friends` | Bạn Bè & Mạng Xã Hội | Yêu cầu đăng nhập | Quản lý danh sách đang theo dõi, người theo dõi mình, gợi ý người dùng tương đồng (User Recommendations). |
| `/[locale]/settings` | Cài Đặt Tài Khoản | Yêu cầu đăng nhập | Chỉnh sửa hồ sơ, đổi mật khẩu, bật tắt âm thanh thông báo, lựa chọn ngôn ngữ, chế độ giao diện sáng/tối. |
| `/[locale]/recycle-bin` | Thùng Rác (Recycle Bin) | Yêu cầu đăng nhập | Xem lại và khôi phục các bài viết đã xóa mềm (Soft-deleted) trong vòng 30 ngày. |
| `/[locale]/(auth)/login` | Đăng Nhập | Khách (Guest) | Đăng nhập bằng Email/Password hoặc Google OAuth, lưu JWT Access & Refresh Token. |
| `/[locale]/(auth)/register`| Đăng Ký Tài Khoản | Khách (Guest) | Đăng ký tài khoản mới, xác thực thông tin cơ bản. |
| `/[locale]/onboarding` | Hướng Dẫn Ban Đầu | Yêu cầu đăng nhập | Hướng dẫn người dùng mới chọn chủ đề yêu thích, cập nhật avatar và theo dõi những người đầu tiên. |

---

## 2. Bản Đồ Cổng Quản Trị Hệ Thống (Admin Portal Routing)

Toàn bộ các trang quản trị được bảo vệ bởi quyền `Admin` và sử dụng bố cục chuyên biệt `/[locale]/admin/layout.tsx` (Sidebar quản trị + Header thống kê):

| Đường dẫn (Route) | Trang Quản Trị | Chức Năng Chi Tiết | Linh Kiện Chính (PrimeReact) |
|---|---|---|---|
| `/[locale]/admin` | Dashboard Tổng Quan | Số liệu tổng hợp (Users, Posts, Reports, Active conns), biểu đồ tăng trưởng theo tuần/tháng. | `Card`, `Chart` (Recharts), `ProgressBar` |
| `/[locale]/admin/users` | Quản Lý Người Dùng | Bảng danh sách người dùng, tìm kiếm theo email/username, lọc trạng thái (Active/Banned), bulk ban/unban. | `DataTable`, `Column`, `Tag`, `FilterMenu` |
| `/[locale]/admin/users/[id]` | Chi Tiết Người Dùng | Toàn bộ lịch sử hoạt động, bài viết, các lần bị báo cáo, nhật ký cảnh cáo và form áp đặt hình phạt. | `Timeline`, `Card`, `Button`, `Dialog` |
| `/[locale]/admin/posts` | Quản Lý Bài Viết | Duyệt bài viết, lọc theo mức độ nhạy cảm (NSFW score do AI chấm), xem trước media, xóa bài vi phạm. | `DataTable`, `Image` preview, `Badge`, `ConfirmDialog` |
| `/[locale]/admin/reports` | Tiếp Nhận Báo Cáo | Hàng đợi các báo cáo vi phạm từ cộng đồng, lọc theo lý do (Spam, Harassment, NSFW, Copyright). | `DataTable`, `Dropdown`, `StatusTag` |
| `/[locale]/admin/reports/[id]` | Xử Lý Báo Cáo | Đối chiếu nội dung bị tố cáo với người báo cáo, ghi chú của kiểm duyệt viên, hành động xử lý (Dismiss/Ban). | `Card`, `Textarea`, `RadioButton`, `Toast` |
| `/[locale]/admin/comments` | Kiểm Duyệt Bình Luận | Tìm kiếm bình luận có từ ngữ độc hại, xóa hàng loạt bình luận spam. | `DataTable`, `MultiSelect`, `Button` |
| `/[locale]/admin/audit` | Nhật Ký Kiểm Toán (Audit) | Lịch sử toàn bộ hành động của các Admin và Moderator trong hệ thống (Ai đã làm gì, thời gian nào, IP nào). | `DataTable`, `Calendar` range filter |
| `/[locale]/admin/analytics` | Phân Tích Chuyên Sâu | Biểu đồ tương tác (Likes/Comments theo giờ), phân bố bài viết theo danh mục, báo cáo xuất file Excel/CSV. | `Chart`, `Dropdown`, `Button` (Export) |
| `/[locale]/admin/health` | Giám Sát Sức Khỏe | Trạng thái thời gian thực của NGINX Gateway, PostgreSQL DB, Redis Cache, Qdrant Vector Engine. | `Tag` (Success/Danger), `ProgressBar`, `Card` |

---

## 3. Các Luồng Nghiệp Vụ Chính (Core User Workflows)

### 3.1 Luồng Đăng Bài Viết (Create Post Workflow)
1. Người dùng bấm nút **"Create" (+)** trên Navbar hoặc nhấn phím tắt.
2. Dialog `CreatePostModal` mở ra:
   - Cho phép kéo thả (Drag & Drop) một hoặc nhiều file ảnh.
   - Hỗ trợ cắt ảnh (Crop) và áp bộ lọc màu (Filter).
   - Nhập Caption, gắn Hashtags (tự động gợi ý tag) và chọn mức độ riêng tư (Public / Followers / Private).
3. Khi bấm Submit:
   - Form đóng gói thành `FormData`.
   - Client gọi `fetchWrapper.post('/api/posts', formData)`.
   - `fetchWrapper` tự động gắn header `Idempotency-Key` ngẫu nhiên để chống submit trùng lặp khi mạng chậm.
   - Khi thành công, tự động đóng modal, hiển thị Toast thông báo và đẩy bài viết mới lên đầu bảng tin.

### 3.2 Luồng Thả Cảm Xúc (Reaction Toggle Workflow)
1. Người dùng click vào icon Trái Tim (Like) trên `FeedCard`.
2. Giao diện thực hiện **Cập Nhật Lạc Quan (Optimistic UI Update)**: Ngay lập tức đổi màu icon và tăng biến đếm số lượt like lên +1.
3. Đồng thời gọi API: `fetchWrapper.post('/api/posts/${id}/reaction', { type: 'Like' })`.
4. Nếu request thành công: Giữ nguyên trạng thái mới.
5. Nếu request thất bại (lỗi mạng hoặc server): Revert biến đếm về số cũ và hiển thị thông báo lỗi Toast để người dùng biết.
