"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import { PagedResult, AuditLogDto, ActionType, AdminOption } from "@/lib/api/admin";

export interface AuditLogsFilter {
  search?: string;
  actionType?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
  skip?: number;
  take?: number;
}

export function useAdminAudit(filters: AuditLogsFilter = {}) {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.actionType) queryParams.append("actionType", filters.actionType);
  if (filters.adminId) queryParams.append("adminId", filters.adminId);
  if (filters.startDate) queryParams.append("startDate", filters.startDate);
  if (filters.endDate) queryParams.append("endDate", filters.endDate);
  if (filters.skip) queryParams.append("skip", filters.skip.toString());
  if (filters.take) queryParams.append("take", filters.take.toString());

  return useQuery({
    queryKey: ["admin", "audit", filters],
    queryFn: () =>
      fetchWrapper.get<PagedResult<AuditLogDto>>(
        `/admin/audit?${queryParams.toString()}`
      ),
  });
}

export function useActionTypes() {
  return useQuery<ActionType[]>({
    queryKey: ["admin", "audit", "action-types"],
    queryFn: () =>
      fetchWrapper.get<ActionType[]>("/admin/audit/action-types"),
  });
}

export function useAdminList() {
  return useQuery<AdminOption[]>({
    queryKey: ["admin", "audit", "admins"],
    queryFn: () => fetchWrapper.get<AdminOption[]>("/admin/audit/admins"),
  });
}
