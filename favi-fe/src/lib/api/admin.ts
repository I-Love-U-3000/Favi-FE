"use client";

import { fetchWrapper } from "@/lib/fetchWrapper";

// ============================================================================
// Common Types
// ============================================================================

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  activeUsers: number;
  bannedUsers: number;
  pendingReports: number;
  todayPosts: number;
  todayUsers: number;
}

export interface GrowthChartData {
  labels: string[];
  users: number[];
  posts: number[];
}

export interface UserStatusChartData {
  active: number;
  banned: number;
  inactive: number;
}

export interface TopUserDto {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  avatar?: string;
  postsCount: number;
  followersCount: number;
  reactionsReceived: number;
  likeCount?: number;
  commentCount?: number;
}

export interface TopPostDto {
  id: string;
  authorProfileId: string;
  authorUsername: string;
  caption: string;
  createdAt: string;
  reactionsCount: number;
  commentsCount: number;
  mediaUrl?: string;
  likeCount?: number;
  commentCount?: number;
  author?: {
    username: string;
  };
}

export type TopItem = TopUserDto | TopPostDto;

// ============================================================================
// User Types
// ============================================================================

export interface UserDto {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  createdAt: string;
  lastActiveAt: string;
  isBanned: boolean;
  bannedUntil?: string;
  role: string;
  postsCount: number;
  followersCount: number;
}

