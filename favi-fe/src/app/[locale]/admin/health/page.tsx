"use client";

import { useState } from "react";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import HealthCard from "@/components/admin/health/HealthCard";
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
};

export default function HealthPage() {
  const { overallStatus, health, metrics, detailed, isLoading, isHealthy } =
    useHealthStatus();
  const t = useTranslations("AdminPanel");

  const config = STATUS_CONFIG[overallStatus];

  const formatLastChecked = () => {
    if (!health?.timestamp) return "Never";
    const date = new Date(health.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    return `${Math.floor(diffSec / 3600)} hours ago`;
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Skeleton width="200px" height="32px" />
            <Skeleton width="150px" height="24px" />
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <i
                className={`pi ${config.icon} text-2xl ${
                  isHealthy
                    ? "text-green-500"
                    : "text-yellow-500"
                }`}
              />
              <div>
                <Tag
                  value={isHealthy ? t("AllSystemsOperational") : t("SystemDegraded")}
                  severity={config.severity}
                  className="text-sm"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t("LastChecked")}: {formatLastChecked()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {health && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{t("Version")}:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {health.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{t("Uptime")}:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatUptime(health.uptime)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Metrics */}
        <SystemMetricsCard metrics={metrics} loading={isLoading} />

        {/* Service Health */}
        <ServiceHealthCard detailed={detailed} loading={isLoading} />

        {/* Quick Stats / Additional Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <HealthCard
            title="Quick Stats"
            icon="pi-chart-line"
            status={overallStatus}
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton width="80px" height="20px" />
                    <Skeleton width="60px" height="20px" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {metrics && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("CPU")} Cores</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {metrics.cpu.cores}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("Memory")} Used</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(metrics.memory.usedMB / 1024).toFixed(1)} GB
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t("Disk")} Used</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {metrics.disk.usedGB.toFixed(1)} GB
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </HealthCard>

          {/* Database Info */}
          <HealthCard
            title={t("Database")}
            icon="pi-database"
            status={detailed?.database.status || "healthy"}
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton width="100px" height="20px" />
                    <Skeleton width="60px" height="20px" />
                  </div>
                ))}
              </div>
            ) : detailed?.database ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("Status")}</span>
                  <Tag
                    value={
                      detailed.database.status === "healthy"
                        ? t("Connected")
                        : detailed.database.status
                    }
                    severity={
                      detailed.database.status === "healthy"
                        ? "success"
                        : detailed.database.status === "degraded"
                        ? "warning"
                        : "danger"
                    }
                    className="text-xs"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("ResponseTime")}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {detailed.database.responseTimeMs}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("Connections")}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {detailed.database.connections} / {detailed.database.maxConnections}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No database data</p>
            )}
          </HealthCard>

          {/* Cache Info */}
          <HealthCard
            title={t("Cache")}
            icon="pi-bolt"
            status={detailed?.cache.status || "healthy"}
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton width="80px" height="20px" />
                    <Skeleton width="60px" height="20px" />
                  </div>
                ))}
              </div>
            ) : detailed?.cache ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("Status")}</span>
                  <Tag
                    value={detailed.cache.connected ? t("Connected") : t("Disconnected")}
                    severity={detailed.cache.connected ? "success" : "danger"}
                    className="text-xs"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No cache data</p>
            )}
          </HealthCard>
        </div>
      </div>

      {/* Auto-refresh notice */}
      <div className="text-center text-xs text-gray-400">
        <i className="pi pi-info-circle mr-1" />
        {t("AutoRefresh")}
      </div>
    </div>
  );
}
