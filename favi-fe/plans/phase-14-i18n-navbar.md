# Phase 14: i18n + Navbar Update

## Mục tiêu
Cập nhật i18n files và Navbar để hỗ trợ admin portal.

## Files cần sửa
```
Sửa: src/messages/vi.json
Sửa: src/messages/en.json
Sửa: src/components/Navbar.tsx
```

## i18n Keys cần thêm

### vi.json
```json
{
  "Admin": {
    "title": "Quản trị",
    "dashboard": "Tổng quan",
    "users": "Người dùng",
    "posts": "Bài viết",
    "reports": "Báo cáo",
    "audit": "Nhật ký kiểm tra",
    "analytics": "Phân tích",
    "health": "Tình trạng hệ thống",
    "comments": "Bình luận",
    "settings": "Cài đặt"
  },
  "AdminDashboard": {
    "title": "Tổng quan",
    "users": "Người dùng",
    "posts": "Bài viết",
    "reports": "Báo cáo",
    "banned": "Bị cấm",
    "pending": "Đang chờ",
    "resolved": "Đã xử lý",
    "rejected": "Đã từ chối",
    "topUsers": "Top người dùng",
    "topPosts": "Top bài viết",
    "growthChart": "Biểu đồ tăng trưởng",
    "userStatus": "Trạng thái người dùng"
  },
  "AdminUsers": {
    "title": "Quản lý người dùng",
    "search": "Tìm kiếm...",
    "role": "Vai trò",
    "status": "Trạng thái",
    "all": "Tất cả",
    "active": "Hoạt động",
    "banned": "Bị cấm",
    "inactive": "Không hoạt động",
    "admin": "Quản trị viên",
    "user": "Người dùng",
    "actions": "Hành động",
    "viewProfile": "Xem hồ sơ",
    "banUser": "Cấm người dùng",
    "unbanUser": "Bỏ cấm",
    "warnUser": "Cảnh cáo",
    "bulkAction": "Hành động hàng loạt",
    "export": "Xuất file",
    "selected": "đã chọn"
  },
  "AdminPosts": {
    "title": "Quản lý bài viết",
    "search": "Tìm kiếm bài viết...",
    "privacy": "Quyền riêng tư",
    "public": "Công khai",
    "private": "Riêng tư",
    "followers": "Bạn bè",
    "preview": "Xem trước",
    "delete": "Xóa",
    "content": "Nội dung"
  },
  "AdminReports": {
    "title": "Quản lý báo cáo",
    "search": "Tìm kiếm báo cáo...",
    "targetType": "Loại mục tiêu",
    "post": "Bài viết",
    "user": "Người dùng",
    "comment": "Bình luận",
    "reason": "Lý do",
    "reporter": "Người báo cáo",
    "resolve": "Xử lý",
    "reject": "Từ chối",
    "resolveWithDelete": "Xử lý và xóa",
    "resolveOnly": "Chỉ xử lý"
  },
  "AdminAudit": {
    "title": "Nhật ký kiểm tra",
    "search": "Tìm kiếm...",
    "actionType": "Loại hành động",
    "admin": "Quản trị viên",
    "target": "Mục tiêu",
    "details": "Chi tiết",
    "exportCSV": "Xuất CSV",
    "exportJSON": "Xuất JSON"
  },
  "AdminAnalytics": {
    "title": "Phân tích",
    "growth": "Tăng trưởng",
    "userActivity": "Hoạt động người dùng",
    "contentActivity": "Hoạt động nội dung",
    "distributions": "Phân bố",
    "comparison": "So sánh",
    "thisWeek": "Tuần này",
    "lastWeek": "Tuần trước"
  },
  "AdminHealth": {
    "title": "Tình trạng hệ thống",
    "status": "Trạng thái",
    "healthy": "Hoạt động tốt",
    "degraded": "Suy giảm",
    "unhealthy": "Lỗi",
    "lastChecked": "Kiểm tra lần cuối",
    "refresh": "Làm mới",
    "cpu": "CPU",
    "memory": "Bộ nhớ",
    "uptime": "Thời gian hoạt động",
    "database": "Cơ sở dữ liệu",
    "services": "Dịch vụ"
  },
  "AdminComments": {
    "title": "Quản lý bình luận",
    "search": "Tìm kiếm bình luận...",
    "post": "Bài viết",
    "content": "Nội dung",
    "author": "Tác giả",
    "delete": "Xóa"
  },
  "Common": {
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "edit": "Sửa",
    "confirm": "Xác nhận",
    "yes": "Có",
    "no": "Không",
    "loading": "Đang tải...",
    "noData": "Không có dữ liệu",
    "export": "Xuất",
    "import": "Nhập",
    "filter": "Lọc",
    "reset": "Đặt lại",
    "search": "Tìm kiếm",
    "selectAll": "Chọn tất cả",
    "deselectAll": "Bỏ chọn tất cả"
  }
}
```

