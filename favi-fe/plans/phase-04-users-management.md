# Phase 4: Users Management

## Mục tiêu
Implement trang Users Management với DataTable, filters, và bulk actions.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/users/page.tsx
Tạo: src/components/admin/tables/UsersTable.tsx
Tạo: src/components/admin/modals/BanUserDialog.tsx
Tạo: src/components/admin/modals/WarnUserDialog.tsx
Tạo: src/hooks/queries/useAdminUsers.ts
Cập nhật: src/lib/api/admin.ts (users APIs)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Users"                                            │
├─────────────────────────────────────────────────────────────┤
│  Filters:                                                   │
│  [Search 🔍] [Role ▼] [Status ▼] [Date Range 📅] [Reset]   │
├─────────────────────────────────────────────────────────────┤
│  ┌── Select All ─────────────────────────────────────────┐  │
│  │  [✓] Username     │  Email  │  Role │ Status │ Actions│  │
│  │  ────────────────┼─────────┼───────┼────────┼────────│  │
│  │  [✓] @john_doe   │ john@.. │ User  │ Active │ ⋮      │  │
│  │  [✓] @jane_smith │ jane@.. │ Admin │ Active │ ⋮      │  │
│  │  [ ] @bob_wilson │ bob@..  │ User  │ Banned │ ⋮      │  │
│  │  ...                                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  [✓] 3 selected  →  [Ban]  [Unban]  [Warn]  [Export 📥]    │
├─────────────────────────────────────────────────────────────┤
│  [◀ Prev] Page 1 of 50 [Next ▶]   Showing 1-20 of 1,234    │
└─────────────────────────────────────────────────────────────┘
```

## Filters

### Search Input
- Debounced: 300ms
- Search by: username, email, display name

### Role Dropdown
- Options: All, User, Admin

### Status Dropdown
- Options: All, Active, Banned, Inactive

### Date Range Picker
- Filter by registration date

## DataTable Columns

| Column | Field | Width | Template |
|--------|-------|-------|----------|
| Checkbox | selection | 50px | - |
| User | username, avatar, email | - | Custom |
| Role | role | 100px | Tag |
| Status | status | 100px | Tag |
| Actions | - | 80px | Menu |

## Actions Menu (⋮)

### Menu items
1. **View Profile** → Navigate to `/admin/users/{id}`
2. **Ban User** → Open BanUserDialog
3. **Unban User** → Confirm dialog
4. **Warn User** → Open WarnUserDialog
5. **View Activity** → Popover với stats

## Bulk Actions

### Toolbar khi có selected
```
[✓] 3 selected
[Ban] [Unban] [Warn] [Export 📥]
```

### Ban/Unban/Warn dialogs
- Single: Individual dialog
- Bulk: Confirmation dialog

## BanUserDialog

```tsx
interface BanUserDialogProps {
  visible: boolean;
  onHide: () => void;
  userId: string;
  onBan: (reason: string) => void;
}

export default function BanUserDialog({ visible, onHide, userId, onBan }) {
  const [reason, setReason] = useState("");

  return (
    <Dialog header="Ban User" visible={visible} onHide={onHide}>
      <InputText value={reason} onChange={(e) => setReason(e.target.value)} />
      <Button label="Ban" onClick={() => onBan(reason)} />
    </Dialog>
  );
}
```

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Users Management"
admin_frontend_app_router.md → Section "API Integration Layer"
AGENT_DEV_GUIDE.md → Section 9: "Dialog Pattern"
AGENT_DEV_GUIDE.md → Section 5: "Pattern Thêm Component Mới"
src/components/ → Xem existing components patterns
```

## API Endpoints
```typescript
// Users list (paginated)
GET /api/admin/analytics/users?skip=0&take=20&search=&role=&status=

// Ban user
POST /api/admin/users/{id}/ban { reason: string }

// Unban user
DELETE /api/admin/users/{id}/ban

// Warn user
POST /api/admin/users/{id}/warn { reason: string }

// Bulk actions
POST /api/admin/users/bulk/ban { userIds: [] }
POST /api/admin/users/bulk/unban { userIds: [] }
POST /api/admin/users/bulk/warn { userIds: [], reason: string }

// Export
GET /api/admin/export/users
```

## PrimeReact components
```tsx
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
```

## UX Features
- [ ] Search debounced (300ms)
- [ ] Bulk selection với "Select All" checkbox
- [ ] Confirmation dialog cho destructive actions
- [ ] Toast notifications cho thành công/lỗi
- [ ] Keyboard shortcuts (Ctrl+F focus search, Esc close modal)
- [ ] Empty state illustration
- [ ] Pagination với page size selector

## Output
- admin/users/page.tsx
- UsersTable.tsx
- BanUserDialog.tsx
- WarnUserDialog.tsx
- useAdminUsers hook
- API functions trong admin.ts

## Tick ✅ khi hoàn thành
- [ ] DataTable với pagination
- [ ] Filters (search, role, status, date)
- [ ] Bulk actions toolbar
- [ ] Ban/Unban/Warn dialogs
- [ ] Actions menu (view profile, etc.)
- [ ] Toast notifications
- [ ] Export functionality
