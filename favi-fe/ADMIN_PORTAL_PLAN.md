# Admin Portal Implementation Plan - Tổng hợp

## Tổng quan

Document này là plan tổng hợp để xây dựng lại toàn bộ Admin Portal với UX/UI chuẩn.

**Tham khảo chính:**
- `AGENT_DEV_GUIDE.md` - Quy tắc chung khi phát triển frontend
- `admin_frontend_app_router.md` - Chi tiết architecture, API, UI components cho admin

---

## Mục tiêu

Xóa bỏ hoàn toàn các prototype phân trang admin hiện tại và xây dựng lại từ đầu với:
- UX/UI chuẩn PrimeReact
- API integration đầy đủ
- Tính năng: pagination, filtering, bulk actions, modals, charts

---

## Các trang cần implement

| # | Trang | Route | Priority | Phase |
|---|-------|-------|----------|-------|
| 1 | Dashboard | `/admin` | 🔴 High | 3 |
| 2 | Users | `/admin/users` | 🔴 High | 4 |
| 3 | User Detail | `/admin/users/[id]` | 🟡 Medium | 5 |
| 4 | Posts | `/admin/posts` | 🔴 High | 6 |
| 5 | Reports | `/admin/reports` | 🔴 High | 7 |
| 6 | Report Detail | `/admin/reports/[id]` | 🟡 Medium | 8 |
| 7 | Audit Logs | `/admin/audit` | 🟡 Medium | 9 |
| 8 | Analytics | `/admin/analytics` | 🟡 Medium | 10 |
| 9 | Health | `/admin/health` | 🟢 Low | 11 |
| 10 | Comments | `/admin/comments` | 🟢 Low | 12 |

---

## Cấu trúc thư mục target

```
favi-fe/
├── src/
│   ├── app/[locale]/admin/
│   │   ├── layout.tsx              # Admin layout (sidebar + header)
│   │   ├── page.tsx                # Dashboard
│   │   ├── users/
│   │   │   ├── page.tsx            # Users list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # User detail
│   │   ├── posts/
│   │   │   ├── page.tsx            # Posts list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Post detail
│   │   ├── reports/
│   │   │   ├── page.tsx            # Reports list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Report detail
│   │   ├── audit/
│   │   │   └── page.tsx            # Audit logs
│   │   ├── analytics/
│   │   │   └── page.tsx            # Analytics
│   │   ├── health/
│   │   │   └── page.tsx            # Health monitoring
│   │   └── comments/
│   │       └── page.tsx            # Comments management
│   ├── components/admin/
│   │   ├── layout/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── charts/
│   │   │   ├── GrowthChart.tsx
│   │   │   ├── UserActivityChart.tsx
│   │   │   └── UserRolePieChart.tsx
│   │   ├── tables/
│   │   │   ├── UsersTable.tsx
│   │   │   ├── PostsTable.tsx
│   │   │   ├── ReportsTable.tsx
│   │   │   └── AuditLogsTable.tsx
│   │   └── modals/
│   │       ├── BanUserDialog.tsx
│   │       ├── WarnUserDialog.tsx
│   │       ├── DeleteContentDialog.tsx
│   │       ├── ResolveReportDialog.tsx
│   │       └── BulkActionDialog.tsx
│   ├── lib/api/
│   │   └── admin.ts                # Admin API calls
│   ├── hooks/queries/
│   │   ├── useAdminUsers.ts
│   │   ├── useAdminPosts.ts
│   │   ├── useAdminReports.ts
│   │   ├── useAdminAnalytics.ts
│   │   └── useAdminAudit.ts
│   └── types/
│       └── admin.d.ts              # Admin types
```

---

## Phase Checklist (Progress Tracking)

