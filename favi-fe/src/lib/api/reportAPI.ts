import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  CreateReportRequest,
  UpdateReportStatusRequest,
  ReportResponse,
  ReportTarget,
  ReportStatus,
  PagedResult,
} from "@/types";

export const reportAPI = {
  create: (payload: CreateReportRequest) =>
    fetchWrapper.post<ReportResponse>("/reports", payload, true),

  getAll: (page = 1, pageSize = 20) =>
    fetchWrapper.get<PagedResult<ReportResponse>>(
      `/reports?page=${page}&pageSize=${pageSize}`,
      true
    ),

  updateStatus: (id: string, payload: UpdateReportStatusRequest) =>
    fetchWrapper.put<any>(`/reports/${id}`, payload, true),

  getMyReports: (page = 1, pageSize = 20) =>
    fetchWrapper.get<PagedResult<ReportResponse>>(
      `/reports/my?page=${page}&pageSize=${pageSize}`,
      true
    ),

  getByTarget: (targetId: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<PagedResult<ReportResponse>>(
      `/reports/target/${targetId}?page=${page}&pageSize=${pageSize}`,
      true
    ),

  getByTargetType: (targetType: ReportTarget, page = 1, pageSize = 20) =>
    fetchWrapper.get<PagedResult<ReportResponse>>(
      `/reports/target-type?targetType=${encodeURIComponent(targetType)}&page=${page}&pageSize=${pageSize}`,
      true
    ),
};

export default reportAPI;
