# List Description - Favi Frontend

This file mirrors the structure of `docs/List Description.xlsx` and is tailored to the current Favi frontend (Next.js + Supabase social app). Use it as a living reference when adding or changing screens/forms. All text is ASCII to keep diffs clean.

## Main Screen (Left Menu)
| # | Link Label      | Link to         | Description |
|---|-----------------|-----------------|-------------|
| 1 | Home            | `/home`         | Personalized/guest feed of posts with reactions, comments, add-to-collection, and quick search. |
| 2 | Explore         | `/search`       | Search posts/tags/people, semantic search entry, shows trending collections. |
| 3 | Chat            | `/chat`         | Direct and group conversations, message list and composer. |
| 4 | Notifications   | `/notifications`| Notification center dialog/page with read/unread and deep links to posts/profiles. |
| 5 | Profile         | `/profile/:id`  | Public profile, posts, collections, follow actions. |
| 6 | Friends         | `/friends`      | Follow/follower lists, suggestions, follow actions. |
| 7 | Settings        | `/settings`     | Account + preference settings (theme, language, auth). |
| 8 | Onboarding/Auth | `/onboarding`, `/login`, `/register` | Guest CTA, login/register, onboarding prompts. |
| 9 | Create menu     | modal (global)  | New post and new collection dialogs, invoked from navbar “Create”. |

## List 01 - Post Management Form (Create/Edit Post)
| # | Column Name    | Column Type          | Label            | Editable (Yes/No) | Mandatory (Yes/No) | Default Value | Description | Design Solution | Unit Test Notes |
|---|----------------|----------------------|------------------|-------------------|--------------------|---------------|-------------|-----------------|-----------------|
| 1 | Caption        | Multi line text      | Caption          | Yes               | No                 | empty         | Free-text caption/description for the post. | Textarea with character limit hint; save on dialog submit. | Validate max length; keep value after failed submit. |
| 2 | Medias         | File upload (images) | Media            | Yes               | Yes                | none          | One or more images for the post. | Drag/drop and file picker; preview grid with reorder; upload via Supabase storage. | Require at least one file; assert previews render. |
| 3 | Tags           | Token input          | Tags             | Yes               | No                 | empty         | Optional hashtags to aid search. | Chip input with suggestions; normalize to lowercase. | Deduplicate tags; ensure chips show after save. |
| 4 | PrivacyLevel   | Radio/Select        | Audience         | Yes               | Yes                | Public        | Post visibility (Public/Followers/Private). | Three-option selector; default Public. | Enforce allowed values; check default when dialog opens. |
| 5 | Location       | Autocomplete         | Location         | Yes               | No                 | empty         | Optional location metadata (name/address/lat/lng). | LocationIQ autocomplete; shows selected chip with clear. | Mock API and assert value stored; clear works. |
| 6 | CreatedAt      | DateTime (server)    | Created At       | No                | Yes                | now           | Server-generated timestamp. | Read-only; displayed on feed cards. | Ensure not editable on edit form. |
| 7 | UpdatedAt      | DateTime (server)    | Updated At       | No                | No                 | null          | Last modified time. | Read-only; updated after edit. | Confirm updated on edit save. |
| 8 | Actions        | Buttons              | Post / Cancel    | Yes               | Yes                | n/a           | Submit or close dialog. | Primary button posts; secondary cancels. | Prevent double submit; cancel closes without persisting. |

**Custom Business Rules**
- Only authenticated users can create/edit/delete their own posts.
- Posts require at least one media item.
- Deleting a post is allowed for the owner; triggers confirmation.
- Reactions/comments obey privacy: Followers/Private restrict viewers accordingly.

