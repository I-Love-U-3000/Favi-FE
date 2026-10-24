# 06 — UI System, PrimeReact Components & Engineering Guidelines (Favi-FE)

## 1. Core UI Library: PrimeReact

Favi-FE standardizes its presentation layer by combining **PrimeReact** design primitives with **Tailwind CSS** utility classes.
Before building custom UI components from scratch, engineers must inspect and reuse existing PrimeReact components.

### 1.1 Form Elements
```tsx
import { InputText } from "primereact/inputtext";       // Single-line text input
import { InputTextarea } from "primereact/inputtextarea"; // Multi-line text input
import { Button } from "primereact/button";             // Action button (with built-in loading spinner & icons)
import { Dropdown } from "primereact/dropdown";         // Single select dropdown
import { MultiSelect } from "primereact/multiselect";   // Multi select tag input
import { Checkbox } from "primereact/checkbox";         // Form checkbox
import { RadioButton } from "primereact/radiobutton";   // Radio choice selector
import { Calendar } from "primereact/calendar";         // Date picker / date-range selector
import { FileUpload } from "primereact/fileupload";     // Drag & drop file / image uploader
import { Chips } from "primereact/chips";               // Comma/enter separated tag inputs
```

### 1.2 Display & Media Primitives
```tsx
import { Card } from "primereact/card";
import { Image as PrimeImage } from "primereact/image"; // Image viewer with fullscreen zoom preview
import { Avatar } from "primereact/avatar";             // User avatar with initials fallback
import { Tag } from "primereact/tag";                   // Status badge (Success, Warning, Danger)
import { Badge } from "primereact/badge";               // Numerical unread indicator
import { Skeleton } from "primereact/skeleton";         // Content loading placeholder shape
import { ProgressSpinner } from "primereact/progressspinner";
```

### 1.3 Professional Data Grids & Views
Primary data presentation layer for the Admin Portal:
```tsx
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Timeline } from "primereact/timeline";         // Chronological activity history feed
```

### 1.4 Overlays, Modals & Notifications
```tsx
import { Dialog } from "primereact/dialog";             // Accessible modal window
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog"; // Destruction confirmation modal
import { Toast } from "primereact/toast";               // Screen toast notifications
import { Tooltip } from "primereact/tooltip";           // Hover tooltip trigger
import { Sidebar } from "primereact/sidebar";           // Slide-over navigation panel
```

---

## 2. Icon System (PrimeIcons)

The project embeds `primeicons`. Use icon classes directly via `pi pi-<icon-name>`:

| Icon Name | Class Name | Common Application |
|---|---|---|
| Home | `pi pi-home` | Home feed navigation |
| Search | `pi pi-search` | Search bar & explore triggers |
| User | `pi pi-user` | Profile navigation & user tabs |
| Heart | `pi pi-heart` | Post like & reaction actions |
| Comment | `pi pi-comment` | Comment threads |
| Send / Share | `pi pi-send` | Messaging & post sharing |
| Bookmark | `pi pi-bookmark` | Save to collection |
| Trash | `pi pi-trash` | Delete post / comment / media |
| Spinner | `pi pi-spin pi-spinner` | Active loading state indicator |
| Ban / Lock | `pi pi-ban` | Admin account suspension actions |

---

## 3. User Experience (UX) Standards

1. **Explicit Loading States**:
   - Initial page loads: Render `Skeleton` shapes matching target layout geometries or a centered `ProgressSpinner`.
   - Action mutations: Set `loading={isLoading}` on PrimeReact `Button` to disable user input and show a spinner, preventing repeated submissions.
2. **Graceful Empty States**:
   - When feeds or search results return zero items: Display an illustrative icon paired with helpful messaging (e.g., *"No posts found. Follow friends or explore topics to see new content!"*).
3. **Double Confirmation for Destructive Actions**:
   - Takedowns, post deletions, and account bans must trigger a `confirmDialog` prompt requiring explicit user confirmation before dispatching HTTP DELETE requests.
4. **Immediate Toast Feedback**:
   - Every mutating user interaction must trigger a corner Toast notification (`showToast.success(...)` or `showToast.error(...)`).
