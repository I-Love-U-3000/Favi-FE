# Phase 11: Health Monitoring

## Mục tiêu
Implement trang System Health monitoring với metrics và services status.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/health/page.tsx
Tạo: src/components/admin/charts/SystemMetricsChart.tsx
Tạo: src/hooks/queries/useAdminHealth.ts
Cập nhật: src/lib/api/admin.ts (health APIs)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "System Health" + Refresh button [🔄]              │
├─────────────────────────────────────────────────────────────┤
│  Status: 🟢 All Systems Operational                         │
│  Last checked: 2 minutes ago                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  System Metrics     │  │  Database           │          │
│  │  ────────────────   │  │  ────────────────   │          │
│  │  CPU: 45%          │  │  Status: 🟢 Healthy │          │
│  │  Memory: 2.4 GB    │  │  Response: 12ms     │          │
│  │  Uptime: 5d 3h     │  │  Connections: 23    │          │
│  │  Threads: 45       │  │                     │          │
│  │  Handles: 1,234    │  └─────────────────────┘          │
│  └─────────────────────┘                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Service Health                                    │   │
│  │  ┌──────────────┬──────────────┬──────────────┐   │   │
│  │  │  🟢 Database │  🟢 Cache    │  🟢 Storage  │   │   │
│  │  │  Response:   │  Status:     │  Status:     │   │   │
│  │  │  12ms        │  Connected   │  Available   │   │   │
│  │  └──────────────┴──────────────┴──────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  GC Statistics (nếu có JVM)                         │   │
│  │  Gen0: 1,234  Gen1: 456  Gen2: 89                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Status Overview

### Overall Status
- 🟢 **Healthy** - All Systems Operational
- 🟡 **Degraded** - Some issues detected
- 🔴 **Unhealthy** - Critical issues

### Last Checked
- Timestamp của lần refresh cuối
- Auto-refresh indicator

## System Metrics Card

| Metric | Description |
|--------|-------------|
| CPU | CPU usage percentage |
| Memory | Memory usage (GB/MB) |
| Uptime | System uptime (days, hours) |
| Threads | Active threads count |
| Handles | Open handles count |

## Database Card

| Metric | Description |
|--------|-------------|
| Status | 🟢 Healthy / 🟡 Degraded / 🔴 Unhealthy |
| Response | Average response time (ms) |
| Connections | Active connections count |
| Pool Size | Connection pool size |

## Services Grid

### Services to monitor
| Service | Status Indicator |
|---------|-----------------|
| Database | Connection status, response time |
| Cache | Redis/cache status |
| Storage | Disk/S3 status |
| Queue | Message queue status |
| External APIs | Third-party integrations |

### Status Indicators
- 🟢 **Healthy** - Service hoạt động bình thường
- 🟡 **Degraded** - Service hoạt động nhưng có vấn đề
- 🔴 **Unhealthy** - Service không phản hồi

## Refresh Behavior

### Auto-refresh
- Interval: 30 seconds
- Toggle on/off switch
- Progress indicator

### Manual refresh
- Refresh button với loading state
- Last refreshed timestamp

## API Endpoints
```typescript
// Health check tổng thể
GET /api/admin/health

// System metrics
GET /api/admin/health/metrics

// Detailed health + services
GET /api/admin/health/detailed

// Services status
GET /api/admin/health/services

// Historical data (optional)
GET /api/admin/health/history
```

## PrimeReact components
```tsx
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { ToggleButton } from "primereact/togglebutton";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
```

## UX Features
- [ ] Auto-refresh mỗi 30 giây
- [ ] Manual refresh button với loading
- [ ] Status badges với màu sắc
- [ ] Progress bar cho metrics
- [ ] Historical trends (nếu có data)
- [ ] Alert configuration (optional)
- [ ] Sound notification khi status chuyển đổi (optional)
- [ ] Dark mode support

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Health Monitoring"
AGENT_DEV_GUIDE.md → Section 5: "Pattern Thêm Component Mới"
src/lib/api/ → Xem existing API patterns
```

## Output
- admin/health/page.tsx
- SystemMetricsChart.tsx (optional)
- useAdminHealth hook
- API functions

## Tick ✅ khi hoàn thành
- [ ] Overall status display
- [ ] System metrics card
- [ ] Database card
- [ ] Services status grid
- [ ] Auto-refresh (30s interval)
- [ ] Manual refresh button
- [ ] Loading states (skeleton)
- [ ] Status color coding