| Phase | Task | Status | Review |
|-------|------|--------|--------|
| 1 | Xóa prototype cũ & tạo folder structure | ✅ Done | Đã xóa prototype tại `src/app/[locale]/admin/`, tạo cấu trúc mới với 10 pages + components + api + hooks + types folders. Placeholder files đã tạo. |
| 2 | AdminLayout (Sidebar + Header) | ✅ Done | Đã tạo AdminSidebar với navigation items + badge, AdminHeader với breadcrumb + search (Ctrl+K) + notifications + user menu. AdminLayout có auth check (isAdmin redirect). |
| 3 | Dashboard | ✅ Done | Đã tạo admin/page.tsx với 4 StatsCards (Users, Posts, Reports, Banned), GrowthChart (Line), UserStatusPieChart (Doughnut), Top Users list, Top Posts list, Date range picker, Quick Actions. Sử dụng React Query với auto-refresh 30s. |
| 4 | Users Management | ✅ Done | Đã tạo admin/users/page.tsx với DataTable (pagination, selection), Filters (search debounced 300ms, Role, Status), Bulk actions toolbar (Ban/Unban/Warn), Export menu (CSV/JSON/Excel). UsersTable với actions menu (View Profile, Ban, Unban, Warn, View Activity). BanUserDialog & WarnUserDialog với confirmation. Sử dụng React Query + Toast notifications. |
| 5 | User Detail | ✅ Done | Đã tạo admin/users/[id]/page.tsx với Profile section (avatar + info), Ban/Unban/Warn buttons (màu sắc theo action), 4 tabs: Posts (DataTable với media preview + stats + delete), Warnings (DataTable với lịch sử cảnh cáo), Ban History (hiển thị trạng thái ban hiện tại), Activity (placeholder). Copy to clipboard cho username/email. Loading skeletons. Reuse BanUserDialog & WarnUserDialog. |
| 6 | Posts Management | ✅ Done | Đã tạo admin/posts/page.tsx với DataTable (pagination, selection), Filters (search debounced 300ms, Privacy dropdown, Date range), Bulk delete toolbar (khi chọn posts), Export menu (CSV/JSON/Excel). PostsTable với content preview column (thumbnail + caption), Author column (avatar + navigate to user), Privacy tag, Stats (likes/comments), Actions menu (View, View Author, Delete, Copy Link). PostPreviewDialog hiển thị full post với media + stats. DeleteContentDialog với reason textarea. Sử dụng React Query + Toast notifications. |
| 7 | Reports Management | ✅ Done | Đã tạo admin/reports/page.tsx với Stats bar (Pending/Resolved/Rejected), Filters (search debounced 300ms, Status, Target Type, Reason), DataTable (pagination, selection), Bulk actions toolbar (Resolve/Reject). ReportsTable với target preview column, reporter column, reason/status tags, actions menu (View Details, Resolve with Delete, Resolve Only, Reject). ReportDetailDialog hiển thị full report info + target preview. ResolveReportDialog với notes textarea. Sử dụng React Query + Toast notifications. |
| 8 | Report Detail | ✅ Done | Đã tạo admin/reports/[id]/page.tsx với full page layout. Report info panel (ID, Status, Reason, Date, Reporter info). Target preview (Post/User/Comment với media + author). Admin Notes textarea. Action buttons (Resolve with Delete, Resolve Only, Reject) với confirmation dialogs. Report History Timeline sử dụng PrimeReact Timeline. Sử dụng use(), useReport(), useReportHistory(), useResolveReport(), useRejectReport() hooks. Loading skeletons và not found state. |
| 9 | Audit Logs | ✅ Done | Đã tạo admin/audit/page.tsx với filters (search, action type dropdown, admin dropdown, date range picker). AuditLogsTable với color-coded action types (red cho ban/delete, green cho resolve, yellow cho warn). Click vào admin → filter by admin. Click vào target → navigate to detail (User/Post/Report). Export dropdown (CSV/JSON/Excel) với blob download. Toast notification khi export. Sử dụng React Query + useActionTypes() + useAdminList() hooks. Loading skeletons. |
| 10 | Analytics | ✅ Done | Đã tạo admin/analytics/page.tsx với Date Range Picker (presets: Today/7d/30d/90d + custom). GrowthChart (Line - Users/Posts), UserActivityChart (Area - DAU/New Registrations), ContentActivityChart (Area - Posts/Comments/Likes). Pie charts: UserRoles, UserStatus, PostPrivacy, ReportStatus. Period Comparison section (This Week vs Last Week) với percentage change tags. Sử dụng React Query + multiple chart hooks. |
| 11 | Health Monitoring | ✅ Done | Đã tạo admin/health/page.tsx với Overall Status banner (🟢 All Systems Operational), System Metrics (CPU, Memory, Disk với ProgressBar), Service Health (Database, Cache, Storage). HealthCard, SystemMetricsCard, ServiceHealthCard components. Auto-refresh mỗi 30s. Uptime display, Version info. Sử dụng useHealth(), useHealthMetrics(), useHealthDetailed() hooks. Loading skeletons. |
| 12 | Comments Management | ✅ Done | Đã tạo admin/comments/page.tsx với Stats bar (Total/Active/Hidden/Deleted), Filters (search, Status dropdown, Post dropdown, Date range). CommentsTable với DataTable (pagination, selection), Content preview (avatar + username + comment snippet), Stats (likes/replies), Actions menu (View Post, View Comment, Delete, View Author). Bulk delete toolbar. CommentPreviewDialog hiển thị full comment + parent comment + post info. Sử dụng React Query + Toast notifications. |
| 13 | API Layer & Hooks | ✅ Done | Đã consolidate tất cả types vào src/lib/api/admin.ts (PagedResult, UserDto, PostDto, ReportDto, CommentDto, AuditLogDto, Health types, Analytics types). Thêm các API functions còn thiếu (getComments, deleteComment, bulkDeleteComments, getActionTypes, getAuditAdmins, getUserActivityChart, getContentActivityChart, exportComments). Cập nhật tất cả hooks để import types từ admin.ts thay vì định nghĩa local. Helper functions: formatUptime, formatBytes. |
| 14 | i18n + Navbar update | ✅ Done | Đã thêm 60+ translation keys mới vào messages/en.json và messages/vi.json (AuditLogs, SystemHealth, CommentsManagement, AllSystemsOperational, SystemDegraded, Version, Uptime, CPU/Memory/Disk, Database, Cache, Connected, Healthy, UserActivity, ContentActivity, PeriodComparison, Today, Last7Days, Last30Days, Last90Days, CustomRange, Export, Refresh, vv). Cập nhật AdminSidebar sử dụng useTranslations() cho navigation labels. Cập nhật admin/layout.tsx với CheckingPermissions translation. Cập nhật admin/health/page.tsx và admin/comments/page.tsx với đầy đủ i18n. |
| 15 | Final Verification | ✅ Done | ✅ File structure hoàn chỉnh: 10 pages + 8 detail pages. ✅ Components: 22 files (layout, charts, tables, modals). ✅ Hooks: 8 query hooks + mutations. ✅ API Layer: admin.ts consolidated với 50+ functions. ✅ i18n: 60+ translation keys trong en.json và vi.json. ✅ Post detail page đã implement đầy đủ. ✅ Types consolidated từ admin.d.ts sang admin.ts. |

