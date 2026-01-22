"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import { useOverlay } from "@/components/RootProvider";
import { PagedResult, ReportDto } from "@/lib/api/admin";

export interface ReportsFilter {
  search?: string;
  status?: string;
  targetType?: string;
  reason?: string;
  skip?: number;
  take?: number;
}

export function useAdminReports(filters: ReportsFilter = {}) {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.targetType) queryParams.append("targetType", filters.targetType);
  if (filters.reason) queryParams.append("reason", filters.reason);
  if (filters.skip) queryParams.append("skip", filters.skip.toString());
  if (filters.take) queryParams.append("take", filters.take.toString());

  return useQuery({
    queryKey: ["admin", "reports", filters],
    queryFn: () =>
      fetchWrapper.get<PagedResult<ReportDto>>(
        `/admin/reports?${queryParams.toString()}`
      ),
  });
}

export function useReport(reportId: string) {
  return useQuery({
    queryKey: ["admin", "reports", reportId],
    queryFn: () => fetchWrapper.get<ReportDto>(`/admin/reports/${reportId}`),
    enabled: !!reportId,
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({
      reportId,
      action,
      notes,
    }: {
      reportId: string;
      action: "delete" | "resolve";
      notes?: string;
    }) =>
      fetchWrapper.post(`/admin/reports/${reportId}/resolve`, {
        action,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Report has been resolved",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to resolve report",
      });
    },
  });
}

export function useRejectReport() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ reportId, reason }: { reportId: string; reason?: string }) =>
      fetchWrapper.post(`/admin/reports/${reportId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Report has been rejected",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to reject report",
      });
    },
  });
}

export function useBulkResolveReports() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ reportIds, action }: { reportIds: string[]; action: "delete" | "resolve" }) =>
      fetchWrapper.post(`/admin/reports/bulk/resolve`, { reportIds, action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Reports have been resolved",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to resolve reports",
      });
    },
  });
}

export function useBulkRejectReports() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ reportIds, reason }: { reportIds: string[]; reason?: string }) =>
      fetchWrapper.post(`/admin/reports/bulk/reject`, { reportIds, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Reports have been rejected",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to reject reports",
      });
    },
  });
}
