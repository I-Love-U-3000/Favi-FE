# Phase 6: Posts Management

## Mục tiêu
Implement trang Posts Management với content preview và delete actions.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/posts/page.tsx
Tạo: src/components/admin/tables/PostsTable.tsx
Tạo: src/components/admin/modals/DeleteContentDialog.tsx
Tạo: src/components/admin/modals/PostPreviewDialog.tsx
Tạo: src/hooks/queries/useAdminPosts.ts
Cập nhật: src/lib/api/admin.ts (posts APIs)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Posts"                                            │
├─────────────────────────────────────────────────────────────┤
│  Filters:                                                   │
│  [Search 🔍] [Privacy ▼] [Date Range 📅] [Status ▼]        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │  [✓]  Content    │  Author  │  Privacy │ Stats │ Actions││
│  │  ────────────────┼──────────┼──────────┼───────┼────────││
│  │  [✓] "Sunset..." │ @john    │ Public   │ ❤️ 500│ ⋮      ││
│  │  [✓] "My project"│ @jane    │ Private  │ ❤️ 50 │ ⋮      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [✓] 2 selected  →  [Delete 🗑️]  [Export 📥]               │
├─────────────────────────────────────────────────────────────┤
│  [◀ Prev] Page 1 of 100 [Next ▶]                            │
└─────────────────────────────────────────────────────────────┘
```

## Filters

### Search Input
- Debounced: 300ms
- Search by: content caption, author username

### Privacy Dropdown
- Options: All, Public, Private, Followers

### Date Range Picker
- Filter by post creation date

### Status Dropdown (optional)
- Options: All, Active, Deleted

## DataTable Columns

| Column | Field | Width | Template |
|--------|-------|-------|----------|
| Checkbox | selection | 50px | - |
| Content | caption, media | - | Custom (preview) |
| Author | author | - | Avatar + username |
| Privacy | privacy | 100px | Tag |
| Stats | likes, comments | 150px | Icons + count |
| Actions | - | 80px | Menu |

## Content Preview Column

### Thumbnail + Caption snippet
```
┌──────┐ "Amazing sunset at the beach today!..."
│      │
│ img  │
│      │
└──────┘
```

### Click behavior
- Click vào content → Open PostPreviewDialog
- Hover → Highlight effect

## PostPreviewDialog

```tsx
interface PostPreviewDialogProps {
  visible: boolean;
  onHide: () => void;
  post: PostDto;
}

export default function PostPreviewDialog({ visible, onHide, post }) {
  return (
    <Dialog header="Post Preview" visible={visible} onHide={onHide} style={{ width: '600px' }}>
      <PostCard post={post} fullView />
      <div className="post-stats">
        ❤️ {post.likeCount}  💬 {post.commentCount}
      </div>
    </Dialog>
  );
}
```

## Actions Menu (⋮)

1. **View Full** → Open PostPreviewDialog
2. **View Author** → Navigate to `/admin/users/{authorId}`
3. **Delete** → Open DeleteContentDialog
4. **Copy Link** → Copy post URL

## DeleteContentDialog

```tsx
interface DeleteContentDialogProps {
  visible: boolean;
  onHide: () => void;
  contentId: string;
  contentType: 'post' | 'comment';
  onDelete: (id: string, reason?: string) => void;
}

export default function DeleteContentDialog({ visible, onHide, contentId, onDelete }) {
  const [reason, setReason] = useState("");

  return (
    <Dialog header="Delete Content" visible={visible} onHide={onHide}>
      <p>Bạn có chắc chắn muốn xóa nội dung này?</p>
      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do (tùy chọn)" />
      <Button label="Xóa" severity="danger" onClick={() => onDelete(contentId, reason)} />
    </Dialog>
  );
}
```

## API Endpoints
```typescript
// Posts list (paginated)
GET /api/admin/analytics/posts?skip=0&take=20&search=&privacy=&status=

// Delete post
DELETE /api/admin/content/posts/{id} { reason?: string }

// Bulk delete posts
POST /api/admin/content/posts/bulk/delete { postIds: [], reason?: string }

// Export posts
GET /api/admin/export/posts
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
import { Image as PrimeImage } from "primereact/image";
```

## UX Features
- [ ] Content preview trong table
- [ ] Modal preview thay vì expand row
- [ ] Lazy load images
- [ ] Skeleton loading
- [ ] Undo delete (5 giây) - optional
- [ ] Bulk delete confirmation
- [ ] Toast notifications

## Context Search khi cần
```
admin_frontend_app_router.md → Section "Posts Management"
admin_frontend_app_router.md → Section "API Integration Layer"
AGENT_DEV_GUIDE.md → Section 9: "Dialog Pattern"
src/components/ → Xem PostCard component
```

## Output
- admin/posts/page.tsx
- PostsTable.tsx
- PostPreviewDialog.tsx
- DeleteContentDialog.tsx
- useAdminPosts hook
- API functions

## Tick ✅ khi hoàn thành
- [ ] DataTable với content preview column
- [ ] Filters (search, privacy, date)
- [ ] Post preview modal
- [ ] Delete content dialog
- [ ] Bulk delete actions
- [ ] Toast notifications
- [ ] Export functionality
