"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { mockReports, createPagedResult } from "@/lib/mock/adminMockData";
import type { PagedResult, ReportResponse, ReportTarget } from "@/types";
import { ReportStatus, ReportTarget as ReportTargetEnum } from "@/types";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type FilterType = "all" | ReportTarget;

export default function AdminReportsPage() {
  const t = useTranslations("AdminPanel");
  const [reports, setReports] = useState<PagedResult<ReportResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Filter mock reports
        let filteredReports = mockReports;
        if (filter !== "all") {
          filteredReports = mockReports.filter((r) => r.targetType === filter);
        }

        // Create paged result
        const data = createPagedResult(filteredReports, page, 20);
        setReports(data);
      } catch (err: any) {
        console.error("Failed to fetch reports:", err);
        setError(err?.message || t("LoadFailed"));
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [page, filter, t]);

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      setUpdating(reportId);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update mock data
      const report = mockReports.find((r) => r.id === reportId);
      if (report) {
        report.status = newStatus;
        report.updatedAt = new Date().toISOString();
      }

      // Refresh reports
      let filteredReports = mockReports;
      if (filter !== "all") {
        filteredReports = mockReports.filter((r) => r.targetType === filter);
      }
      const data = createPagedResult(filteredReports, page, 20);
      setReports(data);

      alert(t("StatusUpdated"));
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(t("StatusUpdateFailed"));
    } finally {
      setUpdating(null);
    }
  };

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case 0:
        return t("Pending");
      case 1:
        return t("Reviewed");
      case 2:
        return t("Resolved");
      case 3:
        return t("Rejected");
      default:
        return "-";
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 0:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 1:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 2:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 3:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getTargetLabel = (target: ReportTarget) => {
    switch (target) {
      case 0:
        return t("User");
      case 1:
        return t("Post");
      case 2:
        return t("Comment");
      case 3:
        return t("Message");
      case 4:
        return t("Collection");
      default:
        return "-";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">{t("Loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!reports || reports.items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">{t("Reports")}</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("EmptyReports")}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const statusData = [
    { name: t("Pending"), value: reports.items.filter((r) => r.status === ReportStatus.Pending).length },
    { name: t("Resolved"), value: reports.items.filter((r) => r.status === ReportStatus.Resolved).length },
    { name: t("Rejected"), value: reports.items.filter((r) => r.status === ReportStatus.Rejected).length },
    { name: t("Reviewed"), value: reports.items.filter((r) => r.status === ReportStatus.Reviewed).length },
  ];

  const targetData = [
    { name: t("UserReports"), value: reports.items.filter((r) => r.targetType === ReportTargetEnum.User).length },
    { name: t("PostReports"), value: reports.items.filter((r) => r.targetType === ReportTargetEnum.Post).length },
    { name: t("CommentReports"), value: reports.items.filter((r) => r.targetType === ReportTargetEnum.Comment).length },
    { name: t("CollectionReports"), value: reports.items.filter((r) => r.targetType === ReportTargetEnum.Collection).length },
  ];

  const STATUS_COLORS = ["#f59e0b", "#22c55e", "#ef4444", "#3b82f6"];
  const TARGET_COLORS = ["#8b5cf6", "#ef4444", "#3b82f6", "#f59e0b"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">{t("Reports")}</h2>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setFilter("all"); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("AllReports")}
          </button>
          <button
            onClick={() => { setFilter(ReportTargetEnum.Post); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === ReportTargetEnum.Post
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("PostReports")}
          </button>
          <button
            onClick={() => { setFilter(ReportTargetEnum.User); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === ReportTargetEnum.User
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("UserReports")}
          </button>
          <button
            onClick={() => { setFilter(ReportTargetEnum.Comment); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === ReportTargetEnum.Comment
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("CommentReports")}
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Status Distribution */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("Status")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Report by Target Type */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("Target")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={targetData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" width={100} className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {targetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={TARGET_COLORS[index % TARGET_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Target")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Reporter")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Reason")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Status")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("CreatedAt")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  {t("Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.items.map((report) => (
                <tr key={report.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">
                        {getTargetLabel(report.targetType)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        ID: {report.targetId.slice(0, 8)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      {report.reporterProfileId.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground max-w-xs truncate">
                      {report.reason}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(report.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {report.status === ReportStatus.Pending && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(report.id, ReportStatus.Resolved)}
                            disabled={updating === report.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {updating === report.id ? t("Loading") : t("MarkAsResolved")}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(report.id, ReportStatus.Rejected)}
                            disabled={updating === report.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {updating === report.id ? t("Loading") : t("MarkAsRejected")}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {reports.totalCount > reports.pageSize && (
          <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t("Showing", {
                from: (page - 1) * reports.pageSize + 1,
                to: Math.min(page * reports.pageSize, reports.totalCount),
                total: reports.totalCount,
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("AriaPrevious")}
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * reports.pageSize >= reports.totalCount}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("AriaNext")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
