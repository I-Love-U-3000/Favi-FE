# 06 — Hệ Thống UI, PrimeReact Components & Hướng Dẫn Phát Triển (Favi-FE)

## 1. Thư Viện UI Cốt Lõi: PrimeReact

Favi-FE chuẩn hóa toàn bộ giao diện bằng cách sử dụng các components của **PrimeReact** kết hợp các class tiện ích của **Tailwind CSS**. 
Trước khi tự viết một component giao diện mới, lập trình viên bắt buộc phải kiểm tra và tái sử dụng component có sẵn của PrimeReact.

### 1.1 Form Elements
```tsx
import { InputText } from "primereact/inputtext";       // Ô nhập văn bản ngắn
import { InputTextarea } from "primereact/inputtextarea"; // Ô nhập văn bản nhiều dòng
import { Button } from "primereact/button";             // Nút bấm (hỗ trợ loading spinner, icons)
import { Dropdown } from "primereact/dropdown";         // Menu chọn 1 mục
import { MultiSelect } from "primereact/multiselect";   // Menu chọn nhiều mục
import { Checkbox } from "primereact/checkbox";         // Hộp kiểm
import { RadioButton } from "primereact/radiobutton";   // Nút chọn radio duy nhất
import { Calendar } from "primereact/calendar";         // Chọn ngày tháng / Date range
import { FileUpload } from "primereact/fileupload";     // Tải lên file / ảnh
import { Chips } from "primereact/chips";               // Nhập danh sách tags
```

### 1.2 Hiển Thị Dữ Liệu (Display & Media)
```tsx
import { Card } from "primereact/card";
import { Image as PrimeImage } from "primereact/image"; // Xem ảnh kèm preview phóng to
import { Avatar } from "primereact/avatar";             // Ảnh đại diện người dùng
import { Tag } from "primereact/tag";                   // Nhãn trạng thái (Success, Warning, Danger)
import { Badge } from "primereact/badge";               // Huy hiệu số thông báo chưa đọc
import { Skeleton } from "primereact/skeleton";         // Khung xương placeholder khi đang tải
import { ProgressSpinner } from "primereact/progressspinner";
```

### 1.3 Bảng Dữ Liệu Chuyên Nghiệp (Data Display)
Đặc biệt dùng cho toàn bộ Cổng quản trị Admin Portal:
```tsx
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Timeline } from "primereact/timeline";         // Dòng thời gian lịch sử hoạt động
```

### 1.4 Hộp Thoại & Thông Báo (Dialog & Overlays)
```tsx
import { Dialog } from "primereact/dialog";             // Cửa sổ modal
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog"; // Hộp thoại xác nhận xóa
import { Toast } from "primereact/toast";               // Thông báo góc màn hình
import { Tooltip } from "primereact/tooltip";           // Gợi ý khi hover
import { Sidebar } from "primereact/sidebar";           // Menu trượt từ cạnh màn hình
```

---

## 2. Hệ Thống Biểu Tượng (PrimeIcons)

Dự án tích hợp bộ icon `primeicons`. Sử dụng trực tiếp class `pi pi-<icon-name>`:

| Tên Icon | Class Name | Sử Dụng Cho |
|---|---|---|
| Home | `pi pi-home` | Trang chủ bảng tin |
| Search | `pi pi-search` | Thanh tìm kiếm & khám phá |
| User | `pi pi-user` | Trang cá nhân, profile |
| Heart | `pi pi-heart` | Thả tim / Like bài viết |
| Comment | `pi pi-comment` | Bình luận |
| Send / Share | `pi pi-send` | Gửi tin nhắn, chia sẻ bài |
| Bookmark | `pi pi-bookmark` | Lưu vào bộ sưu tập |
| Trash | `pi pi-trash` | Xóa bài viết / bình luận |
| Spinner | `pi pi-spin pi-spinner` | Icon loading khi thực thi |
| Ban / Lock | `pi pi-ban` | Khóa tài khoản trong Admin |

---

## 3. Quy Tắc Thiết Kế Trải Nghiệm Người Dùng (UX Standards)

1. **Luôn có trạng thái Loading rõ ràng**:
   - Khi đang nạp dữ liệu ban đầu: Hiển thị `Skeleton` hoặc `ProgressSpinner`.
   - Khi đang bấm nút submit: Bật prop `loading={isLoading}` trên `Button` của PrimeReact để vô hiệu hóa nút bấm và hiện con quay, ngăn chặn người dùng bấm nhiều lần.
2. **Xử lý trạng thái rỗng (Empty State)**:
   - Khi bảng tin hoặc kết quả tìm kiếm không có bài viết: Hiển thị icon minh họa cùng dòng chữ gợi ý thân thiện (ví dụ: *"Chưa có bài viết nào. Hãy theo dõi bạn bè để xem tin mới!"*).
3. **Xác nhận trước hành động nguy hiểm**:
   - Xóa bài viết, xóa bộ sưu tập, khóa tài khoản người dùng bắt buộc phải bật `confirmDialog` để người dùng xác nhận lần thứ hai trước khi gửi lệnh gọi API DELETE.
4. **Thông báo phản hồi kết quả (Feedback via Toast)**:
   - Mọi hành động thành công hoặc thất bại đều phải kích hoạt thông báo Toast ở góc màn hình (`showToast.success(...)` hoặc `showToast.error(...)`).
