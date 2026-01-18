# Phase 15: Final Verification

## Mục tiêu
Kiểm tra và xác minh toàn bộ admin portal hoạt động đúng.

## Checklist Verification

### 1. Build Verification
```bash
npm run build
```
- [ ] Build thành công không lỗi
- [ ] Không có TypeScript errors
- [ ] Không có linting errors

### 2. Pages Accessibility
Kiểm tra từng route có thể truy cập:
- [ ] /admin (Dashboard)
- [ ] /admin/users (Users list)
- [ ] /admin/users/[id] (User detail)
- [ ] /admin/posts (Posts list)
- [ ] /admin/reports (Reports list)
- [ ] /admin/reports/[id] (Report detail)
- [ ] /admin/audit (Audit logs)
- [ ] /admin/analytics (Analytics)
- [ ] /admin/health (Health monitoring)
- [ ] /admin/comments (Comments)

### 3. Auth Check
- [ ] Redirect về login nếu chưa đăng nhập
- [ ] Redirect về home nếu không phải admin
- [ ] Admin có thể truy cập tất cả pages

### 4. API Integration
Kiểm tra mỗi page:
- [ ] Data load đúng
- [ ] Loading states hoạt động
- [ ] Error states hiển thị khi API lỗi
- [ ] Empty states hiển thị khi không có data

### 5. Components
- [ ] AdminSidebar navigation đúng
- [ ] AdminHeader hiển thị đúng
- [ ] Breadcrumb hoạt động
- [ ] Search global (Ctrl+K) hoạt động
- [ ] Notifications dropdown hoạt động

### 6. Tables
- [ ] Pagination hoạt động
- [ ] Sorting hoạt động
- [ ] Filtering hoạt động
- [ ] Bulk selection hoạt động
- [ ] Empty state hiển thị

### 7. Modals/Dialogs
- [ ] Mở/đóng đúng
- [ ] Scroll khi nội dung dài
- [ ] Overlay click to close
- [ ] ESC to close

### 8. Actions
- [ ] Ban/Unban user hoạt động
- [ ] Warn user hoạt động
- [ ] Delete post hoạt động
- [ ] Resolve/Reject report hoạt động
- [ ] Toast notifications hiển thị

### 9. Charts
- [ ] Charts hiển thị đúng
- [ ] Tooltips hoạt động
- [ ] Legends hiển thị
- [ ] Export PNG hoạt động (nếu có)

### 10. i18n
- [ ] Tiếng Việt hiển thị đúng
- [ ] Tiếng Anh hiển thị đúng
- [ ] Fallback hoạt động

### 11. Responsive
- [ ] Desktop view
- [ ] Tablet view
- [ ] Mobile view (sidebar collapse)

### 12. Performance
- [ ] Initial load < 3s
- [ ] No memory leaks
- [ ] Debounced search hoạt động

## Testing Commands

### Unit Tests (nếu có)
```bash
npm run test
```

### E2E Tests (nếu có)
```bash
npm run test:e2e
```

### Manual Testing Checklist
```markdown
## Dashboard
- [ ] Stats cards hiển thị đúng số liệu
- [ ] Charts load và hiển thị
- [ ] Auto-refresh hoạt động
- [ ] Date range picker thay đổi data

## Users
- [ ] Search tìm đúng user
- [ ] Filter by role/status hoạt động
- [ ] Ban user → user bị ban
- [ ] Unban user → user được unban
- [ ] Bulk ban hoạt động

## Reports
- [ ] Pending reports hiển thị đầu tiên
- [ ] Resolve with delete xóa content
- [ ] Resolve only không xóa content
- [ ] Reject report hoạt động
- [ ] Keyboard shortcuts (R, X) hoạt động

## Audit
- [ ] Logs hiển thị đầy đủ
- [ ] Filter by action type hoạt động
- [ ] Export CSV hoạt động
- [ ] Click admin → filter đúng

## Analytics
- [ ] Tất cả charts hiển thị
- [ ] Date range picker thay đổi data
- [ ] Period comparison hiển thị đúng

## Health
- [ ] Status hiển thị đúng
- [ ] Auto-refresh hoạt động
- [ ] Manual refresh hoạt động
```

## Issues có thể gặp

### 1. API 404/500
- Kiểm tra API endpoints đã tồn tại chưa
- Mock data nếu API chưa có

### 2. Auth issues
- Kiểm tra token được gửi đúng
- Kiểm tra isAdmin check

### 3. Styling issues
- Check PrimeReact styles imported
- Check custom CSS không conflict

### 4. Performance issues
- Lazy load components nếu cần
- Pagination cho large datasets

## Final Output
- [ ] Build thành công
- [ ] Tất cả pages hoạt động
- [ ] Tests pass (nếu có)
- [ ] Documentation hoàn chỉnh
- [ ] Ready for deployment

## Context Search khi cần
```
AGENT_DEV_GUIDE.md → Toàn bộ document
src/app/[locale]/ → Các pages đã tạo
src/components/admin/ → Các components đã tạo
package.json → Scripts available
```

## Tick ✅ khi hoàn thành
- [ ] Build thành công
- [ ] Tất cả 10 pages accessible
- [ ] Auth check hoạt động
- [ ] API integration verified
- [ ] Components verified
- [ ] Tables verified
- [ ] Modals verified
- [ ] Actions verified
- [ ] Charts verified
- [ ] i18n verified
- [ ] Responsive verified
- [ ] Performance verified
- [ ] Plan tổng đã tick đầy đủ
