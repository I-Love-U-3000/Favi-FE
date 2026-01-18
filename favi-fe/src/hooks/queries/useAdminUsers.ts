import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import { useOverlay } from "@/components/RootProvider";
import { PagedResult, UserDto } from "@/lib/api/admin";

export interface UsersFilter {
  search?: string;
  role?: string;
  status?: string;
  skip?: number;
  take?: number;
}

// User Detail types
export interface UserPostDto {
  id: string;
  caption: string;
  mediaUrl: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface UserWarnHistoryDto {
  id: string;
  reason: string;
  createdAt: string;
  adminId: string;
  adminName: string;
}

export interface UserBanHistoryDto {
  id: string;
  reason: string;
  createdAt: string;
  adminId: string;
  adminName: string;
}

export function useAdminUsers(filters: UsersFilter = {}) {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.role) queryParams.append("role", filters.role);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.skip) queryParams.append("skip", filters.skip.toString());
  if (filters.take) queryParams.append("take", filters.take.toString());

  return useQuery<PagedResult<UserDto>>({
    queryKey: ["admin", "users", filters],
    queryFn: () =>
      fetchWrapper.get<PagedResult<UserDto>>(
        `/api/admin/analytics/users?${queryParams.toString()}`
      ),
  });
}

export function useUser(userId: string) {
  return useQuery<UserDto>({
    queryKey: ["admin", "users", userId],
    queryFn: () => fetchWrapper.get<UserDto>(`/api/profiles/${userId}`),
    enabled: !!userId,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      fetchWrapper.post(`/api/admin/users/${userId}/ban`, { reason }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
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
      fetchWrapper.del(`/api/admin/users/${userId}/ban`),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
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
      fetchWrapper.post(`/api/admin/users/${userId}/warn`, { reason }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
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
    mutationFn: ({ userIds, reason }: { userIds: string[]; reason?: string }) =>
      fetchWrapper.post(`/api/admin/users/bulk/ban`, { userIds, reason }),
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
    mutationFn: (userIds: string[]) =>
      fetchWrapper.post(`/api/admin/users/bulk/unban`, { userIds }),
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
    mutationFn: ({ userIds, reason }: { userIds: string[]; reason?: string }) =>
      fetchWrapper.post(`/api/admin/users/bulk/warn`, { userIds, reason }),
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
        `/api/admin/analytics/posts?authorId=${userId}`
      ),
    enabled: !!userId,
  });
}

export function useUserWarnHistory(userId: string) {
  return useQuery<UserWarnHistoryDto[]>({
    queryKey: ["admin", "users", userId, "warns"],
    queryFn: () =>
      fetchWrapper.get<UserWarnHistoryDto[]>(
        `/api/admin/users/${userId}/warn`
      ),
    enabled: !!userId,
  });
}

export function useUserBanHistory(userId: string) {
  return useQuery<UserBanHistoryDto>({
    queryKey: ["admin", "users", userId, "ban"],
    queryFn: () =>
      fetchWrapper.get<UserBanHistoryDto>(
        `/api/admin/users/${userId}/ban`
      ),
    enabled: !!userId,
  });
}

export function useUserAuditLogs(userId: string) {
  return useQuery<PagedResult<any>>({
    queryKey: ["admin", "users", userId, "audit"],
    queryFn: () =>
      fetchWrapper.get<PagedResult<any>>(
        `/api/admin/audit?targetProfileId=${userId}`
      ),
    enabled: !!userId,
  });
}
