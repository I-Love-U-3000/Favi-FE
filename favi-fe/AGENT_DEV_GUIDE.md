# Agent Development Guide

## Tổng quan Project

**Favi-FE** là ứng dụng Next.js 15 với TypeScript, React 19, PrimeReact UI, và Supabase backend.

### Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # i18n pages
│   │   ├── page.tsx      # Trang chủ
│   │   ├── search/       # Search page (có AI semantic search)
│   │   ├── profiles/     # Profiles pages
│   │   ├── admin/        # Admin pages
│   │   └── ...
│   └── api/              # API routes (nếu cần)
├── components/            # React components
│   ├── AuthProvider.tsx  # Auth context
│   ├── RootProvider.tsx  # Overlay/dialog context
│   ├── Navbar.tsx        # Sidebar navigation
│   ├── Post.tsx          # Post card component
│   ├── FeedCard.tsx      # Feed item component
│   └── ...               # Dialogs, cards, etc.
├── lib/                   # Utilities & services
│   ├── api/              # API service modules
│   ├── hooks/            # Custom React hooks
│   └── fetchWrapper.ts   # HTTP client wrapper
└── types/                 # TypeScript type definitions
```

---

## 1. PrimeReact Components (Tái sử dụng)

Project sử dụng **PrimeReact** làm UI library. Các components phổ biến:

### Form Elements
```tsx
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Textarea } from "primereact/textarea";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";
import { Calendar } from "primereact/calendar";
import { FileUpload } from "primereact/fileupload";
```

### Display Components
```tsx
import { Card } from "primereact/card";
import { Image as PrimeImage } from "primereact/image";  // Image với preview
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { ProgressSpinner } from "primereact/progressspinner";
import { Skeleton } from "primereact/skeleton";
```

### Dialog & Overlay
```tsx
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Toast, toaster } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";
import { Menu } from "primereact/menu";
import { Sidebar } from "primereact/sidebar";
import { OverlayPanel } from "primereact/overlaypanel";
```

### Data Display
```tsx
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tree } from "primereact/tree";
import { Timeline } from "primereact/timeline";
```

### Icons
Sử dụng PrimeFlex icons (className):
```tsx
<i className="pi pi-home" />           // Home
<i className="pi pi-search" />          // Search
<i className="pi pi-user" />            // User
<i className="pi pi-heart" />           // Like
<i className="pi pi-comment" />         // Comment
<i className="pi pi-send" />            // Send
<i className="pi pi-bookmark" />        // Bookmark
<i className="pi pi-trash" />           // Delete
<i className="pi pi-pencil" />          // Edit
<i className="pi pi-plus" />            // Add
<i className="pi pi-spin pi-spinner" /> // Loading spinner
```

**Tham khảo:** https://primereact.org/

---

## 2. Custom Hooks

Các hooks có sẵn trong `src/lib/hooks/`:

### useAuth
```tsx
import { useAuth } from "@/components/AuthProvider";

const { isAuthenticated, isGuest, isAdmin, user, logout, requireAuth } = useAuth();

// requireAuth: Kiểm tra login, hiển thị alert nếu chưa login
if (!requireAuth()) return;
```

### useOverlay
```tsx
import { useOverlay } from "@/components/RootProvider";

const {
  toastRef, showToast, confirm, confirmPopup,
  openPostComposer, closePostComposer,
  openCollectionComposer, closeCollectionComposer,
  openAddToCollectionDialog, closeAddToCollectionDialog,
  openNotificationDialog, closeNotificationDialog,
} = useOverlay();

// Hiển thị toast
showToast({ severity: "success", summary: "Thành công", detail: "Đã lưu" });

// Confirm dialog
confirm({
  message: "Bạn có chắc chắn muốn xóa?",
  header: "Xác nhận",
  icon: "pi pi-exclamation-triangle",
  accept: () => { /* xóa */ }
});
```

### useProfile, useNotifications
```tsx
import useProfile from "@/lib/hooks/useProfile";
import { useNotifications } from "@/lib/hooks/useNotifications";

const me = useProfile(user?.id);          // { profile, loading, refresh }
const { unreadCount } = useNotifications(); // Số thông báo chưa đọc
```

---

## 3. fetchWrapper (HTTP Client)

**File:** `src/lib/fetchWrapper.ts`

```typescript
import { fetchWrapper } from "@/lib/fetchWrapper";

// GET
fetchWrapper.get<T>("/path", auth = true);

// POST
fetchWrapper.post<T>("/path", body, auth = true);

// PUT
fetchWrapper.put<T>("/path", body, auth = true);

// PATCH
fetchWrapper.patch<T>("/path", body, auth = true);

// DELETE
fetchWrapper.del<T>("/path", body?, auth = true);
```

**Tính năng:**
- Tự động thêm JWT token vào header `Authorization: Bearer <token>`
- Tự động refresh token khi nhận 401
- Chuyển đổi PascalCase → camelCase response
- Hỗ trợ FormData (upload file)

---

## 4. Pattern Thêm API Service Mới

Tạo file trong `src/lib/api/exampleAPI.ts`:

```typescript
import { fetchWrapper } from "@/lib/fetchWrapper";

// Types
export type ExampleRequest = { id: string; name: string };
export type ExampleResponse = { data: any; message: string };

