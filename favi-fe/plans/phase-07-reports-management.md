# Phase 7: Reports Management

## Mục tiêu
Implement trang Reports Management với resolve/reject actions.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/reports/page.tsx
Tạo: src/components/admin/tables/ReportsTable.tsx
Tạo: src/components/admin/modals/ResolveReportDialog.tsx
Tạo: src/components/admin/modals/ReportDetailDialog.tsx
Tạo: src/hooks/queries/useAdminReports.ts
Cập nhật: src/lib/api/admin.ts (reports APIs)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Reports"                                          │
├─────────────────────────────────────────────────────────────┤
│  Stats:  ⚠️ 12 Pending  ✅ 45 Resolved  ❌ 5 Rejected       │
├─────────────────────────────────────────────────────────────┤
│  Filters:                                                   │
│  [Search 🔍] [Status ▼] [Target Type ▼] [Date Range 📅]    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │  [✓] Target    │  Reporter  │  Reason │ Status │ Action││
│  │  ──────────────┼────────────┼─────────┼────────┼────────││
│  │  [✓] Post:...  │ @jane      │ Spam    │ Pending│ ⋮     ││
│  │  [✓] User:...  │ @bob       │ Harassment │ Pending│ ⋮  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [✓] 2 selected  →  [Resolve ✅]  [Reject ❌]               │
├─────────────────────────────────────────────────────────────┤
│  Pagination                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Stats Bar
```
⚠️ 12 Pending  ✅ 45 Resolved  ❌ 5 Rejected
```
- Màu: Pending (Yellow), Resolved (Green), Rejected (Red)

## Filters

### Search Input
- Search by: target content, reporter username

### Status Dropdown
- Options: All, Pending, Resolved, Rejected

### Target Type Dropdown
- Options: All, Post, User, Comment

### Date Range Picker
- Filter by report date

## DataTable Columns

| Column | Field | Width | Template |
|--------|-------|-------|----------|
| Checkbox | selection | 50px | - |
| Target | target | - | Preview + Type |
| Reporter | reporter | - | Avatar + username |
| Reason | reason | 120px | Tag (colored) |
| Status | status | 100px | Tag (colored) |
| Date | createdAt | 150px | Format date |
| Actions | - | 80px | Menu |

## Report Status Tags

| Status | Color | Severity |
|--------|-------|----------|
| Pending | Yellow | warning |
| Resolved | Green | success |
| Rejected | Red | danger |

## Report Reason Tags

| Reason | Color |
|--------|-------|
| Spam | Orange |
| Harassment | Red |
| Inappropriate | Red |
| Misinformation | Orange |
| Other | Gray |

## Actions Menu (⋮)

1. **View Details** → Open ReportDetailDialog
2. **Resolve with Delete** → Resolve + delete content
3. **Resolve Only** → Resolve without delete
4. **Reject** → Reject report

## ReportDetailDialog

```tsx
interface ReportDetailDialogProps {
  visible: boolean;
  onHide: () => void;
  report: ReportDto;
  onResolve: (action: ResolveAction) => void;
  onReject: () => void;
}

export default function ReportDetailDialog({ visible, onHide, report, onResolve, onReject }) {
  return (
    <Dialog header={`Report #${report.id}`} visible={visible} onHide={onHide} style={{ width: '700px' }}>
      {/* Report Info */}
      <div className="report-info">
        <p><strong>Reported by:</strong> {report.reporter.username}</p>
        <p><strong>Reason:</strong> <Tag value={report.reason} /></p>
        <p><strong>Date:</strong> {formatDate(report.createdAt)}</p>
      </div>

      {/* Target Preview */}
      <div className="target-preview">
        {report.targetType === 'post' && <PostCard post={report.targetPost} />}
        {report.targetType === 'user' && <UserAvatar user={report.targetUser} />}
        {report.targetType === 'comment' && <CommentItem comment={report.targetComment} />}
      </div>

      {/* Actions */}
      <div className="report-actions">
        <Button label="Resolve with Delete" icon="pi pi-check" onClick={() => onResolve('delete')} />
        <Button label="Resolve Only" icon="pi pi-check" className="p-button-secondary" onClick={() => onResolve('resolve')} />
        <Button label="Reject" icon="pi pi-times" severity="danger" onClick={onReject} />
      </div>
    </Dialog>
  );
}
```

## ResolveReportDialog

```tsx
interface ResolveReportDialogProps {
  visible: boolean;
  onHide: () => void;
  reportId: string;
  action: 'delete' | 'resolve';
  onConfirm: (notes: string) => void;
}
```

## API Endpoints
```typescript
// Reports list (paginated)
GET /api/admin/reports?skip=0&take=20&search=&status=&targetType=

// Get single report
GET /api/admin/reports/{id}

// Resolve report
POST /api/admin/reports/{id}/resolve { action: 'delete' | 'resolve', notes?: string }

// Reject report
POST /api/admin/reports/{id}/reject { reason?: string }

// Update status
PUT /api/admin/reports/{id}/status { status: 'pending' | 'resolved' | 'rejected' }

// Bulk actions
POST /api/admin/reports/bulk/resolve { reportIds: [] }
POST /api/admin/reports/bulk/reject { reportIds: [], reason?: string }
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
import { Textarea } from "primereact/textarea";
```

## UX Features
- [ ] Badge colors theo status
- [ ] Priority sorting (Pending trước)
- [ ] Bulk actions với checkboxes
- [ ] Keyboard: `R` = Resolve, `X` = Reject
- [ ] Confirmation dialogs
- [ ] Toast notifications
- [ ] Stats bar với live counts

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Reports Management"
admin_frontend_app_router.md → "Report Detail Modal" section
AGENT_DEV_GUIDE.md → Section 9: "Dialog Pattern"
```

## Output
- admin/reports/page.tsx
- ReportsTable.tsx
- ReportDetailDialog.tsx
- ResolveReportDialog.tsx
- useAdminReports hook
- API functions

## Tick ✅ khi hoàn thành
- [ ] Stats bar (Pending/Resolved/Rejected counts)
- [ ] DataTable với status/reason tags
- [ ] Report detail modal
- [ ] Resolve with delete / Resolve only actions
- [ ] Reject action
- [ ] Bulk actions
- [ ] Keyboard shortcuts (R, X)
