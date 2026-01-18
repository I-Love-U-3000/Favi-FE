# Phase 9: Audit Logs

## Mục tiêu
Implement trang Audit Logs với filtering và export.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/audit/page.tsx
Tạo: src/components/admin/tables/AuditLogsTable.tsx
Tạo: src/hooks/queries/useAdminAudit.ts
Cập nhật: src/lib/api/admin.ts (audit APIs)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Audit Logs"                                       │
├─────────────────────────────────────────────────────────────┤
│  Filters:                                                   │
│  [Search 🔍] [Action Type ▼] [Admin ▼] [Date Range 📅]     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Timestamp      │  Admin  │  Action   │  Target │ Details││
│  │  ───────────────┼─────────┼───────────┼─────────┼────────││
│  │  Jan 10, 14:30  │ @admin1 │ Ban User  │ @john   │ Spam   ││
│  │  Jan 10, 13:15  │ @admin1 │ Resolve   │ Report# │ ...    ││
│  │  Jan 10, 12:00  │ @admin2 │ Delete    │ Post    │ Spam   ││
│  │  Jan 10, 11:45  │ @admin2 │ Warn User │ @jane   │ ...    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Export CSV] [Export JSON]                                 │
├─────────────────────────────────────────────────────────────┤
│  Pagination                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Filters

### Search Input
- Search by: admin username, target username, details

### Action Type Dropdown
- Options: All, Ban User, Unban User, Warn User, Delete Content, Resolve Report, Reject Report, Export Data

### Admin Dropdown
- Options: All + list of admins

### Date Range Picker
- Filter by action date

## DataTable Columns

| Column | Field | Template |
|--------|-------|----------|
| Timestamp | createdAt | Format: "Jan 10, 2024 14:30" |
| Admin | admin | Avatar + username (click to filter) |
| Action | actionType | Color-coded Tag |
| Target | target | Username/ID (click to view) |
| Details | details | Text snippet |

## Action Type Colors

| Action | Color | Icon |
|--------|-------|------|
| Ban User | 🔴 Red | pi pi-ban |
| Unban User | 🟢 Green | pi pi-check |
| Warn User | 🟡 Yellow | pi pi-exclamation-triangle |
| Delete Content | 🔴 Red | pi pi-trash |
| Resolve Report | 🟢 Green | pi pi-check-circle |
| Reject Report | 🟠 Orange | pi pi-times-circle |
| Export Data | 🔵 Blue | pi pi-download |

## Export Options

### Export dropdown menu
1. **Export CSV** - Download CSV file
2. **Export JSON** - Download JSON file
3. **Export Excel** - Download Excel file (optional)

### Export API
```typescript
GET /api/admin/export/audit-logs?format=csv&filters=...
```

## Click Behaviors

### Admin column
- Click on admin → Filter by this admin
- Show tooltip với admin info

### Target column
- Click on target → Navigate to detail page
  - User → /admin/users/{id}
  - Post → /admin/posts/{id}
  - Report → /admin/reports/{id}

## API Endpoints
```typescript
// Audit logs list (paginated)
GET /api/admin/audit?skip=0&take=20&search=&actionType=&adminId=

// Get action types for filter
GET /api/admin/audit/action-types

// Get admins for filter
GET /api/admin/audit/admins

// Export audit logs
GET /api/admin/export/audit-logs?format=csv|json|xlsx
```

## PrimeReact components
```tsx
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Calendar } from "primereact/calendar";
import { Menu } from "primereact/menu";
```

## UX Features
- [ ] Color-coded action types
- [ ] Click to filter by admin
- [ ] Click to view target details
- [ ] Relative time (5 minutes ago) in tooltip
- [ ] Export dropdown
- [ ] Toast notification khi export hoàn tất
- [ ] Empty state với illustration
- [ ] Pagination với page size

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Audit Logs"
AGENT_DEV_GUIDE.md → Section 4: "Pattern Thêm API Service Mới"
src/lib/api/ → Xem existing API patterns
```

## Output
- admin/audit/page.tsx
- AuditLogsTable.tsx
- useAdminAudit hook
- API functions

## Tick ✅ khi hoàn thành
- [ ] DataTable với color-coded actions
- [ ] Filters (search, action type, admin, date)
- [ ] Export CSV/JSON functionality
- [ ] Click behaviors (filter by admin, view target)
- [ ] Toast notifications
- [ ] Loading states
