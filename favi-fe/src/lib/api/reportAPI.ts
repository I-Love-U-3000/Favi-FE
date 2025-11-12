import { fetchWrapper } from "@/lib/fetchWrapper";

export const reportAPI = {
  create: (payload: {
    targetType: string;          // phải map với enum ReportTarget phía BE
    targetId: string;
    reason?: string;
    details?: string;
  }) => fetchWrapper.post<any>("/reports", payload, true),

  getAll: (page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/reports?page=${page}&pageSize=${pageSize}`, true), // cần role admin

  updateStatus: (id: string, payload: { status: string; note?: string }) =>
    fetchWrapper.put<any>(`/reports/${id}`, payload, true), // cần role admin

  getMyReports: (page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/reports/my?page=${page}&pageSize=${pageSize}`, true),

  getByTarget: (targetId: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/reports/target/${targetId}?page=${page}&pageSize=${pageSize}`, true),

  getByTargetType: (targetType: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/reports/target-type?targetType=${encodeURIComponent(targetType)}&page=${page}&pageSize=${pageSize}`, true),
};

export default reportAPI;
