# Phase 5: User Detail

## Mục tiêu
Implement trang chi tiết user với profile info và activity tabs.

## Files cần tạo
```
Tạo: src/app/[locale]/admin/users/[id]/page.tsx
Tạo: src/hooks/queries/useAdminUser.ts
Cập nhật: src/lib/api/admin.ts (getUserDetail API)
```

## UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Users                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  Avatar         │  │  Username: @john_doe            │   │
│  │  (large)        │  │  Display: John Doe              │   │
│  │                 │  │  Email: john@example.com        │   │
│  │  [Ban] [Warn]   │  │  Role: User                     │   │
│  └─────────────────┘  │  Status: ● Active               │   │
│                       │  Created: Jan 1, 2024            │   │
│                       │  Last Active: 2 hours ago        │   │
│                       └─────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Tabs: [Posts] [Comments] [Followers] [Moderation History]  │
├─────────────────────────────────────────────────────────────┤
│  Posts Tab:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📝 "My first post..."                               │   │
│  │  ❤️ 120  💬 15  📅 Jan 5, 2024  [View] [Delete]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Moderation History Tab:                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🚫 Banned  │  Reason: Spam  │  Jan 10, 2024       │   │
│  │  ⚠️ Warned  │  Reason: Harassment │ Jan 8, 2024    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Profile Section

### Left: Avatar & Quick Actions
- Large avatar (100x100 hoặc lớn hơn)
- Ban button (red)
- Warn button (yellow)

### Right: User Info
| Field | Source |
|-------|--------|
| Username | profile.username |
| Display Name | profile.displayName |
| Email | profile.email |
| Role | profile.role (Tag) |
| Status | status (Active/Banned) - Tag màu |
| Created | profile.createdAt |
| Last Active | user.lastActiveAt |

## Tabs

### 1. Posts Tab
- Grid/List of user's posts
- Each item: content preview + stats + date
- Actions: View, Delete

### 2. Comments Tab
- List of comments
- Each item: comment preview + post link

### 3. Followers Tab
- User stats: followers count, following count

### 4. Moderation History Tab
- List of ban/warn actions
- Columns: Action (Ban/Warn), Reason, Date, Admin

## API Endpoints
```typescript
// User profile
GET /api/profiles/{profileId}

// Ban status
GET /api/admin/users/{profileId}/ban

// Warn history
GET /api/admin/users/{profileId}/warn

// User's posts
GET /api/admin/analytics/posts?authorId={profileId}

// User's audit logs
GET /api/admin/audit?targetProfileId={profileId}

// Delete post (admin)
DELETE /api/admin/content/posts/{postId}
```

## PrimeReact components
```tsx
import { TabView, TabPanel } from "primereact/tabview";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
```

## UX Features
- [ ] Quick actions với button colors (Red cho ban, Yellow cho warn)
- [ ] Tabs navigation với lazy loading
- [ ] Inline delete cho posts
- [ ] Copy to clipboard cho username/email
- [ ] Back button với breadcrumb
- [ ] Loading skeleton
- [ ] Empty states

## Context Search khi cần
```
admin_frontend_app_router.md → Section "User Detail"
AGENT_DEV_GUIDE.md → Section 6: "Pattern Thêm Page Mới"
src/components/ → Xem PostCard, UserAvatar patterns
```

## Output
- admin/users/[id]/page.tsx
- useAdminUser hook
- API functions cho user detail

## Tick ✅ khi hoàn thành
- [ ] Profile section với avatar và info
- [ ] Ban/Unban/Warn buttons
- [ ] Tabs: Posts, Comments, Followers, Moderation History
- [ ] Posts tab với delete action
- [ ] Moderation history tab
- [ ] Loading states