export interface UserWarning {
  id: string;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface UserActivity {
  id: string;
  action: string;
  target: string;
  createdAt: string;
}

// ============================================================================
// Post Types
// ============================================================================

export interface PostDto {
  id: string;
  caption: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  authorProfileId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorAvatar?: string;
  // author is kept for compatibility if needed, but analytics returns top level fields
  author?: {
    id: string;
    username: string;
    avatar: string;
  };
  privacyLevel: number | string;
  privacy: "public" | "private" | "followers";
  reactionsCount: number;
  commentsCount: number;
  likeCount?: number; // legacy
  commentCount?: number; // legacy
  createdAt: string;
  isDeleted: boolean;
}

// ============================================================================
// Report Types
// ============================================================================

export interface ReportDto {
  id: string;
  targetType: "post" | "user" | "comment" | "Post" | "User" | "Comment";
  targetId: string;
  reporterProfileId: string;
  // Optional nested objects - may not be populated by backend
  target?: {
    id: string;
    caption?: string;
    content?: string;
    mediaUrl?: string;
    author?: {
      id: string;
      username: string;
      avatar: string;
      displayName: string;
    };
  };
  reporter?: {
    id: string;
    username: string;
    avatar: string;
    displayName: string;
  };
  reason: string;
  reasonCode?: "spam" | "harassment" | "inappropriate" | "misinformation" | "other";
  status: "pending" | "resolved" | "rejected" | "Pending" | "Resolved" | "Rejected";
  notes?: string;
  data?: any;
  createdAt: string;
  actedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ReportHistoryItem {
  id: string;
  action: string;
  description: string;
  performedBy: {
    id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

// ============================================================================
// Comment Types
// ============================================================================

export interface CommentDto {
  id: string;
  content: string;
  postId: string;
  post?: {
    id: string;
    caption?: string;
    author?: {
      id: string;
      username: string;
      avatar: string;
    };
  };
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  parentId?: string;
  parent?: {
    id: string;
    content: string;
    author: {
      username: string;
    };
  };
  likeCount: number;
  replyCount: number;
  status: "active" | "deleted" | "hidden";
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLogDto {
  id: string;
  admin: {
    id: string;
    username: string;
    avatar: string;
    displayName: string;
  };
  action: string;
  actionType: string;
  targetType: string;
  targetId: string;
  target?: {
    id: string;
    caption?: string;
    content?: string;
    username?: string;
    author?: {
      id: string;
      username: string;
      avatar: string;
    };
  };
  details: string;
  createdAt: string;
}

export interface ActionType {
  value: string;
  label: string;
  color: string;
  icon: string;
}

export interface AdminOption {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface UserActivityChartData {
  labels: string[];
  dau: number[];
  newRegistrations: number[];
}

export interface ContentActivityChartData {
  labels: string[];
  posts: number[];
  comments: number[];
  likes: number[];
}

export interface PieChartData {
  labels: string[];
  data: number[];
}

export interface PeriodComparisonData {
  users: { current: number; previous: number; change: number };
  posts: { current: number; previous: number; change: number };
  reports: { current: number; previous: number; change: number };
}

// ============================================================================
// Health Types (Backend: HealthStatusResponse)
// ============================================================================

export interface HealthStatus {
  status: "Healthy" | "Degraded" | "Unhealthy" | "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  totalDurationMs: number;
  entries: HealthCheckEntryDto[];
}

export interface HealthCheckEntryDto {
  name: string;
  status: string;
  description?: string;
  durationMs: number;
  data?: Record<string, unknown>;
  exception?: string;
  tags: string[];
}

// ============================================================================
// System Metrics Types (Backend: SystemMetricsResponse)
// ============================================================================

export interface SystemMetrics {
  memory: {
    workingSetMB: number;
    privateMemoryMB: number;
    gcMemoryMB: number;
  };
  cpu: {
    usagePercent: number;
  };
  process: {
    threadCount: number;
    handleCount: number;
    uptimeSeconds: number;
    uptimeFormatted: string;
  };
  garbageCollection: {
    gen0Collections: number;
    gen1Collections: number;
    gen2Collections: number;
  };
  timestamp: string;
}

// ============================================================================
// Detailed Health Types (Backend: DetailedHealthResponse)
// ============================================================================

export interface ServiceHealth {
  name: string;
  status: string;
  message?: string;
  responseTimeMs: number;
  data?: Record<string, unknown>;
}

export interface DatabaseHealth {
  status: string;
  message?: string;
  responseTimeMs: number;
}

export interface DetailedHealth {
  overallStatus: string;
  timestamp: string;
  totalCheckDurationMs: number;
  metrics: SystemMetrics;
  services: ServiceHealth[];
  database: DatabaseHealth;
  entries?: HealthCheckEntryDto[]; // Fallback từ /api/admin/health
}

// ============================================================================
// API Functions - Dashboard
// ============================================================================

export const getDashboardStats = async (): Promise<DashboardStats> => {
  return fetchWrapper.get<DashboardStats>("/admin/analytics");
};

export const getGrowthChart = async (params?: { startDate?: string; endDate?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  return fetchWrapper.get<GrowthChartData>(
    `/admin/analytics/charts/growth?${queryParams.toString()}`
  );
};

export const getUserStatusChart = async (): Promise<UserStatusChartData> => {
  return fetchWrapper.get<UserStatusChartData>("/admin/analytics/charts/user-status");
};

export const getTopUsers = async (limit = 5): Promise<TopItem[]> => {
  return fetchWrapper.get<TopItem[]>(`/admin/analytics/top-users?limit=${limit}`);
};

export const getTopPosts = async (limit = 5): Promise<TopItem[]> => {
  return fetchWrapper.get<TopItem[]>(`/admin/analytics/top-posts?limit=${limit}`);
};

// ============================================================================
// API Functions - Users
// ============================================================================

export const getUsers = async (
  params: { search?: string; role?: string; status?: string; page?: number; pageSize?: number }
): Promise<PagedResult<UserDto>> => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.role) queryParams.append("role", params.role);
  if (params.status) queryParams.append("status", params.status);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
  return fetchWrapper.get<PagedResult<UserDto>>(
    `/admin/analytics/users?${queryParams.toString()}`
  );
};

export const getUser = async (id: string): Promise<UserDto> => {
  return fetchWrapper.get<UserDto>(`/profiles/${id}`);
};

export const banUser = async (profileId: string, reason: string) => {
  return fetchWrapper.post(`/admin/users/${profileId}/ban`, { reason });
};

export const unbanUser = async (profileId: string) => {
  return fetchWrapper.del(`/admin/users/${profileId}/ban`);
};

export const warnUser = async (profileId: string, reason: string) => {
  return fetchWrapper.post(`/admin/users/${profileId}/warn`, { reason });
};

export const bulkBanUsers = async (profileIds: string[], reason: string) => {
  return fetchWrapper.post("/admin/users/bulk/ban", { profileIds, reason });
};

export const bulkUnbanUsers = async (profileIds: string[]) => {
  return fetchWrapper.post("/admin/users/bulk/unban", { profileIds });
};

export const bulkWarnUsers = async (profileIds: string[], reason: string) => {
  return fetchWrapper.post("/admin/users/bulk/warn", { profileIds, reason });
};

export const getUserWarnings = async (userId: string): Promise<UserWarning[]> => {
  return fetchWrapper.get<UserWarning[]>(`/admin/users/${userId}/warnings`);
};

export const getUserActivity = async (userId: string): Promise<UserActivity[]> => {
  return fetchWrapper.get<UserActivity[]>(`/admin/users/${userId}/activity`);
};

// ============================================================================
// API Functions - Posts
// ============================================================================

export const getPosts = async (
  params: { search?: string; privacy?: string; status?: string; skip?: number; take?: number }
): Promise<PagedResult<PostDto>> => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.privacy) queryParams.append("privacy", params.privacy);
  if (params.status) queryParams.append("status", params.status);
  if (params.skip) queryParams.append("skip", params.skip.toString());
  if (params.take) queryParams.append("take", params.take.toString());
  return fetchWrapper.get<PagedResult<PostDto>>(
    `/admin/analytics/posts?${queryParams.toString()}`
  );
};

export const getPost = async (id: string): Promise<PostDto> => {
  return fetchWrapper.get<PostDto>(`/admin/analytics/posts/${id}`);
};

export const deletePost = async (postId: string, reason?: string) => {
  return fetchWrapper.del(`/admin/content/posts/${postId}`, { reason });
};

export const bulkDeletePosts = async (postIds: string[], reason?: string) => {
  return fetchWrapper.post("/admin/content/posts/bulk/delete", { postIds, reason });
};

// ============================================================================
// API Functions - Reports
// ============================================================================

export const getReports = async (
  params: {
    search?: string;
    status?: string;
    targetType?: string;
    reason?: string;
    skip?: number;
    take?: number;
  }
): Promise<PagedResult<ReportDto>> => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.status) queryParams.append("status", params.status);
  if (params.targetType) queryParams.append("targetType", params.targetType);
  if (params.reason) queryParams.append("reason", params.reason);
  if (params.skip) queryParams.append("skip", params.skip.toString());
  if (params.take) queryParams.append("take", params.take.toString());
  return fetchWrapper.get<PagedResult<ReportDto>>(
    `/admin/reports?${queryParams.toString()}`
  );
};

export const getReport = async (id: string): Promise<ReportDto> => {
  return fetchWrapper.get<ReportDto>(`/admin/reports/${id}`);
};

export const resolveReport = async (
  reportId: string,
  data: { action: "delete" | "resolve"; notes?: string }
) => {
  return fetchWrapper.post(`/admin/reports/${reportId}/resolve`, data);
};

export const rejectReport = async (reportId: string, reason?: string) => {
  return fetchWrapper.post(`/admin/reports/${reportId}/reject`, { reason });
};

export const bulkResolveReports = async (
  reportIds: string[],
  action: "delete" | "resolve"
) => {
  return fetchWrapper.post("/admin/reports/bulk/resolve", { reportIds, action });
};

export const bulkRejectReports = async (reportIds: string[], reason?: string) => {
  return fetchWrapper.post("/admin/reports/bulk/reject", { reportIds, reason });
};

export const getReportStats = async (): Promise<{
  pending: number;
  resolved: number;
  rejected: number;
}> => {
  return fetchWrapper.get("/admin/reports/stats");
};

export const getReportHistory = async (reportId: string): Promise<ReportHistoryItem[]> => {
  return fetchWrapper.get<ReportHistoryItem[]>(`/admin/reports/${reportId}/history`);
};

// ============================================================================
// API Functions - Comments
// ============================================================================

export const getComments = async (
  params: {
    search?: string;
    postId?: string;
    authorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
  }
): Promise<PagedResult<CommentDto>> => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.postId) queryParams.append("postId", params.postId);
  if (params.authorId) queryParams.append("authorId", params.authorId);
  if (params.status) queryParams.append("status", params.status);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.skip) queryParams.append("skip", params.skip.toString());
  if (params.take) queryParams.append("take", params.take.toString());
  return fetchWrapper.get<PagedResult<CommentDto>>(
    `/admin/comments?${queryParams.toString()}`
  );
};

