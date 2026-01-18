# Phase 3: Dashboard

## Mục tiêu
Implement trang Dashboard với stats cards, charts, và top lists.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/page.tsx
Tạo: src/components/admin/layout/StatsCard.tsx
Tạo: src/components/admin/charts/GrowthChart.tsx
Tạo: src/components/admin/charts/UserStatusPieChart.tsx
Tạo: src/hooks/queries/useAdminDashboard.ts
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Dashboard" + Date Range Picker                    │
├──────────────┬──────────────┬──────────────┬──────────────┤
│  Stats Card  │  Stats Card  │  Stats Card  │  Stats Card  │
│  👥 Users    │  📝 Posts    │  ⚠️ Reports  │  🚫 Banned   │
│  1,234       │  5,678       │  12 pending  │  23          │
├──────────────┴──────────────┴──────────────┴──────────────┤
│  Growth Chart (Line)                                      │
│  ┌──────────────────────────────────────────────┐         │
│  │    📈 Users vs Posts over time               │         │
│  └──────────────────────────────────────────────┘         │
├──────────────────────────┬───────────────────────────────┤
│  User Status (Pie)       │  Top Users (List)             │
│  ┌──────────────┐        │  1. @john +200 reactions      │
│  │  Active 85%  │        │  2. @jane +150 reactions      │
│  │  Banned 5%   │        │  3. @bob +120 reactions       │
│  │  Inactive10% │        │                               │
│  └──────────────┘        └───────────────────────────────┘
├──────────────────────────┴───────────────────────────────┤
│  Top Posts (List)                                        │
│  1. "Amazing sunset..." ❤️ 500  💬 45                    │
│  2. "My new project..." ❤️ 320  💬 28                    │
└─────────────────────────────────────────────────────────────┘
```

## Stats Cards (4 cards)

### Card 1: Users
- API: `GET /api/admin/analytics`
- Icon: `pi pi-users`
- Value: Total users count
- Subtext: Active/Banned breakdown

### Card 2: Posts
- API: `GET /api/admin/analytics`
- Icon: `pi pi-file`
- Value: Total posts count
- Subtext: Today's posts

### Card 3: Reports
- API: `GET /api/admin/analytics`
- Icon: `pi pi-flag`
- Value: Pending reports count
- Color: Yellow (warning)

### Card 4: Banned
- API: `GET /api/admin/analytics`
- Icon: `pi pi-ban`
- Value: Banned users count
- Color: Red (danger)

## Charts

### GrowthChart (Line)
- API: `GET /api/admin/analytics/charts/growth`
- Type: Line chart
- Series: Users, Posts over time

### UserStatusPieChart (Pie)
- API: `GET /api/admin/analytics/charts/user-status`
- Type: Pie/Doughnut chart
- Segments: Active, Banned, Inactive

### Top Users List
- API: `GET /api/admin/analytics/top-users?limit=5`
- Display: Avatar + username + engagement stats

### Top Posts List
- API: `GET /api/admin/analytics/top-posts?limit=5`
- Display: Content preview + ❤️ + 💬 counts

## UX Features

### Auto-refresh
- Interval: 30 seconds
- Có thể toggle on/off

### Date Range Picker
- Presets: Today, 7d, 30d, 90d
- Custom range picker

### Loading States
- Skeleton loaders cho cards
- Shimmer effects cho charts

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Dashboard Overview"
AGENT_DEV_GUIDE.md → Section 4: API patterns
src/lib/api/ → Xem existing API patterns
PrimeReact Chart: https://primereact.org/chart/
```

## API Endpoints
```typescript
// Dashboard stats
GET /api/admin/analytics

// Growth chart data
GET /api/admin/analytics/charts/growth

// User status pie chart
GET /api/admin/analytics/charts/user-status

// Top users
GET /api/admin/analytics/top-users?limit=5

// Top posts
GET /api/admin/analytics/top-posts?limit=5
```

## PrimeReact components
```tsx
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
```

## Output
- admin/page.tsx (Dashboard page)
- StatsCard component
- GrowthChart component
- UserStatusPieChart component
- useAdminDashboard hook

## Tick ✅ khi hoàn thành
- [ ] 4 Stats cards hiển thị đúng
- [ ] Growth chart với dữ liệu real
- [ ] User status pie chart
- [ ] Top users và top posts lists
- [ ] Date range picker hoạt động
- [ ] Auto-refresh mỗi 30s
- [ ] Loading states (skeleton)
