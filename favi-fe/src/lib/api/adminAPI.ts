// src/lib/api/adminAPI.ts
import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  PagedResult,
  ReportResponse,
  ReportStatus,
  ReportTarget,
  CreateReportRequest,
  UpdateReportStatusRequest,
} from "@/types";
import type {
  AnalyticsPostDto,
  AnalyticsUserDto,
  AdminDeleteContentRequest,
  BanUserRequest,
  DashboardStatsResponse,
  UnbanUserRequest,
  UserModerationResponse,
  WarnUserRequest,
} from "@/types/admin";

// ==================== Reports API ====================
export const reportsAPI = {
  // Get all reports (admin only) - GET /api/reports?page=1&pageSize=20
  getAll: async (page: number = 1, pageSize: number = 20) =>
    fetchWrapper.get<PagedResult<ReportResponse>>(
      `/reports?page=${page}&pageSize=${pageSize}`
    ),

  // Update report status (admin only) - PUT /api/reports/{id}
  updateStatus: async (reportId: string, dto: UpdateReportStatusRequest) =>
    fetchWrapper.put<{ message: string }>(`/reports/${reportId}`, dto),

  // Get reports by target type (admin only) - GET /api/reports/target-type?targetType=Post&page=1&pageSize=20
  getByTargetType: async (
    targetType: ReportTarget,
    page: number = 1,
    pageSize: number = 20
  ) =>
    fetchWrapper.get<PagedResult<ReportResponse>>(
      `/reports/target-type?targetType=${ReportTarget[targetType]}&page=${page}&pageSize=${pageSize}`
    ),

  // Get my reports - GET /api/reports/my?page=1&pageSize=20
  getMyReports: async (page: number = 1, pageSize: number = 20) =>
    fetchWrapper.get<PagedResult<ReportResponse>>(
      `/reports/my?page=${page}&pageSize=${pageSize}`
    ),

  // Get reports by target - GET /api/reports/target/{targetId}?page=1&pageSize=20
  getByTarget: async (targetId: string, page: number = 1, pageSize: number = 20) =>
    fetchWrapper.get<PagedResult<ReportResponse>>(
      `/reports/target/${targetId}?page=${page}&pageSize=${pageSize}`
    ),

  // Create a report - POST /api/reports
  create: async (dto: Omit<CreateReportRequest, "reporterProfileId">) =>
    fetchWrapper.post<ReportResponse>("/reports", dto),
};

// ==================== Admin Users API ====================
export const adminUsersAPI = {
  // Ban user - POST /api/admin/users/{profileId}/ban
  banUser: async (profileId: string, dto: BanUserRequest) =>
    fetchWrapper.post<UserModerationResponse>(
      `/admin/users/${profileId}/ban`,
      dto
    ),

  // Unban user - DELETE /api/admin/users/{profileId}/ban
  unbanUser: async (profileId: string, dto?: UnbanUserRequest) =>
    fetchWrapper.del<{ message: string }>(
      `/admin/users/${profileId}/ban`,
      dto ?? {}
    ),

  // Warn user - POST /api/admin/users/{profileId}/warn
  warnUser: async (profileId: string, dto: WarnUserRequest) =>
    fetchWrapper.post<{ message: string }>(
      `/admin/users/${profileId}/warn`,
      dto
    ),
};

// ==================== Admin Analytics API ====================
export const adminAnalyticsAPI = {
  // Get dashboard analytics - GET /api/admin/analytics
  getDashboard: async () =>
    fetchWrapper.get<DashboardStatsResponse>("/admin/analytics"),

  // Get user analytics - GET /api/admin/analytics/users?page=1&pageSize=20
  getUsersAnalytics: async (page: number = 1, pageSize: number = 20) =>
    fetchWrapper.get<PagedResult<AnalyticsUserDto>>(
      `/admin/analytics/users?page=${page}&pageSize=${pageSize}`
    ),

  // Get post analytics - GET /api/admin/analytics/posts?page=1&pageSize=20
  getPostsAnalytics: async (page: number = 1, pageSize: number = 20) =>
    fetchWrapper.get<PagedResult<AnalyticsPostDto>>(
      `/admin/analytics/posts?page=${page}&pageSize=${pageSize}`
    ),
};

// ==================== Admin Content Management API ====================
export const adminContentAPI = {
  // Delete post - DELETE /api/admin/content/posts/{postId}
  deletePost: async (postId: string, dto: AdminDeleteContentRequest) =>
    fetchWrapper.del<{ message: string }>(
      `/admin/content/posts/${postId}`,
      dto
    ),

  // Delete collection - DELETE /api/admin/content/collections/{collectionId}
  deleteCollection: async (collectionId: string, dto: AdminDeleteContentRequest) =>
    fetchWrapper.del<{ message: string }>(
      `/admin/content/collections/${collectionId}`,
      dto
    ),
};

export default { reportsAPI, adminUsersAPI, adminAnalyticsAPI, adminContentAPI };