export const getComment = async (id: string): Promise<CommentDto> => {
  return fetchWrapper.get<CommentDto>(`/admin/comments/${id}`);
};

export const deleteComment = async (commentId: string, reason?: string) => {
  return fetchWrapper.del(`/admin/content/comments/${commentId}`, { reason });
};

export const bulkDeleteComments = async (commentIds: string[], reason?: string) => {
  return fetchWrapper.post("/admin/content/comments/bulk/delete", { commentIds, reason });
};

export const getCommentStats = async (): Promise<{
  total: number;
  deleted: number;
  hidden: number;
  active: number;
}> => {
  return fetchWrapper.get("/admin/comments/stats");
};

// ============================================================================
// API Functions - Audit Logs
// ============================================================================

export const getAuditLogs = async (
  params: {
    search?: string;
    actionType?: string;
    adminId?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
  }
): Promise<PagedResult<AuditLogDto>> => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.actionType) queryParams.append("actionType", params.actionType);
  if (params.adminId) queryParams.append("adminId", params.adminId);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);
  if (params.skip) queryParams.append("skip", params.skip.toString());
  if (params.take) queryParams.append("take", params.take.toString());
  return fetchWrapper.get<PagedResult<AuditLogDto>>(
    `/admin/audit?${queryParams.toString()}`
  );
};

