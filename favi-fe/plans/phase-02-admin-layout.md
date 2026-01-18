# Phase 2: AdminLayout (Sidebar + Header)

## Mục tiêu
Implement AdminLayout với Sidebar và Header chuẩn UX.

## Files cần tạo/sửa
```
Tạo: src/components/admin/layout/AdminSidebar.tsx
Tạo: src/components/admin/layout/AdminHeader.tsx
Tạo: src/app/[locale]/admin/layout.tsx
Sửa: src/components/Navbar.tsx (thêm admin menu)
```

## AdminSidebar requirements

### Navigation items
```tsx
const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "pi pi-home" },
  { label: "Users", href: "/admin/users", icon: "pi pi-users" },
  { label: "Posts", href: "/admin/posts", icon: "pi pi-file" },
  { label: "Reports", href: "/admin/reports", icon: "pi pi-flag", badge: pendingCount },
  { label: "Audit", href: "/admin/audit", icon: "pi pi-history" },
  { label: "Analytics", href: "/admin/analytics", icon: "pi pi-chart-bar" },
  { label: "Health", href: "/admin/health", icon: "pi pi-heart" },
  { label: "Comments", href: "/admin/comments", icon: "pi pi-comments" },
];
```

### Features
- Logo/Brand area
- Active state highlighting (dựa trên current path)
- Badge hiển thị số reports pending (có thể lấy từ API hoặc mock tạm)
- Collapsible (responsive)
- Logout button

### PrimeReact components
```tsx
import { Menu } from "primereact/menu";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
```

## AdminHeader requirements

### Components
```tsx
<Breadcrumb />          // Với items từ current path
<Search global />       // Ctrl+K to focus
<Notifications />       // Dropdown với notification items
<UserMenu />            // Avatar + dropdown menu
```

### Features
- Breadcrumb navigation
- Global search (Ctrl+K shortcut)
- Notifications bell với dropdown
- User profile menu (avatar + logout)

### PrimeReact components
```tsx
import { Breadcrumb } from "primereact/breadcrumb";
import { InputText } from "primereact/inputtext";
import { Badge } from "primereact/badge";
import { Avatar } from "primereact/avatar";
import { Menu } from "primereact/menu";
```

## AdminLayout (page.tsx)

### Structure
```tsx
<AdminLayout>
  <div className="admin-content">
    {children}
  </div>
</AdminLayout>
```

### CSS
```css
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 260px;
  fixed left top;
}

.admin-header {
  height: 60px;
  fixed top left right;
  margin-left: 260px;
}

.admin-content {
  flex: 1;
  margin-left: 260px;
  margin-top: 60px;
  padding: 24px;
}
```

### Auth check
- Check `isAdmin` từ `useAuth()`
- Redirect về login nếu không phải admin

## Context Search khi cần
```
AGENT_DEV_GUIDE.md → Section 3: "fetchWrapper"
AGENT_DEV_GUIDE.md → Section 2: "Custom Hooks" (useAuth, useOverlay)
AGENT_DEV_GUIDE.md → Section 7: "Navigation"
admin_frontend_app_router.md → "Layout Components" section
src/components/Navbar.tsx → Tham khảo cách implement navigation hiện tại
```

## Tham khảo existing code
```bash
# Xem Navbar hiện tại
cat src/components/Navbar.tsx

# Xem AuthProvider
cat src/components/AuthProvider.tsx
```

## Output
- AdminSidebar.tsx
- AdminHeader.tsx
- admin/layout.tsx

## Tick ✅ khi hoàn thành
- [ ] AdminSidebar với navigation items
- [ ] AdminHeader với breadcrumb, search, notifications
- [ ] AdminLayout wrapper với auth check
- [ ] Responsive (sidebar có thể collapse trên mobile)
