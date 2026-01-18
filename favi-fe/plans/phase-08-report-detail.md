# Phase 8: Report Detail

## Mục tiêu
Implement trang chi tiết report (full page thay vì modal).

## Files cần tạo
```
Tạo: src/app/[locale]/admin/reports/[id]/page.tsx
Tạo: src/hooks/queries/useAdminReport.ts
Cập nhật: src/lib/api/admin.ts (getReportDetail API)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Reports                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  Report Info    │  │  Target Preview                 │   │
│  │  ─────────────  │  │  ────────────────────────────   │   │
│  │  ID: #12345     │  │  │  PostCard or UserAvatar    │   │   │
│  │  Status: ⚠️     │  │  │                             │   │   │
│  │  Pending        │  │  └─────────────────────────────┘   │   │
│  │                 │  │                                   │   │
│  │  Reported by:   │  │  Reporter Info                   │   │
│  │  @jane • 2h ago │  │  ────────────────────────────   │   │
│  │                 │  │  Avatar + username + profile    │   │
│  │  Reason: Spam   │  │                                   │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Actions:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Resolve with Delete ✅]  [Resolve Only 📝]        │   │
│  │  [Reject Report ❌]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Notes:                                                     │
│  [Textarea cho ghi chú của admin...]                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Report History / Timeline                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📅 Created: Jan 10, 2024 10:30 AM                   │   │
│  │  📝 Status changed to: Pending                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Left Panel: Report Info

| Field | Source |
|-------|--------|
| Report ID | report.id |
| Status | report.status (Tag theo màu) |
| Created At | report.createdAt |
| Reported By | report.reporter (avatar + username + date) |
| Reason | report.reason (Tag theo loại vi phạm) |
| Description | report.description (nếu có) |

## Right Panel: Target Preview

### Nếu target là Post
- Hiển thị PostCard với đầy đủ content, media, stats

### Nếu target là User
- Hiển thị User profile card

### Nếu target là Comment
- Hiển thị CommentItem với context

## Reporter Section
- Avatar
- Username (link to admin/users/[id])
- Report date

## Action Buttons

### Primary Actions
1. **Resolve with Delete** - Xóa content + resolve report
2. **Resolve Only** - Chỉ resolve, không xóa content
3. **Reject Report** - Từ chối báo cáo

### Secondary
- Notes textarea cho admin ghi chú

## Report History/Timeline
- List các thay đổi trạng thái
- Ai đã thực hiện action nào
- Thời gian

## API Endpoints
```typescript
// Get report details
GET /api/admin/reports/{id}

// Resolve report
POST /api/admin/reports/{id}/resolve { action, notes }

// Reject report
POST /api/admin/reports/{id}/reject { reason, notes }

// Get report history/timeline
GET /api/admin/reports/{id}/history
```

## PrimeReact components
```tsx
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Textarea } from "primereact/textarea";
import { Timeline } from "primereact/timeline";
import { Divider } from "primereact/divider";
```

## UX Features
- [ ] Full page layout thay vì modal
- [ ] Clear action buttons với màu sắc
- [ ] Notes field cho admin
- [ ] Timeline của report history
- [ ] Back button với breadcrumb
- [ ] Loading skeleton
- [ ] Confirmation dialogs cho destructive actions

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Report Detail"
AGENT_DEV_GUIDE.md → Section 6: "Pattern Thêm Page Mới"
src/components/ → Xem PostCard, UserAvatar patterns
```

## Output
- admin/reports/[id]/page.tsx
- useAdminReport hook
- API functions

## Tick ✅ khi hoàn thành
- [ ] Report info panel
- [ ] Target preview (Post/User/Comment)
- [ ] Reporter info
- [ ] Action buttons với confirmation
- [ ] Notes textarea
- [ ] Report timeline/history
- [ ] Loading states
