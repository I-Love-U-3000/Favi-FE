import { useQuery } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import {
  DashboardStats,
  GrowthChartData,
  UserStatusChartData,
  TopUserDto,
  TopPostDto,
} from "@/lib/api/admin";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => fetchWrapper.get<DashboardStats>("/admin/analytics"),
    refetchInterval: 30000,
  });
}

export function useGrowthChart() {
  return useQuery<GrowthChartData>({
    queryKey: ["admin", "dashboard", "growth"],
    queryFn: () => fetchWrapper.get<GrowthChartData>("/admin/analytics/charts/growth"),
  });
}

export function useUserStatusChart() {
  return useQuery<UserStatusChartData>({
    queryKey: ["admin", "dashboard", "user-status"],
    queryFn: () => fetchWrapper.get<UserStatusChartData>("/admin/analytics/charts/user-status"),
  });
}

export function useTopUsers(limit = 5) {
  return useQuery<TopUserDto[]>({
    queryKey: ["admin", "dashboard", "top-users", limit],
    queryFn: () => fetchWrapper.get<TopUserDto[]>(`/admin/analytics/top-users?limit=${limit}`),
  });
}

export function useTopPosts(limit = 5) {
  return useQuery<TopPostDto[]>({
    queryKey: ["admin", "dashboard", "top-posts", limit],
    queryFn: () => fetchWrapper.get<TopPostDto[]>(`/admin/analytics/top-posts?limit=${limit}`),
  });
}
