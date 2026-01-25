"use client";

import React from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import SystemMetricsCard from "@/components/admin/health/SystemMetricsCard";
import ServiceHealthCard from "@/components/admin/health/ServiceHealthCard";
import {
  useHealthStatus,
  formatUptime,
} from "@/hooks/queries/useAdminHealth";
import { useTranslations } from "next-intl";

const STATUS_CONFIG = {
  healthy: { severity: "success" as const, icon: "pi-check-circle" },
  degraded: { severity: "warning" as const, icon: "pi-exclamation-triangle" },
  unhealthy: { severity: "danger" as const, icon: "pi-times-circle" },
  unknown: { severity: "info" as const, icon: "pi-question-circle" },
};

export default function HealthPage() {
  const { overallStatus, health, metrics, detailed, isLoading, isHealthy } =
    useHealthStatus();
  const t = useTranslations("AdminPanel");

  const config = STATUS_CONFIG[overallStatus] || STATUS_CONFIG.unknown;

  // Tạo danh sách health checks từ cả 2 endpoints, tránh duplicate
  const allHealthChecks = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ type: 'entry' | 'service'; name: string; status: string; duration: number; description?: string }> = [];

    // Từ /api/admin/health - entries
    health?.entries?.forEach((entry) => {
      if (!seen.has(entry.name)) {
        seen.add(entry.name);
        result.push({
          type: 'entry',
          name: entry.name,
          status: entry.status,
          duration: entry.durationMs,
          description: entry.description,
        });
      }
    });

    // Từ /api/admin/health/detailed - services (chỉ thêm nếu chưa có trong entries)
    detailed?.services?.forEach((service) => {
      if (!seen.has(service.name)) {
        seen.add(service.name);
        result.push({
          type: 'service',
          name: service.name,
          status: service.status,
          duration: service.responseTimeMs,
          description: service.message,
        });
      }
    });

    return result;
  }, [health?.entries, detailed?.services]);

  const formatLastChecked = () => {
    if (!health?.timestamp) return "Never";
    const date = new Date(health.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("SystemHealth")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor the health and performance of your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon="pi pi-refresh"
            label={t("Refresh")}
            className="p-button-outlined"
            loading={isLoading}
          />
        </div>
      </div>

      {/* Overall Status Banner */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Skeleton width="180px" height="28px" />
          </div>
        </div>
      ) : (
        <div
          className={`p-4 rounded-lg border ${
            isHealthy
              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <i
                className={`pi ${config.icon} text-xl ${
                  isHealthy ? "text-green-500" : "text-yellow-500"
                }`}
              />
              <div>
                <Tag
                  value={isHealthy ? t("AllSystemsOperational") : t("SystemDegraded")}
                  severity={config.severity}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Checked: {formatLastChecked()}</span>
              {metrics?.process && (
                <span className="flex items-center gap-1">
                  <i className="pi pi-clock" />
                  Uptime: {metrics.process.uptimeFormatted || formatUptime(metrics.process.uptimeSeconds)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics & Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemMetricsCard metrics={metrics} loading={isLoading} />
        <ServiceHealthCard detailed={detailed} loading={isLoading} />
      </div>

      {/* Health Checks Table */}
      {allHealthChecks.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <i className="pi pi-list" />
              Health Checks
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Check</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {allHealthChecks.map((check) => {
                  const entryStatus = check.status?.toLowerCase() || "unknown";
                  const statusConfig = STATUS_CONFIG[entryStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.unknown;
                  return (
                    <tr key={`${check.type}-${check.name}`} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {check.name}
                      </td>
                      <td className="px-4 py-3">
                        <Tag
                          value={check.status || "Unknown"}
                          severity={statusConfig.severity}
                          className="text-xs"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 font-mono">
                        {check.duration?.toFixed(2) || 0}ms
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {check.description || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Auto-refresh notice */}
      <div className="text-center text-xs text-gray-400">
        <i className="pi pi-info-circle mr-1" />
        Auto-refresh every 30 seconds
      </div>
    </div>
  );
}