## List 02 - Collection Management Form
| # | Column Name   | Column Type        | Label       | Editable (Yes/No) | Mandatory (Yes/No) | Default Value | Description | Design Solution | Unit Test Notes |
|---|---------------|--------------------|-------------|-------------------|--------------------|---------------|-------------|-----------------|-----------------|
| 1 | Title         | Single line text   | Title       | Yes               | Yes                | empty         | Collection name. | Text input with counter; focus first. | Reject empty/whitespace. |
| 2 | Description   | Multi line text    | Description | Yes               | No                 | empty         | Optional summary. | Textarea; supports markdown-lite formatting. | Accept empty; preserve line breaks. |
| 3 | PrivacyLevel  | Radio/Select       | Audience    | Yes               | Yes                | Public        | Visibility (Public/Followers/Private). | Same control as posts; default Public. | Ensure default and allowed values. |
| 4 | CoverImage    | File upload        | Cover       | Yes               | No                 | placeholder   | Optional cover image. | Upload with preview and crop; fallback solid color. | Crop result saved; placeholder visible when none. |
| 5 | PostIds       | Multi-select list  | Posts       | Yes               | No                 | empty         | Posts included in collection. | Add via feed card “Add to collection” or dialog picker. | Prevent duplicates; max count respected. |
| 6 | CreatedAt     | DateTime (server)  | Created At  | No                | Yes                | now           | Server timestamp. | Read-only. | Not editable. |
| 7 | UpdatedAt     | DateTime (server)  | Updated At  | No                | No                 | null          | Last modified time. | Read-only. | Updated when collection edited. |
| 8 | Actions       | Buttons            | Save / Delete | Yes             | Yes                | n/a           | Persist or delete. | Primary save; delete behind confirm dialog. | Delete disabled for non-owners. |

**Custom Business Rules**
- Only the collection owner can create/edit/delete.
- Title is required; privacy must be set.
- Posts added must belong to the owner’s accessible set (respect post privacy).
- Removing a post does not delete the original post.

## List 03 - Profile Management Form
| # | Column Name   | Column Type       | Label        | Editable (Yes/No) | Mandatory (Yes/No) | Default Value | Description | Design Solution | Unit Test Notes |
|---|---------------|-------------------|--------------|-------------------|--------------------|---------------|-------------|-----------------|-----------------|
| 1 | Username      | Single line text  | Username     | Yes               | Yes                | generated     | Unique handle for links/mentions. | Text input with availability check. | Reject duplicates; lowercase normalization. |
| 2 | DisplayName   | Single line text  | Display Name | Yes               | Yes                | empty         | Shown on profile/cards. | Text input; counter. | Required; trim whitespace. |
| 3 | Bio           | Multi line text   | Bio          | Yes               | No                 | empty         | Short about section. | Textarea with limit. | Enforce max length. |
| 4 | AvatarUrl     | File upload       | Avatar       | Yes               | No                 | default avatar| Profile picture. | Image cropper + upload; preview. | Accept only images; ensure upload returns URL. |
| 5 | CoverUrl      | File upload       | Cover Image  | Yes               | No                 | default cover | Banner image. | Image upload with preview. | Optional; fallback gradient. |
| 6 | SocialLinks   | Repeater (url+type)| Social Links | Yes              | No                 | empty         | External links (Website, IG, etc.). | Dynamic rows with select + url input. | Validate URL format; limit count. |
| 7 | PrivacyLevel  | Radio/Select      | Profile Privacy | Yes            | Yes                | Public        | Profile visibility. | Same control as posts. | Default Public; stored value matches enum. |
| 8 | FollowPrivacyLevel | Radio/Select  | Follow Privacy | Yes            | Yes                | Public        | Who can follow/see follower list. | Mirror backend enum. | Ensure persisted as enum. |
| 9 | Actions       | Buttons           | Save / Cancel | Yes             | Yes                | n/a           | Persist updates. | Save disabled while uploading files; cancel closes dialog. | Ensure optimistic UI rollback on error. |

**Custom Business Rules**
- User can only edit their own profile.
- Username must be unique; we lock when server reports conflict.
- Avatar/cover uploads must complete before save succeeds.
- Privacy toggles influence search visibility and follow requests.

