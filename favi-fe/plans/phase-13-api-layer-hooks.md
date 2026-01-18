# Phase 13: API Layer & Hooks

## Mục tiêu
Implement API layer và React Query hooks cho admin portal.

## Files cần tạo
```
Tạo: src/lib/api/admin.ts
Tạo: src/hooks/queries/useAdminDashboard.ts
Tạo: src/hooks/queries/useAdminUsers.ts
Tạo: src/hooks/queries/useAdminPosts.ts
Tạo: src/hooks/queries/useAdminReports.ts
Tạo: src/hooks/queries/useAdminAudit.ts
Tạo: src/hooks/queries/useAdminAnalytics.ts
Tạo: src/hooks/queries/useAdminHealth.ts
Tạo: src/hooks/queries/useAdminComments.ts
Tạo: src/types/admin.d.ts
```

## API Layer Structure

### admin.ts
```typescript
import { fetchWrapper } from "@/lib/fetchWrapper";

// Dashboard
export const getDashboardStats = () =>
  fetchWrapper.get("/api/admin/analytics");

export const getGrowthChart = (params) =>
  fetchWrapper.get("/api/admin/analytics/charts/growth", false, params);

// Users
export const getUsers = (params) =>
  fetchWrapper.get("/api/admin/analytics/users", false, params);

export const getUser = (id) =>
  fetchWrapper.get(`/api/profiles/${id}`);

export const banUser = (id, reason) =>
  fetchWrapper.post(`/api/admin/users/${id}/ban`, { reason });

export const unbanUser = (id) =>
  fetchWrapper.del(`/api/admin/users/${id}/ban`);

export const warnUser = (id, reason) =>
  fetchWrapper.post(`/api/admin/users/${id}/warn`, { reason });

// Posts
export const getPosts = (params) =>
  fetchWrapper.get("/api/admin/analytics/posts", false, params);

export const deletePost = (id, reason) =>
  fetchWrapper.del(`/api/admin/content/posts/${id}`, { reason });

// Reports
export const getReports = (params) =>
  fetchWrapper.get("/api/admin/reports", false, params);

export const getReport = (id) =>
  fetchWrapper.get(`/api/admin/reports/${id}`);

export const resolveReport = (id, data) =>
  fetchWrapper.post(`/api/admin/reports/${id}/resolve`, data);

export const rejectReport = (id, reason) =>
  fetchWrapper.post(`/api/admin/reports/${id}/reject`, { reason });

// Audit
export const getAuditLogs = (params) =>
  fetchWrapper.get("/api/admin/audit", false, params);

// Analytics
export const getChartData = (type, params) =>
  fetchWrapper.get(`/api/admin/analytics/charts/${type}`, false, params);

// Health
export const getHealth = () =>
  fetchWrapper.get("/api/admin/health");

export const getHealthMetrics = () =>
  fetchWrapper.get("/api/admin/health/metrics");

// Comments
export const getComments = (params) =>
  fetchWrapper.get("/api/admin/analytics/comments", false, params);

export const deleteComment = (id, reason) =>
  fetchWrapper.del(`/api/admin/content/comments/${id}`, { reason });
```

## Types Structure

### admin.d.ts
```typescript
// Dashboard
interface DashboardStats {
  users: { total: number; active: number; banned: number };
  posts: { total: number; today: number };
  reports: { pending: number; resolved: number; rejected: number };
}

// Users
interface UserDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  role: 'user' | 'admin';
  status: 'active' | 'banned' | 'inactive';
  createdAt: string;
  lastActiveAt: string;
}

// Posts
interface PostDto {
  id: string;
  caption: string;
  media: MediaDto[];
  author: UserDto;
  privacy: 'public' | 'private' | 'followers';
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

// Reports
interface ReportDto {
  id: string;
  targetType: 'post' | 'user' | 'comment';
  targetId: string;
  target: any;
  reporter: UserDto;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
}

// Audit
interface AuditLogDto {
  id: string;
  admin: UserDto;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

// Comments
interface CommentDto {
  id: string;
  content: string;
  author: UserDto;
  post: PostDto;
  parentComment?: CommentDto;
  createdAt: string;
}

// Pagination
interface PagedResult<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}
```

## React Query Hooks Pattern

### useAdminDashboard.ts
```typescript
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getGrowthChart } from "@/lib/api/admin";

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => getDashboardStats(),
    refetchInterval: 30000, // 30 seconds
  });
}

export function useGrowthChart(params) {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'growth', params],
    queryFn: () => getGrowthChart(params),
  });
}
```

### useAdminUsers.ts
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, banUser, unbanUser, warnUser } from "@/lib/api/admin";

export function useAdminUsers(filters = {}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => getUsers(filters),
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      banUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unbanUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
```

## Query Keys Convention

```typescript
export const queryKeys = {
  dashboard: {
    stats: ['admin', 'dashboard', 'stats'],
    growth: (params) => ['admin', 'dashboard', 'growth', params],
  },
  users: {
    list: (filters) => ['admin', 'users', filters],
    detail: (id) => ['admin', 'users', id],
  },
  posts: {
    list: (filters) => ['admin', 'posts', filters],
    detail: (id) => ['admin', 'posts', id],
  },
  reports: {
    list: (filters) => ['admin', 'reports', filters],
    detail: (id) => ['admin', 'reports', id],
  },
  audit: {
    list: (filters) => ['admin', 'audit', filters],
  },
  analytics: {
    chart: (type, params) => ['admin', 'analytics', type, params],
  },
  health: {
    status: ['admin', 'health', 'status'],
    metrics: ['admin', 'health', 'metrics'],
  },
  comments: {
    list: (filters) => ['admin', 'comments', filters],
  },
};
```

## PrimeReact Toast Integration

```typescript
// Trong hooks, sử dụng toast từ useOverlay
import { useOverlay } from "@/components/RootProvider";

export function useBanUser() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      banUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast({ severity: 'success', summary: 'Thành công', detail: 'Đã ban user' });
    },
    onError: (error) => {
      showToast({ severity: 'error', summary: 'Lỗi', detail: error.message });
    },
  });
}
```

## Context Search khi cần
```
AGENT_DEV_GUIDE.md → Section 3: "fetchWrapper"
AGENT_DEV_GUIDE.md → Section 4: "Pattern Thêm API Service Mới"
AGENT_DEV_GUIDE.md → Section 2: "Custom Hooks" (useOverlay)
admin_frontend_app_router.md → "API Integration Layer"
admin_frontend_app_router.md → "React Query Keys"
```

## Output
- lib/api/admin.ts
- types/admin.d.ts
- hooks/queries/*.ts (9 files)

## Tick ✅ khi hoàn thành
- [ ] API functions đầy đủ cho tất cả pages
- [ ] TypeScript types cho admin
- [ ] React Query hooks với proper invalidation
- [ ] Toast integration cho mutations
- [ ] Query keys convention
- [ ] Error handling
- [ ] Loading states