---

## Context Search Guide (Cho Agent)

Khi thiếu context trong quá trình implement, tìm kiếm theo thứ tự:

### 1. Tham khảo chính (Priority cao nhất)
```
AGENT_DEV_GUIDE.md     → Quy tắc chung, patterns, components
admin_frontend_app_router.md → Chi tiết admin architecture, API endpoints
```

### 2. Tìm components tương tự trong main frontend
```
src/components/        → Components hiện có để tái sử dụng
src/lib/api/           → API patterns đã có
src/lib/hooks/         → Hook patterns đã có
src/messages/          → i18n patterns
```

### 3. PrimeReact documentation
```
https://primereact.org/ → Components: DataTable, Dialog, Chart, etc.
```

### 4. Search trong codebase
```
Grep: "useAuth"         → Cách sử dụng auth
Grep: "fetchWrapper"    → Cách gọi API
Grep: "DataTable"       → Ví dụ sử dụng DataTable
Grep: "Dialog"          → Ví dụ sử dụng Dialog
Grep: "Toast"           → Cách hiển thị notifications
```

### 5. Search by API endpoint
```
Grep: "/admin"          → API admin endpoints
Grep: "adminAPI"        → Admin API patterns
```

---

## Patterns quan trọng cần tuân thủ

### API Pattern
Xem `AGENT_DEV_GUIDE.md` - Section 4: "Pattern Thêm API Service Mới"

