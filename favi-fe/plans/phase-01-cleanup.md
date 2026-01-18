# Phase 1: Cleanup & Folder Structure

## Mục tiêu
Xóa bỏ prototype admin hiện tại và tạo cấu trúc thư mục mới cho admin portal.

## Files cần xóa
```
Xóa folder: src/app/[locale]/admin/ (nếu tồn tại)
Xóa folder: src/components/admin/ (nếu tồn tại - prototype)
Kiểm tra: src/components/ có admin components nào cần xóa không
```

## Cấu trúc cần tạo mới
```
admin-portal/
├── src/app/[locale]/admin/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── users/
│   │   └── page.tsx
│   ├── posts/
│   │   └── page.tsx
│   ├── reports/
│   │   └── page.tsx
│   ├── audit/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   ├── health/
│   │   └── page.tsx
│   └── comments/
│       └── page.tsx
├── src/components/admin/
│   ├── layout/
│   ├── charts/
│   ├── tables/
│   └── modals/
├── src/lib/api/
│   └── admin.ts
├── src/hooks/queries/
│   └── .gitkeep
└── src/types/
    └── admin.d.ts
```

## Các bước thực hiện

### Bước 1: Kiểm tra files hiện có
```bash
# Kiểm tra admin prototype có tồn tại không
ls -la src/app/[locale]/admin/ 2>/dev/null || echo "Folder không tồn tại"
ls -la src/components/admin/ 2>/dev/null || echo "Folder không tồn tại"
```

### Bước 2: Xóa prototype (nếu có)
```bash
rm -rf src/app/[locale]/admin/
rm -rf src/components/admin/
```

### Bước 3: Tạo cấu trúc thư mục
```bash
# Tạo thư mục pages
mkdir -p src/app/[locale]/admin/{users/[id],posts/[id],reports/[id],audit,analytics,health,comments}

# Tạo thư mục components
mkdir -p src/components/admin/{layout,charts,tables,modals}

# Tạo thư mục api
mkdir -p src/lib/api

# Tạo thư mục hooks
mkdir -p src/hooks/queries
```

### Bước 4: Tạo placeholder files
Tạo các file `.gitkeep` hoặc file cơ bản cho mỗi folder.

## Context Search khi cần
```
AGENT_DEV_GUIDE.md → Section 6: "Pattern Thêm Page Mới"
AGENT_DEV_GUIDE.md → Section 5: "Pattern Thêm Component Mới"
admin_frontend_app_router.md → "Tổng quan cấu trúc"
```

## Output
- Folder structure đã tạo
- Các placeholder files (page.tsx cơ bản)

## Tick ✅ khi hoàn thành
- [ ] Prototype admin cũ đã xóa
- [ ] Folder structure mới đã tạo
- [ ] Placeholder files đã tạo