export const getActionTypes = async (): Promise<ActionType[]> => {
  return fetchWrapper.get<ActionType[]>("/admin/audit/action-types");
};

export const getAuditAdmins = async (): Promise<AdminOption[]> => {
  return fetchWrapper.get<AdminOption[]>("/admin/audit/admins");
};

// ============================================================================
// API Functions - Analytics
// ============================================================================

export const getUserActivityChart = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<UserActivityChartData> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  return fetchWrapper.get<UserActivityChartData>(
    `/admin/analytics/charts/user-activity?${queryParams.toString()}`
  );
};

export const getContentActivityChart = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ContentActivityChartData> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  return fetchWrapper.get<ContentActivityChartData>(
    `/admin/analytics/charts/content-activity?${queryParams.toString()}`
  );
};

export const getUserRolesChart = async (): Promise<PieChartData> => {
  return fetchWrapper.get<PieChartData>("/admin/analytics/charts/user-roles");
};

export const getPostPrivacyChart = async (): Promise<PieChartData> => {
  return fetchWrapper.get<PieChartData>("/admin/analytics/charts/post-privacy");
};

export const getReportStatusChart = async (): Promise<PieChartData> => {
  return fetchWrapper.get<PieChartData>("/admin/analytics/charts/report-status");
};

export const getPeriodComparison = async (
  period: "week" | "month"
): Promise<PeriodComparisonData> => {
  return fetchWrapper.get<PeriodComparisonData>(
    `/admin/analytics/comparison?period=${period}`
  );
};

// ============================================================================
// API Functions - Health
// ============================================================================

export const getHealth = async (): Promise<HealthStatus> => {
  return fetchWrapper.get<HealthStatus>("/admin/health");
};

export const getHealthMetrics = async (): Promise<SystemMetrics> => {
  return fetchWrapper.get<SystemMetrics>("/admin/health/metrics");
};

export const getHealthDetailed = async (): Promise<DetailedHealth> => {
  return fetchWrapper.get<DetailedHealth>("/admin/health/detailed");
};

// ============================================================================
// API Functions - Export
// ============================================================================

export const exportUsers = async (format: string) => {
  return fetchWrapper.get<Blob>(`/admin/export/users?format=${format}`);
};

export const exportPosts = async (format: string) => {
  return fetchWrapper.get<Blob>(`/admin/export/posts?format=${format}`);
};

export const exportReports = async (format: string) => {
  return fetchWrapper.get<Blob>(`/admin/export/reports?format=${format}`);
};

export const exportAuditLogs = async (
  format: string,
  params?: Record<string, string>
) => {
  const queryParams = new URLSearchParams({ format, ...params });
  return fetchWrapper.get<Blob>(`/admin/export/audit-logs?${queryParams.toString()}`);
};

export const exportComments = async (format: string) => {
  return fetchWrapper.get<Blob>(`/admin/export/comments?format=${format}`);
}

// ============================================================================
// Helper Functions
// ============================================================================

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
  return `${bytes} B`;
}
