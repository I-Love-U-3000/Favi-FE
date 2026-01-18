# Phase 10: Analytics

## Mục tiêu
Implement trang Analytics với charts và visualizations.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/analytics/page.tsx
Tạo: src/components/admin/charts/UserActivityChart.tsx
Tạo: src/components/admin/charts/ContentActivityChart.tsx
Tạo: src/components/admin/charts/UserRolePieChart.tsx
Tạo: src/components/admin/charts/PostPrivacyPieChart.tsx
Tạo: src/components/admin/charts/ReportStatusPieChart.tsx
Tạo: src/hooks/queries/useAdminAnalytics.ts
Cập nhật: src/lib/api/admin.ts (analytics APIs)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Analytics" + Date Range Picker                    │
├─────────────────────────────────────────────────────────────┤
│  [Growth] [User Activity] [Content Activity] [Distributions]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Row 1:                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  Growth Chart       │  │  User Activity      │          │
│  │  (Line Chart)       │  │  (Area Chart)       │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  Row 2:                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  User      │  │  User      │  │  Post      │            │
│  │  Roles     │  │  Status    │  │  Privacy   │            │
│  │  (Pie)     │  │  (Pie)     │  │  (Pie)     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                             │
│  Row 3:                                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Period Comparison: This Week vs Last Week          │    │
│  │  📈 Users: +12%  📈 Posts: +8%  📉 Reports: -5%     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Date Range Picker
- Presets: Today, 7d, 30d, 90d, Custom
- Ảnh hưởng đến tất cả charts

## Charts

### 1. Growth Chart (Line)
- **Type**: Line Chart
- **Data**: Users và Posts over time
- **API**: `/api/admin/analytics/charts/growth`
- **X-axis**: Time
- **Y-axis**: Count
- **Series**: Users, Posts

### 2. User Activity Chart (Area)
- **Type**: Area Chart
- **Data**: Daily active users, new registrations
- **API**: `/api/admin/analytics/charts/user-activity`
- **X-axis**: Time
- **Y-axis**: Count
- **Series**: DAU, New Registrations

### 3. Content Activity Chart (Area)
- **Type**: Area Chart
- **Data**: Posts created, Comments, Likes
- **API**: `/api/admin/analytics/charts/content-activity`
- **X-axis**: Time
- **Y-axis**: Count
- **Series**: Posts, Comments, Likes

### 4. User Role Pie Chart
- **Type**: Doughnut/Pie Chart
- **Data**: Distribution of user roles
- **API**: `/api/admin/analytics/charts/user-roles`
- **Segments**: Admin, User, etc.

### 5. User Status Pie Chart
- **Type**: Doughnut/Pie Chart
- **Data**: Distribution of user statuses
- **API**: `/api/admin/analytics/charts/user-status`
- **Segments**: Active, Banned, Inactive

### 6. Post Privacy Pie Chart
- **Type**: Doughnut/Pie Chart
- **Data**: Distribution of post privacy settings
- **API**: `/api/admin/analytics/charts/post-privacy`
- **Segments**: Public, Private, Followers

### 7. Report Status Pie Chart
- **Type**: Doughnut/Pie Chart
- **Data**: Distribution of report statuses
- **API**: `/api/admin/analytics/charts/report-status`
- **Segments**: Pending, Resolved, Rejected

## Period Comparison

### This Week vs Last Week
```tsx
const comparison = {
  users: { current: 150, previous: 134, change: +12 },
  posts: { current: 500, previous: 463, change: +8 },
  reports: { current: 45, previous: 47, change: -5 }
};
```

**Display**:
```
📈 Users: +12%  📈 Posts: +8%  📉 Reports: -5%
```

## Chart Configuration

### PrimeReact Chart Options
```tsx
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    }
  }
};
```

## Export Features

### Export chart as PNG
```tsx
<Button label="Export" icon="pi pi-download" onClick={exportChart} />
```

## API Endpoints
```typescript
// Growth chart data
GET /api/admin/analytics/charts/growth?startDate=&endDate=

// User activity chart
GET /api/admin/analytics/charts/user-activity?startDate=&endDate=

// Content activity chart
GET /api/admin/analytics/charts/content-activity?startDate=&endDate=

// User roles pie
GET /api/admin/analytics/charts/user-roles

// User status pie
GET /api/admin/analytics/charts/user-status

// Post privacy pie
GET /api/admin/analytics/charts/post-privacy

// Report status pie
GET /api/admin/analytics/charts/report-status

// Period comparison
GET /api/admin/analytics/comparison?period=week|month
```

## PrimeReact components
```tsx
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
```

## UX Features
- [ ] Chart legends tương tác (click để ẩn/hiện series)
- [ ] Tooltip chi tiết khi hover
- [ ] Export chart as PNG
- [ ] Responsive grid layout
- [ ] Skeleton loading
- [ ] Auto-refresh khi date range thay đổi
- [ ] Color consistency

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Analytics"
PrimeReact Chart: https://primereact.org/chart/
AGENT_DEV_GUIDE.md → Tham khảo PrimeReact imports
```

## Output
- admin/analytics/page.tsx
- UserActivityChart.tsx
- ContentActivityChart.tsx
- UserRolePieChart.tsx
- PostPrivacyPieChart.tsx
- ReportStatusPieChart.tsx
- useAdminAnalytics hook
- API functions

## Tick ✅ khi hoàn thành
- [ ] Growth chart (Line)
- [ ] User activity chart (Area)
- [ ] Content activity chart (Area)
- [ ] User roles pie chart
- [ ] User status pie chart
- [ ] Post privacy pie chart
- [ ] Report status pie chart
- [ ] Period comparison section
- [ ] Export PNG functionality
- [ ] Date range picker works
