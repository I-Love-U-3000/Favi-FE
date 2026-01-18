"use client";

import { fetchWrapper } from "@/lib/fetchWrapper";

// ============================================================================
// Common Types
// ============================================================================

export interface PagedResult<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  users: { total: number; active: number; banned: number; today: number };
  posts: { total: number; today: number };
  reports: { pending: number; resolved: number; rejected: number };
  banned: number;
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

export interface TopItem {
  id: string;
  username?: string;
  displayName?: string;
  avatar: string;
  likeCount: number;
  commentCount: number;
  caption?: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface UserDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  role: "user" | "admin";
  status: "active" | "banned" | "inactive";
  createdAt: string;
  lastActiveAt: string;
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
  mediaUrl: string;
  mediaType: "image" | "video";
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  privacy: "public" | "private" | "followers";
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

// ============================================================================
// Report Types
// ============================================================================

export interface ReportDto {
  id: string;
  targetType: "post" | "user" | "comment";
  targetId: string;
  target: {
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
  reporter: {
    id: string;
    username: string;
    avatar: string;
    displayName: string;
  };
  reason: string;
  reasonCode: "spam" | "harassment" | "inappropriate" | "misinformation" | "other";
  status: "pending" | "resolved" | "rejected";
  notes?: string;
  createdAt: string;
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
// Health Types
// ============================================================================

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
}

export interface SystemMetrics {
  cpu: {
    usagePercent: number;
    cores: number;
  };
  memory: {
    usedMB: number;
    totalMB: number;
    usagePercent: number;
  };
  disk: {
    usedGB: number;
    totalGB: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
}

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  responseTimeMs: number;
  message?: string;
  details?: Record<string, any>;
}

export interface DetailedHealth {
  overall: HealthStatus;
  metrics: SystemMetrics;
  services: ServiceHealth[];
  database: {
    status: "healthy" | "degraded" | "unhealthy";
    responseTimeMs: number;
    connections: number;
    maxConnections: number;
  };
  cache: {
    status: "healthy" | "degraded" | "unhealthy";
    connected: boolean;
    hitRate: number;
  };
  storage: {
    status: "healthy" | "degraded" | "unhealthy";
    availableGB: number;
    usedGB: number;
  };
}

// ============================================================================
// API Functions - Dashboard
// ============================================================================

export const getDashboardStats = async (): Promise<DashboardStats> => {
  return fetchWrapper.get<DashboardStats>("/api/admin/analytics");
};

export const getGrowthChart = async (params?: { startDate?: string; endDate?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  return fetchWrapper.get<GrowthChartData>(
    `/api/admin/analytics/charts/growth?${queryParams.toString()}`
  );
};

export const getUserStatusChart = async (): Promise<UserStatusChartData> => {
  return fetchWrapper.get<UserStatusChartData>("/api/admin/analytics/charts/user-status");
};

export const getTopUsers = async (limit = 5): Promise<TopItem[]> => {
  return fetchWrapper.get<TopItem[]>(`/api/admin/analytics/top-users?limit=${limit}`);
};

export const getTopPosts = async (limit = 5): Promise<TopItem[]> => {
  return fetchWrapper.get<TopItem[]>(`/api/admin/analytics/top-posts?limit=${limit}`);
};

// ============================================================================
// API Functions - Users
// ============================================================================

export const getUsers = async (
  params: { search?: string; role?: string; status?: string; skip?: number; take?: number }
): Promise<PagedResult<UserDto>> => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append("search", params.search);
  if (params.role) queryParams.append("role", params.role);
  if (params.status) queryParams.append("status", params.status);
  if (params.skip) queryParams.append("skip", params.skip.toString());
  if (params.take) queryParams.append("take", params.take.toString());
  return fetchWrapper.get<PagedResult<UserDto>>(
    `/api/admin/analytics/users?${queryParams.toString()}`
  );
};

export const getUser = async (id: string): Promise<UserDto> => {
  return fetchWrapper.get<UserDto>(`/api/profiles/${id}`);
};

export const banUser = async (profileId: string, reason: string) => {
  return fetchWrapper.post(`/api/admin/users/${profileId}/ban`, { reason });
};

export const unbanUser = async (profileId: string) => {
  return fetchWrapper.del(`/api/admin/users/${profileId}/ban`);
};

export const warnUser = async (profileId: string, reason: string) => {
  return fetchWrapper.post(`/api/admin/users/${profileId}/warn`, { reason });
};

export const bulkBanUsers = async (profileIds: string[], reason: string) => {
  return fetchWrapper.post("/api/admin/users/bulk/ban", { profileIds, reason });
};

export const bulkUnbanUsers = async (profileIds: string[]) => {
  return fetchWrapper.post("/api/admin/users/bulk/unban", { profileIds });
};

export const bulkWarnUsers = async (profileIds: string[], reason: string) => {
  return fetchWrapper.post("/api/admin/users/bulk/warn", { profileIds, reason });
};

export const getUserWarnings = async (userId: string): Promise<UserWarning[]> => {
  return fetchWrapper.get<UserWarning[]>(`/api/admin/users/${userId}/warnings`);
};

export const getUserActivity = async (userId: string): Promise<UserActivity[]> => {
  return fetchWrapper.get<UserActivity[]>(`/api/admin/users/${userId}/activity`);
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
    `/api/admin/analytics/posts?${queryParams.toString()}`
  );
};

export const getPost = async (id: string): Promise<PostDto> => {
  return fetchWrapper.get<PostDto>(`/api/admin/analytics/posts/${id}`);
};

export const deletePost = async (postId: string, reason?: string) => {
  return fetchWrapper.del(`/api/admin/content/posts/${postId}`, { reason });
};

export const bulkDeletePosts = async (postIds: string[], reason?: string) => {
  return fetchWrapper.post("/api/admin/content/posts/bulk/delete", { postIds, reason });
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
    `/api/admin/reports?${queryParams.toString()}`
  );
};

