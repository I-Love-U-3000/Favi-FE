"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import {
  GrowthChartData,
  UserActivityChartData,
  ContentActivityChartData,
  PieChartData,
  UserStatusChartData,
  PeriodComparisonData,
} from "@/lib/api/admin";

export type {
  GrowthChartData,
  UserActivityChartData,
  ContentActivityChartData,
  PieChartData,
  UserStatusChartData,
  PeriodComparisonData,
};

export interface AnalyticsDateRange {
  startDate?: string;
  endDate?: string;
}

export function useGrowthChart(range?: AnalyticsDateRange) {
  const queryParams = new URLSearchParams();
  if (range?.startDate) queryParams.append("startDate", range.startDate);
  if (range?.endDate) queryParams.append("endDate", range.endDate);

  return useQuery({
    queryKey: ["admin", "analytics", "growth", range],
    queryFn: () =>
      fetchWrapper.get<GrowthChartData>(
        `/admin/analytics/charts/growth?${queryParams.toString()}`
      ),
  });
}

export function useUserActivityChart(range?: AnalyticsDateRange) {
  const queryParams = new URLSearchParams();
  if (range?.startDate) queryParams.append("startDate", range.startDate);
  if (range?.endDate) queryParams.append("endDate", range.endDate);

  return useQuery({
    queryKey: ["admin", "analytics", "user-activity", range],
    queryFn: () =>
      fetchWrapper.get<UserActivityChartData>(
        `/admin/analytics/charts/user-activity?${queryParams.toString()}`
      ),
  });
}

export function useContentActivityChart(range?: AnalyticsDateRange) {
  const queryParams = new URLSearchParams();
  if (range?.startDate) queryParams.append("startDate", range.startDate);
  if (range?.endDate) queryParams.append("endDate", range.endDate);

  return useQuery({
    queryKey: ["admin", "analytics", "content-activity", range],
    queryFn: () =>
      fetchWrapper.get<ContentActivityChartData>(
        `/admin/analytics/charts/content-activity?${queryParams.toString()}`
      ),
  });
}

export function useUserRolesChart() {
  return useQuery({
    queryKey: ["admin", "analytics", "user-roles"],
    queryFn: () => fetchWrapper.get<PieChartData>("/admin/analytics/charts/user-roles"),
  });
}

export function useUserStatusChart() {
  return useQuery({
    queryKey: ["admin", "analytics", "user-status"],
    queryFn: () => fetchWrapper.get<UserStatusChartData>("/admin/analytics/charts/user-status"),
  });
}

export function usePostPrivacyChart() {
  return useQuery({
    queryKey: ["admin", "analytics", "post-privacy"],
    queryFn: () => fetchWrapper.get<PieChartData>("/admin/analytics/charts/post-privacy"),
  });
}

export function useReportStatusChart() {
  return useQuery({
    queryKey: ["admin", "analytics", "report-status"],
    queryFn: () => fetchWrapper.get<PieChartData>("/admin/analytics/charts/report-status"),
  });
}

export function usePeriodComparison(period: "week" | "month" = "week") {
  return useQuery({
    queryKey: ["admin", "analytics", "comparison", period],
    queryFn: () =>
      fetchWrapper.get<PeriodComparisonData>(
        `/admin/analytics/comparison?period=${period}`
      ),
  });
}
