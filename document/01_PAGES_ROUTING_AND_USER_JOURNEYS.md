# 01 — Pages, Routing & User Journeys (Favi-FE)

## 1. User Application Route Map

All client-facing routes are prefixed with the locale code segment `/[locale]` (defaults to `vi` or `en`).

| Route Path | Screen Name | Access Level | Core Capabilities |
|---|---|---|---|
| `/[locale]/home` | Home Feed | Public / Authenticated | Stories reel, algorithmically ranked post feed, instant Like/Comment reactions, bookmark to collection. |
| `/[locale]/search` | Discover & Search | Public / Authenticated | Multimodal AI Semantic Vector Search (OpenCLIP), hashtag filtering, keyword search, trending collections showcase. |
| `/[locale]/chat` | Direct & Group Messaging | Authenticated | 1-on-1 and group chats, realtime text & image messaging via SignalR ChatHub, WebRTC video calling trigger. |
| `/[locale]/notifications` | Notification Center | Authenticated | Grouped notifications (Like, Comment, Follow, System), read/unread filtering, mark-all-as-read, post deep-linking. |
| `/[locale]/profile/[id]` | User Profile | Public / Authenticated | Avatar, Cover banner, Bio, social links, Follower/Following metrics, tabs: Posts, Collections, Liked Posts. |
| `/[locale]/posts/[id]` | Post Detail | Public / Authenticated | High-resolution image viewer, caption, hierarchical nested comment replies, likers roster. |
| `/[locale]/collections` | Collections Board | Authenticated | User-curated image collections, privacy control toggles (Public / Followers / Private), add/remove post assignments. |
| `/[locale]/friends` | Friends & Social Graph | Authenticated | Manage followers and following lists, view bidirectional mutuals, smart user recommendations. |
| `/[locale]/settings` | Account Settings | Authenticated | Edit profile information, change password, notification audio toggles, language selector, light/dark theme switch. |
| `/[locale]/recycle-bin` | Recycle Bin | Authenticated | View and restore soft-deleted posts within a 30-day retention window. |
| `/[locale]/(auth)/login` | Login | Guest | Email/Password or Google OAuth login, receives and stores JWT Access & Refresh Tokens. |
| `/[locale]/(auth)/register`| Registration | Guest | New account signup, initial profile setup and validation. |
| `/[locale]/onboarding` | User Onboarding | Authenticated | Guides new users to pick interest tags, upload their avatar, and follow starter accounts. |

---

## 2. Admin Portal Route Map

All administrative routes are protected by role-based guards (`Admin`) and rendered within a dedicated administrative shell layout `/[locale]/admin/layout.tsx` (Sidebar + Header Analytics Bar):

| Route Path | Admin View | Functional Scope | Primary Components (PrimeReact) |
|---|---|---|---|
| `/[locale]/admin` | Executive Dashboard | KPI metrics (Users, Posts, Reports, Active conns), growth trend charts across weekly/monthly intervals. | `Card`, `Chart` (Recharts), `ProgressBar` |
| `/[locale]/admin/users` | User Management | User registry table, search by email/username, status filtering (Active/Banned), bulk account actions. | `DataTable`, `Column`, `Tag`, `FilterMenu` |
| `/[locale]/admin/users/[id]` | User Audit View | Complete account history, published posts, incoming reports, warning log, and disciplinary penalty form. | `Timeline`, `Card`, `Button`, `Dialog` |
| `/[locale]/admin/posts` | Content Moderation | Post review, filter by AI NSFW confidence score, media preview lightbox, takedown actions. | `DataTable`, `Image` preview, `Badge`, `ConfirmDialog` |
| `/[locale]/admin/reports` | Report Queue | Community abuse intake queue, categorized by violation type (Spam, Harassment, NSFW, Copyright). | `DataTable`, `Dropdown`, `StatusTag` |
| `/[locale]/admin/reports/[id]` | Report Resolution | Side-by-side comparison of reported content and reporter claim, moderator notes, adjudication actions. | `Card`, `Textarea`, `RadioButton`, `Toast` |
| `/[locale]/admin/comments` | Comment Moderation | Toxic keyword search across comment streams, mass spam comment deletion. | `DataTable`, `MultiSelect`, `Button` |
| `/[locale]/admin/audit` | Audit Logs | Chronological ledger of all Admin/Moderator actions (Who, What action, Timestamp, Origin IP). | `DataTable`, `Calendar` date-range filter |
| `/[locale]/admin/analytics` | Deep Analytics | Hourly engagement heatmaps, category distribution charts, CSV/Excel export facilities. | `Chart`, `Dropdown`, `Button` (Export) |
| `/[locale]/admin/health` | System Health | Real-time status indicators for NGINX Gateway, PostgreSQL DB, Redis Cluster, and Qdrant Vector Engine. | `Tag` (Success/Danger), `ProgressBar`, `Card` |

---

## 3. Core User Workflows

### 3.1 Post Creation Workflow
1. User clicks the **"Create" (+)** action in the Navbar or presses the global keyboard shortcut.
2. The `CreatePostModal` opens:
   - Supports Drag & Drop for single or multiple high-resolution images.
   - Built-in crop tool and color filter presets.
   - Caption input with auto-suggesting hashtags and privacy selection (Public / Followers / Private).
3. Upon clicking Submit:
   - Data is packaged into a `FormData` envelope.
   - The client invokes `fetchWrapper.post('/api/posts', formData)`.
   - `fetchWrapper` automatically attaches a unique `Idempotency-Key` header, preventing duplicate post uploads during flaky network conditions.
   - On success, the modal closes, a confirmation Toast is dispatched, and the new post is prepended to the top of the user's feed.

### 3.2 Reaction Toggle Workflow (Optimistic UI)
1. User clicks the Heart (Like) icon on a `FeedCard`.
2. The UI applies an **Optimistic UI Update**: Instantly turns the icon red and increments the like counter by +1.
3. Simultaneously dispatches the network mutation: `fetchWrapper.post('/api/posts/${id}/reaction', { type: 'Like' })`.
4. If the request succeeds: The optimistic state is confirmed and retained.
5. If the request fails (network error or server outage): The state automatically reverts to previous count and a Toast alerts the user.
