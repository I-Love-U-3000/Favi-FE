import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import { useOverlay } from "@/components/RootProvider";
import { PagedResult, UserDto, TopPostDto as UserPostDto } from "@/lib/api/admin";

export interface UsersFilter {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface UserWarnHistoryDto {
  id: string;
  profileId: string;
  actionType: "Ban" | "Warn";
  reason: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  active: boolean;
  adminActionId: string;
  adminId: string;
}

export interface UserBanHistoryDto {
  id: string;
  profileId: string;
  actionType: "Ban" | "Warn";
  reason: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  active: boolean;
  adminActionId: string;
  adminId: string;
}

export interface BanHistoryResponse {
  bans: UserBanHistoryDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeBan: UserBanHistoryDto | null;
}

export function useAdminUsers(filters: UsersFilter = {}) {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.role) queryParams.append("role", filters.role);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.pageSize) queryParams.append("pageSize", filters.pageSize.toString());

  return useQuery<PagedResult<UserDto>>({
    queryKey: ["admin", "users", filters],
    queryFn: () =>
      fetchWrapper.get<PagedResult<UserDto>>(
        `/admin/analytics/users?${queryParams.toString()}`
      ),
  });
}

export function useUser(userId: string) {
  return useQuery<UserDto>({
    queryKey: ["admin", "users", userId],
    queryFn: () => fetchWrapper.get<UserDto>(`/profiles/${userId}`),
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data when userId changes
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      fetchWrapper.post(`/admin/users/${userId}/ban`, { reason }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "ban"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "User has been banned",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to ban user",
      });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: (userId: string) =>
      fetchWrapper.del(`/admin/users/${userId}/ban`),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "ban"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "User has been unbanned",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to unban user",
      });
    },
  });
}

export function useWarnUser() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      fetchWrapper.post(`/admin/users/${userId}/warn`, { reason }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "warns"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Warning has been sent to user",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to warn user",
      });
    },
  });
}

export function useBulkBan() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ profileIds, reason }: { profileIds: string[]; reason?: string }) =>
      fetchWrapper.post(`/admin/users/bulk/ban`, { profileIds, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Users have been banned",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to ban users",
      });
    },
  });
}

export function useBulkUnban() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: (profileIds: string[]) =>
      fetchWrapper.post(`/admin/users/bulk/unban`, { profileIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Users have been unbanned",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to unban users",
      });
    },
  });
}

export function useBulkWarn() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ profileIds, reason }: { profileIds: string[]; reason?: string }) =>
      fetchWrapper.post(`/admin/users/bulk/warn`, { profileIds, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Warnings have been sent",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to warn users",
      });
    },
  });
}

// User Detail queries
export function useUserPosts(userId: string) {
  return useQuery<PagedResult<UserPostDto>>({
    queryKey: ["admin", "users", userId, "posts"],
    queryFn: () =>
      fetchWrapper.get<PagedResult<UserPostDto>>(
        `/admin/analytics/posts?authorId=${userId}`
      ),
    enabled: !!userId,
    staleTime: 0,
  });
}

export interface WarnHistoryResponse {
  warnings: UserWarnHistoryDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useUserWarnHistory(userId: string) {
  return useQuery<WarnHistoryResponse>({
    queryKey: ["admin", "users", userId, "warns"],
    queryFn: () =>
      fetchWrapper.get<WarnHistoryResponse>(
        `/admin/users/${userId}/warnings`
      ),
    enabled: !!userId,
    staleTime: 0,
  });
}

export function useUserBanHistory(userId: string) {
  return useQuery<BanHistoryResponse>({
    queryKey: ["admin", "users", userId, "ban"],
    queryFn: () =>
      fetchWrapper.get<BanHistoryResponse>(
        `/admin/users/${userId}/ban-history?pageSize=100`
      ),
    enabled: !!userId,
    staleTime: 0,
  });
}

export function useUserAuditLogs(userId: string) {
  return useQuery<PagedResult<any>>({
    queryKey: ["admin", "users", userId, "audit"],
    queryFn: () =>
      fetchWrapper.get<PagedResult<any>>(
        `/admin/audit?targetProfileId=${userId}`
      ),
    enabled: !!userId,
    staleTime: 0,
  });
}
