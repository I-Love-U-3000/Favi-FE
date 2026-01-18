# Phase 12: Comments Management

## Mục tiêu
Implement trang Comments Management với preview và delete actions.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/comments/page.tsx
Tạo: src/components/admin/tables/CommentsTable.tsx
Tạo: src/components/admin/modals/CommentPreviewDialog.tsx
Tạo: src/hooks/queries/useAdminComments.ts
Cập nhật: src/lib/api/admin.ts (comments APIs)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Comments Management"                               │
├─────────────────────────────────────────────────────────────┤
│  Filters:                                                   │
│  [Search 🔍] [Post 🔗] [Date Range 📅] [Status ▼]           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │  [✓] Content        │  Author  │  Post │ Date │ Actions││
│  │  ───────────────────┼──────────┼───────┼──────┼────────││
│  │  [✓] "Spam comment" │ @spammer │ Post# │ 2h   │ ⋮     ││
│  │  [✓] "Bad content..."│ @troll  │ Post# │ 5h   │ ⋮     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [✓] 2 selected  →  [Delete 🗑️]                             │
├─────────────────────────────────────────────────────────────┤
│  Pagination                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Filters

### Search Input
- Search by: comment content, author username

### Post Link Filter
- Input hoặc Dropdown để chọn post
- Filter comments thuộc về post cụ thể

### Date Range Picker
- Filter by comment date

### Status Filter (optional)
- Options: All, Active, Deleted

## DataTable Columns

| Column | Field | Template |
|--------|-------|----------|
| Checkbox | selection | - |
| Content | content | Preview + "View more" |
| Author | author | Avatar + username |
| Post | post | Link to post |
| Date | createdAt | Relative time |
| Actions | - | Menu |

## Comment Preview Column

### Display
```
┌─────────────────────────────────────────┐
│ "This is a spam comment that should be  │
│  deleted. Click to view full..."        │
│ 📅 2 hours ago                          │
└─────────────────────────────────────────┘
```

### Click behavior
- Click để mở CommentPreviewDialog

## Actions Menu (⋮)

1. **View Post** → Navigate to post (hoặc mở trong modal)
2. **View Comment** → Open CommentPreviewDialog
3. **Delete Comment** → Open DeleteContentDialog
4. **View Reporter** → Xem người report (nếu có từ reports)

## CommentPreviewDialog

```tsx
interface CommentPreviewDialogProps {
  visible: boolean;
  onHide: () => void;
  comment: CommentDto;
}

export default function CommentPreviewDialog({ visible, onHide, comment }) {
  return (
    <Dialog header="Comment Preview" visible={visible} onHide={onHide} style={{ width: '600px' }}>
      {/* Comment Content */}
      <div className="comment-content">
        <div className="comment-header">
          <Avatar image={comment.author.avatar} />
          <span className="author-name">{comment.author.username}</span>
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
        </div>
        <div className="comment-body">
          {comment.content}
        </div>
      </div>

      {/* Parent Comment (nếu là reply) */}
      {comment.parentComment && (
        <div className="parent-comment">
          <p className="parent-label">Replying to:</p>
          <div className="parent-content">
            {comment.parentComment.content}
          </div>
        </div>
      )}

      {/* Post Context */}
      <div className="post-context">
        <p className="context-label">Post:</p>
        <div className="post-preview">
          {comment.post.caption}
        </div>
      </div>

      {/* Actions */}
      <div className="dialog-actions">
        <Button label="Delete" severity="danger" icon="pi pi-trash" />
        <Button label="Close" className="p-button-secondary" onClick={onHide} />
      </div>
    </Dialog>
  );
}
```

## API Endpoints
```typescript
// Comments list (paginated)
GET /api/admin/analytics/comments?skip=0&take=20&search=&postId=

// Delete comment
DELETE /api/admin/content/comments/{id} { reason?: string }

// Bulk delete comments
POST /api/admin/content/comments/bulk/delete { commentIds: [], reason?: string }

// Get comments by post
GET /api/posts/{postId}/comments

// Reports about comments
GET /api/admin/reports/target-type/comment
```

## PrimeReact components
```tsx
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Menu } from "primereact/menu";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Calendar } from "primereact/calendar";
import { Textarea } from "primereact/textarea";
```

## UX Features
- [ ] Content preview trong table
- [ ] Parent comment display (nếu là reply)
- [ ] Post context display
- [ ] Delete confirmation
- [ ] Bulk delete actions
- [ ] Toast notifications
- [ ] Loading states

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Comments Management"
AGENT_DEV_GUIDE.md → Section 9: "Dialog Pattern"
src/components/ → Xem CommentItem patterns
```

## Output
- admin/comments/page.tsx
- CommentsTable.tsx
- CommentPreviewDialog.tsx
- useAdminComments hook
- API functions

## Tick ✅ khi hoàn thành
- [ ] DataTable với content preview
- [ ] Filters (search, post link, date)
- [ ] Comment preview modal
- [ ] Parent comment display
- [ ] Post context
- [ ] Delete action
- [ ] Bulk delete
- [ ] Toast notifications