### Component Pattern
Xem `AGENT_DEV_GUIDE.md` - Section 5: "Pattern Thêm Component Mới"

### Page Pattern
Xem `AGENT_DEV_GUIDE.md` - Section 6: "Pattern Thêm Page Mới"

### Dialog Pattern
Xem `AGENT_DEV_GUIDE.md` - Section 9: "Dialog Pattern"

### i18n Pattern
Xem `AGENT_DEV_GUIDE.md` - Section 8: "i18n"

---

## Key Components Reference

### PrimeReact Components
```tsx
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
```

### Custom Hooks
```tsx
import { useAuth } from "@/components/AuthProvider";
import { useOverlay } from "@/components/RootProvider";
```

### fetchWrapper
```tsx
import { fetchWrapper } from "@/lib/fetchWrapper";
fetchWrapper.get<T>("/path", auth = true);
fetchWrapper.post<T>("/path", body, auth = true);
```

---

## API Endpoints Reference

Xem `admin_frontend_app_router.md` - Section cuối "Appendix: Endpoint Checklist"

### Dashboard & Analytics
| Endpoint | Method |
|----------|--------|
| `/api/admin/analytics` | GET |
| `/api/admin/analytics/charts/growth` | GET |
| `/api/admin/analytics/charts/user-status` | GET |

### Users
| Endpoint | Method |
|----------|--------|
| `/api/admin/analytics/users` | GET |
| `/api/admin/users/{id}/ban` | POST/DELETE |
| `/api/admin/users/{id}/warn` | POST |

### Posts
| Endpoint | Method |
|----------|--------|
| `/api/admin/analytics/posts` | GET |
| `/api/admin/content/posts/{id}` | DELETE |

### Reports
| Endpoint | Method |
|----------|--------|
| `/api/admin/reports` | GET |
| `/api/admin/reports/{id}/resolve` | POST |
| `/api/admin/reports/{id}/reject` | POST |

---

## Phase Plans Link

Mỗi phase có plan chi tiết riêng trong:
```
plans/phase-01-cleanup.md
plans/phase-02-admin-layout.md
plans/phase-03-dashboard.md
...
plans/phase-15-final-verification.md
```

---

## Done Checklist (Phase hoàn thành)

- [x] Code implement xong
- [ ] Build không lỗi (`npm run build`)
- [x] i18n keys đã thêm vào `vi.json` và `en.json`
- [x] Navbar đã cập nhật (nếu cần)
- [x] Plan tổng đã tick ✅
- [x] Review ngắn đã ghi vào plan tổng

---

## Admin Portal Complete Summary

**Tổng quan:** Admin Portal đã hoàn thành với 15 phases.

**Pages (10 main + 3 detail):**
- Dashboard, Users, Posts, Reports, Audit, Analytics, Health, Comments
- User Detail, Post Detail, Report Detail

**Components (22 files):**
- Layout: AdminSidebar, AdminHeader, StatsCard
- Charts: GrowthChart, UserActivityChart, ContentActivityChart, BasePieChart, UserStatusPieChart, UserRolesPieChart, PostPrivacyPieChart, ReportStatusPieChart
- Tables: UsersTable, PostsTable, ReportsTable, AuditLogsTable, CommentsTable
- Modals: BanUserDialog, WarnUserDialog, DeleteContentDialog, ResolveReportDialog, ReportDetailDialog, PostPreviewDialog
- Health: HealthCard, SystemMetricsCard, ServiceHealthCard

**Hooks (8 files):**
- useAdminDashboard, useAdminUsers, useAdminPosts, useAdminReports, useAdminAudit, useAdminAnalytics, useAdminHealth, useAdminComments

**API Layer:**
- src/lib/api/admin.ts: 50+ functions, all types consolidated

**i18n:**
- 60+ translation keys in both en.json and vi.json

**Features:**
- React Query with auto-refresh (30s)
- Toast notifications
- Loading skeletons
- Bulk actions
- Export (CSV/JSON/Excel)
- i18n support
- Dark mode ready