export const exampleAPI = {
  // GET list với pagination
  getList: (params?: { skip?: number; take?: number }) => {
    const q = new URLSearchParams();
    if (params?.skip) q.append("skip", params.skip.toString());
    if (params?.take) q.append("take", params.take.toString());
    return fetchWrapper.get<ExampleResponse[]>(`/examples${q ? `?${q}` : ""}`);
  },

  // GET single
  getById: (id: string) =>
    fetchWrapper.get<ExampleResponse>(`/examples/${id}`),

  // POST
  create: (payload: ExampleRequest) =>
    fetchWrapper.post<ExampleResponse>("/examples", payload),

  // PUT
  update: (id: string, payload: Partial<ExampleRequest>) =>
    fetchWrapper.put<ExampleResponse>(`/examples/${id}`, payload),

  // DELETE
  delete: (id: string) =>
    fetchWrapper.del(`/examples/${id}`),
};
```

Thêm types vào `src/types/index.ts`

---

## 5. Pattern Thêm Component Mới

```tsx
// src/components/ExampleCard.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Image as PrimeImage } from "primereact/image";
import { useOverlay } from "@/components/RootProvider";
import { useAuth } from "@/components/AuthProvider";
import exampleAPI from "@/lib/api/exampleAPI";

interface ExampleCardProps {
  id: string;
  title: string;
  image: string;
}

export default function ExampleCard({ id, title, image }: ExampleCardProps) {
  const { requireAuth } = useAuth();
  const { showToast } = useOverlay();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!requireAuth()) return;

    setLoading(true);
    try {
      await exampleAPI.delete(id);
      showToast({ severity: "success", summary: "OK", detail: "Đã xóa" });
    } catch (error: any) {
      showToast({ severity: "error", summary: "Lỗi", detail: error?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={title} className="shadow-md">
      <div className="relative w-full h-48">
        <PrimeImage
          src={image}
          alt={title}
          preview
          className="w-full h-full object-cover rounded"
        />
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          label="Xóa"
          icon="pi pi-trash"
          severity="danger"
          loading={loading}
          onClick={handleAction}
        />
      </div>
    </Card>
  );
}
```

---

## 6. Pattern Thêm Page Mới

```tsx
// src/app/[locale]/example/page.tsx
import { getTranslations } from "next-intl/server";
import ExampleCard from "@/components/ExampleCard";
import exampleAPI from "@/lib/api/exampleAPI";

export default async function ExamplePage() {
  const t = await getTranslations("Example");

  // Server-side data fetching
  const items = await exampleAPI.getList({ skip: 0, take: 10 });

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.data?.map((item) => (
          <ExampleCard
            key={item.id}
            id={item.id}
            title={item.name}
            image={item.image}
          />
        ))}
      </div>
    </main>
  );
}
```

**Với client-side interactions:**

```tsx
// src/app/[locale]/example/page.tsx
import ExampleClient from "./ExampleClient";

export default function ExamplePage() {
  return <ExampleClient />;
}

// src/app/[locale]/example/ExampleClient.tsx
"use client";
import { useState } from "react";
// ... component logic
```

---

## 7. Navigation (Navbar)

Sửa `src/components/Navbar.tsx` để thêm menu item mới:

```tsx
const NAV: Item[] = [
  { label: "Home", href: "/home", icon: "pi pi-home" },
  { label: "Example", href: "/example", icon: "pi pi-star" },
  // ... thêm item
];
```

---

## 8. i18n (Internationalization)

Thêm keys vào `src/messages/en.json` và `vi.json`:

```json
{
  "Example": {
    "title": "Example Page",
    "submit": "Submit",
    "delete": "Delete"
  }
}
```

**Sử dụng trong server component:**
```tsx
import { getTranslations } from "next-intl/server";

const t = await getTranslations("Example");
<h1>{t("title")}</h1>
```

**Sử dụng trong client component:**
```tsx
import { useTranslations } from "next-intl/client";

const t = useTranslations("Example");
<button>{t("submit")}</button>
```

---

## 9. Dialog Pattern

```tsx
// src/components/ExampleDialog.tsx
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

interface Props {
  visible: boolean;
  onHide: () => void;
  data?: any;
}

export default function ExampleDialog({ visible, onHide, data }: Props) {
  const footer = (
    <div className="flex justify-end gap-2">
      <Button label="Hủy" className="p-button-text" onClick={onHide} />
      <Button label="Lưu" onClick={onHide} />
    </div>
  );

  return (
    <Dialog
      header="Tiêu đề"
      visible={visible}
      onHide={onHide}
      style={{ width: "500px" }}
      footer={footer}
    >
      {/* Content */}
    </Dialog>
  );
}
```

---

## 10. Environment Variables

```env
NEXT_PUBLIC_API_URL=...         # Backend API URL
NEXT_PUBLIC_SUPABASE_URL=...    # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=... # Supabase anon key
NEXT_PUBLIC_TRACKASIA_KEY=...   # Maps API
NEXT_PUBLIC_LOCATIONIQ_API_KEY=... # Geocoding
```

---

## 11. Các API Endpoints Có sẵn

| Service | File | Endpoints |
|---------|------|-----------|
| Auth | `authAPI.ts` | login, register, logout, getUserInfo, isAuthenticated |
| Search | `searchAPI.ts` | search, semanticSearch (AI) |
| Profile | `profileAPI.ts` | getById, getRecommendations, update |
| Post | `postAPI.ts` | getById, delete, etc. |
| Collection | `collectionAPI.ts` | CRUD operations |

---

## Checklist Khi Thêm Module Mới

- [ ] Tạo API service trong `src/lib/api/`
- [ ] Thêm types vào `src/types/index.ts`
- [ ] Tạo components trong `src/components/`
- [ ] Tạo page trong `src/app/[locale]/`
- [ ] Thêm i18n keys vào `src/messages/`
- [ ] Cập nhật Navbar nếu cần
- [ ] Sử dụng `requireAuth()` cho actions cần login
- [ ] Sử dụng `showToast()` cho notifications
