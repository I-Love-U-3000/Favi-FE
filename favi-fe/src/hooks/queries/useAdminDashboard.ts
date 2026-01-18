import { useQuery } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import {
  DashboardStats,
  GrowthChartData,
  UserStatusChartData,
  TopItem,
} from "@/lib/api/admin";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => fetchWrapper.get<DashboardStats>("/api/admin/analytics"),
    refetchInterval: 30000,
  });
}

export function useGrowthChart() {
  return useQuery<GrowthChartData>({
    queryKey: ["admin", "dashboard", "growth"],
    queryFn: () => fetchWrapper.get<GrowthChartData>("/api/admin/analytics/charts/growth"),
  });
}

export function useUserStatusChart() {
  return useQuery<UserStatusChartData>({
    queryKey: ["admin", "dashboard", "user-status"],
    queryFn: () => fetchWrapper.get<UserStatusChartData>("/api/admin/analytics/charts/user-status"),
  });
}

export function useTopUsers(limit = 5) {
  return useQuery<TopItem[]>({
    queryKey: ["admin", "dashboard", "top-users", limit],
    queryFn: () => fetchWrapper.get<TopItem[]>(`/api/admin/analytics/top-users?limit=${limit}`),
  });
}

export function useTopPosts(limit = 5) {
  return useQuery<TopItem[]>({
    queryKey: ["admin", "dashboard", "top-posts", limit],
    queryFn: () => fetchWrapper.get<TopItem[]>(`/api/admin/analytics/top-posts?limit=${limit}`),
  });
}