export const getReport = async (id: string): Promise<ReportDto> => {
  return fetchWrapper.get<ReportDto>(`/api/admin/reports/${id}`);
};

export const resolveReport = async (
  reportId: string,
  data: { action: "delete" | "resolve"; notes?: string }
) => {
  return fetchWrapper.post(`/api/admin/reports/${reportId}/resolve`, data);
};

export const rejectReport = async (reportId: string, reason?: string) => {
  return fetchWrapper.post(`/api/admin/reports/${reportId}/reject`, { reason });
};

export const bulkResolveReports = async (
  reportIds: string[],
  action: "delete" | "resolve"
) => {
  return fetchWrapper.post("/api/admin/reports/bulk/resolve", { reportIds, action });
};

export const bulkRejectReports = async (reportIds: string[], reason?: string) => {
  return fetchWrapper.post("/api/admin/reports/bulk/reject", { reportIds, reason });
};

export const getReportStats = async (): Promise<{
  pending: number;
  resolved: number;
  rejected: number;
}> => {
  return fetchWrapper.get("/api/admin/reports/stats");
};

export const getReportHistory = async (reportId: string): Promise<ReportHistoryItem[]> => {
  return fetchWrapper.get<ReportHistoryItem[]>(`/api/admin/reports/${reportId}/history`);
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
    `/api/admin/comments?${queryParams.toString()}`
  );
};

export const getComment = async (id: string): Promise<CommentDto> => {
  return fetchWrapper.get<CommentDto>(`/api/admin/comments/${id}`);
};

export const deleteComment = async (commentId: string, reason?: string) => {
  return fetchWrapper.del(`/api/admin/content/comments/${commentId}`, { reason });
};

export const bulkDeleteComments = async (commentIds: string[], reason?: string) => {
  return fetchWrapper.post("/api/admin/content/comments/bulk/delete", { commentIds, reason });
};

export const getCommentStats = async (): Promise<{
  total: number;
  deleted: number;
  hidden: number;
  active: number;
}> => {
  return fetchWrapper.get("/api/admin/comments/stats");
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
    `/api/admin/audit?${queryParams.toString()}`
  );
};

export const getActionTypes = async (): Promise<ActionType[]> => {
  return fetchWrapper.get<ActionType[]>("/api/admin/audit/action-types");
};

export const getAuditAdmins = async (): Promise<AdminOption[]> => {
  return fetchWrapper.get<AdminOption[]>("/api/admin/audit/admins");
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
    `/api/admin/analytics/charts/user-activity?${queryParams.toString()}`
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
    `/api/admin/analytics/charts/content-activity?${queryParams.toString()}`
  );
};

export const getUserRolesChart = async (): Promise<PieChartData> => {
  return fetchWrapper.get<PieChartData>("/api/admin/analytics/charts/user-roles");
};

export const getPostPrivacyChart = async (): Promise<PieChartData> => {
  return fetchWrapper.get<PieChartData>("/api/admin/analytics/charts/post-privacy");
};

export const getReportStatusChart = async (): Promise<PieChartData> => {
  return fetchWrapper.get<PieChartData>("/api/admin/analytics/charts/report-status");
};

export const getPeriodComparison = async (
  period: "week" | "month"
): Promise<PeriodComparisonData> => {
  return fetchWrapper.get<PeriodComparisonData>(
    `/api/admin/analytics/comparison?period=${period}`
  );
};

// ============================================================================
// API Functions - Health
// ============================================================================

export const getHealth = async (): Promise<HealthStatus> => {
  return fetchWrapper.get<HealthStatus>("/api/admin/health");
};

export const getHealthMetrics = async (): Promise<SystemMetrics> => {
  return fetchWrapper.get<SystemMetrics>("/api/admin/health/metrics");
};

export const getHealthDetailed = async (): Promise<DetailedHealth> => {
  return fetchWrapper.get<DetailedHealth>("/api/admin/health/detailed");
};

// ============================================================================
// API Functions - Export
// ============================================================================

export const exportUsers = async (format: string) => {
  return fetchWrapper.get(`/api/admin/export/users?format=${format}`, undefined, {
    responseType: "blob",
  });
};

export const exportPosts = async (format: string) => {
  return fetchWrapper.get(`/api/admin/export/posts?format=${format}`, undefined, {
    responseType: "blob",
  });
};

export const exportReports = async (format: string) => {
  return fetchWrapper.get(`/api/admin/export/reports?format=${format}`, undefined, {
    responseType: "blob",
  });
};

export const exportAuditLogs = async (
  format: string,
  params?: Record<string, string>
) => {
  const queryParams = new URLSearchParams({ format, ...params });
  return fetchWrapper.get(`/api/admin/export/audit-logs?${queryParams.toString()}`, undefined, {
    responseType: "blob",
  });
};

export const exportComments = async (format: string) => {
  return fetchWrapper.get(`/api/admin/export/comments?format=${format}`, undefined, {
    responseType: "blob",
  });
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