## List 04 - Messaging (Chat) Form
| # | Column Name       | Column Type          | Label          | Editable (Yes/No) | Mandatory (Yes/No) | Default Value | Description | Design Solution | Unit Test Notes |
|---|-------------------|----------------------|----------------|-------------------|--------------------|---------------|-------------|-----------------|-----------------|
| 1 | ConversationId    | Hidden/system        | n/a            | No                | Yes                | auto          | Existing DM or group ID. | Set via URL or create API. | Must exist before sending message. |
| 2 | Members           | Multi-select profile | Participants   | Yes (group)       | Yes (group)        | creator + selected | Users in conversation. | Profile picker for group creation; DM uses target profile. | Require at least 2 members for group. |
| 3 | Content           | Multi line text      | Message        | Yes               | Yes (unless media) | empty         | Message body. | Textarea with Enter to send, Shift+Enter for newline. | Block empty send when no media. |
| 4 | MediaUrl          | File upload          | Attachment     | Yes               | No                 | empty         | Optional image/file. | Upload to storage; show thumbnail in composer. | Reject unsupported types; ensure send after upload. |
| 5 | CreatedAt         | DateTime (server)    | Sent At        | No                | Yes                | now           | Timestamp. | Read-only; displayed in message list. | Sorted by createdAt desc. |
| 6 | IsEdited          | Boolean (server)     | Edited Flag    | No                | Yes                | false         | Indicates message edits. | Toggle set on edit API. | Edit label shown when true. |
| 7 | Actions           | Buttons/shortcuts    | Send / Edit / Delete | Yes          | Yes                | n/a           | Send new message, edit own, delete own. | Send button + Enter shortcut; context menu for edit/delete. | Only sender can edit/delete; delete confirmation. |

**Custom Business Rules**
- Only participants can read/write in a conversation.
- DMs auto-create on first send; groups require member selection.
- Messages must contain content or media.
- Deleting a message is soft-delete (content replaced with tombstone when supported).

## List 05 - Notifications
| # | Column Name   | Column Type      | Label       | Editable (Yes/No) | Mandatory (Yes/No) | Default Value | Description | Design Solution | Unit Test Notes |
|---|---------------|------------------|-------------|-------------------|--------------------|---------------|-------------|-----------------|-----------------|
| 1 | Type          | Enum             | Type        | No                | Yes                | Like          | Notification type (Like/Comment/Follow/System). | Render icon per type. | Enum mapping matches backend. |
| 2 | ActorProfile  | Reference        | From        | No                | Yes                | n/a           | User who triggered the notification. | Avatar + name + link. | Clicking opens profile. |
| 3 | Message       | Text             | Message     | No                | Yes                | server text   | Human-readable message from backend. | Display in list item. | Ensure safe rendering. |
| 4 | TargetPostId  | Reference        | Target      | No                | No                 | null          | Linked post/comment if any. | Clickable deep link. | Opens correct post view. |
| 5 | IsRead        | Boolean          | Read?       | Yes               | Yes                | false         | Read/unread state. | Toggle on click; unread badge on navbar. | Mark-as-read updates badge count. |
| 6 | CreatedAt     | DateTime (server)| Received At | No                | Yes                | now           | Timestamp. | Relative time display. | Sorted descending. |

**Custom Business Rules**
- Only authenticated users can access their notification list.
- Opening the dialog marks items as read; badge counts unread.
- System notifications may not have a target link.

## Delivery/Format Notes
- Source template: `docs/List Description.xlsx`. This Markdown mirrors its columns; convert back to Excel if handoff requires (each section = sheet).
- Column meanings: keep `Editable`/`Mandatory` aligned with frontend validations; `Design Solution` describes UI behavior; `Unit Test Notes` list high-value checks for e2e/unit tests.
- Update this file when forms change so QA and backend stay in sync. Use ASCII only.