### en.json
```json
{
  "Admin": {
    "title": "Admin",
    "dashboard": "Dashboard",
    "users": "Users",
    "posts": "Posts",
    "reports": "Reports",
    "audit": "Audit Logs",
    "analytics": "Analytics",
    "health": "System Health",
    "comments": "Comments",
    "settings": "Settings"
  },
  "AdminDashboard": {
    "title": "Dashboard",
    "users": "Users",
    "posts": "Posts",
    "reports": "Reports",
    "banned": "Banned",
    "pending": "Pending",
    "resolved": "Resolved",
    "rejected": "Rejected",
    "topUsers": "Top Users",
    "topPosts": "Top Posts",
    "growthChart": "Growth Chart",
    "userStatus": "User Status"
  },
  "AdminUsers": {
    "title": "User Management",
    "search": "Search...",
    "role": "Role",
    "status": "Status",
    "all": "All",
    "active": "Active",
    "banned": "Banned",
    "inactive": "Inactive",
    "admin": "Admin",
    "user": "User",
    "actions": "Actions",
    "viewProfile": "View Profile",
    "banUser": "Ban User",
    "unbanUser": "Unban User",
    "warnUser": "Warn User",
    "bulkAction": "Bulk Action",
    "export": "Export",
    "selected": "selected"
  },
  "AdminPosts": {
    "title": "Post Management",
    "search": "Search posts...",
    "privacy": "Privacy",
    "public": "Public",
    "private": "Private",
    "followers": "Followers",
    "preview": "Preview",
    "delete": "Delete",
    "content": "Content"
  },
  "AdminReports": {
    "title": "Report Management",
    "search": "Search reports...",
    "targetType": "Target Type",
    "post": "Post",
    "user": "User",
    "comment": "Comment",
    "reason": "Reason",
    "reporter": "Reporter",
    "resolve": "Resolve",
    "reject": "Reject",
    "resolveWithDelete": "Resolve with Delete",
    "resolveOnly": "Resolve Only"
  },
  "AdminAudit": {
    "title": "Audit Logs",
    "search": "Search...",
    "actionType": "Action Type",
    "admin": "Admin",
    "target": "Target",
    "details": "Details",
    "exportCSV": "Export CSV",
    "exportJSON": "Export JSON"
  },
  "AdminAnalytics": {
    "title": "Analytics",
    "growth": "Growth",
    "userActivity": "User Activity",
    "contentActivity": "Content Activity",
    "distributions": "Distributions",
    "comparison": "Comparison",
    "thisWeek": "This Week",
    "lastWeek": "Last Week"
  },
  "AdminHealth": {
    "title": "System Health",
    "status": "Status",
    "healthy": "Healthy",
    "degraded": "Degraded",
    "unhealthy": "Unhealthy",
    "lastChecked": "Last checked",
    "refresh": "Refresh",
    "cpu": "CPU",
    "memory": "Memory",
    "uptime": "Uptime",
    "database": "Database",
    "services": "Services"
  },
  "AdminComments": {
    "title": "Comment Management",
    "search": "Search comments...",
    "post": "Post",
    "content": "Content",
    "author": "Author",
    "delete": "Delete"
  },
  "Common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "confirm": "Confirm",
    "yes": "Yes",
    "no": "No",
    "loading": "Loading...",
    "noData": "No data",
    "export": "Export",
    "import": "Import",
    "filter": "Filter",
    "reset": "Reset",
    "search": "Search",
    "selectAll": "Select All",
    "deselectAll": "Deselect All"
  }
}
```

## Navbar Update

### Thêm admin menu vào Navbar
```tsx
// Trong Navbar.tsx
const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: "pi pi-home" },
  { label: "Users", href: "/admin/users", icon: "pi pi-users" },
  { label: "Posts", href: "/admin/posts", icon: "pi pi-file" },
  { label: "Reports", href: "/admin/reports", icon: "pi pi-flag", badge: pendingReports },
  { label: "Audit", href: "/admin/audit", icon: "pi pi-history" },
  { label: "Analytics", href: "/admin/analytics", icon: "pi pi-chart-bar" },
  { label: "Health", href: "/admin/health", icon: "pi pi-heart" },
  { label: "Comments", href: "/admin/comments", icon: "pi pi-comments" },
];

// Hiển thị khi isAdmin
{isAdmin && (
  <Menu model={ADMIN_NAV} />
)}
```

### Cách hiển thị trong Navbar
- Thêm icon/menu cho Admin
- Ẩn nếu không phải admin (`!isAdmin`)
- Badge hiển thị số reports pending

## Context Search khi cần
```
AGENT_DEV_GUIDE.md → Section 8: "i18n"
AGENT_DEV_GUIDE.md → Section 7: "Navigation"
src/messages/ → Xem existing i18n structure
src/components/Navbar.tsx → Tham khảo cách implement nav hiện tại
```

## Output
- Cập nhật src/messages/vi.json
- Cập nhật src/messages/en.json
- Cập nhật src/components/Navbar.tsx

## Tick ✅ khi hoàn thành
- [ ] Admin keys trong vi.json
- [ ] Admin keys trong en.json
- [ ] Navbar hiển thị admin menu khi isAdmin
- [ ] Badge hiển thị pending reports
- [ ] Translation hoạt động trong tất cả pages
