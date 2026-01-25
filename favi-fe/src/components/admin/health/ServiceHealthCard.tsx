"use client";

import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { DetailedHealth } from "@/hooks/queries/useAdminHealth";

interface ServiceHealthCardProps {
  detailed?: DetailedHealth;
  loading?: boolean;
}

const SERVICE_STATUS_CONFIG: Record<string, { severity: "success" | "warning" | "danger"; icon: string; label: string }> = {
  healthy: { severity: "success" as const, icon: "pi-check-circle", label: "Healthy" },
  degraded: { severity: "warning" as const, icon: "pi-exclamation-triangle", label: "Degraded" },
  unhealthy: { severity: "danger" as const, icon: "pi-times-circle", label: "Unhealthy" },
};

const SERVICE_NAMES: Record<string, string> = {
  "database": "PostgreSQL",
  "redis": "Redis Cache",
  "qdrant": "Qdrant Vector DB",
  "vector-index-api": "Vector Index API",
  "memory": "Memory",
};

const SERVICE_ICONS: Record<string, string> = {
  "database": "pi-database",
  "redis": "pi-bolt",
  "qdrant": "pi-server",
  "vector-index-api": "pi-cloud",
  "memory": "pi-box",
};

export default function ServiceHealthCard({
  detailed,
  loading = false,
}: ServiceHealthCardProps) {
  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <i className="pi pi-heart text-lg text-gray-700 dark:text-gray-300" />
          <span className="font-semibold text-gray-900 dark:text-white">Services</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!detailed) {
    return (
      <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <i className="pi pi-heart text-lg text-gray-700 dark:text-gray-300" />
          <span className="font-semibold text-gray-900 dark:text-white">Services</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <i className="pi pi-info-circle text-3xl mb-2" />
          <p>No service data</p>
        </div>
      </Card>
    );
  }

  const getStatus = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    return SERVICE_STATUS_CONFIG[normalizedStatus] || SERVICE_STATUS_CONFIG.healthy;
  };

  const renderServiceRow = (name: string, status: string, responseTime?: number, message?: string) => {
    const config = getStatus(status);
    const displayName = SERVICE_NAMES[name] || name;
    const icon = SERVICE_ICONS[name] || "pi-circle";

    return (
      <div
        key={name}
        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            status?.toLowerCase() === "healthy"
              ? "bg-green-100 dark:bg-green-900/30"
              : status?.toLowerCase() === "degraded"
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : "bg-red-100 dark:bg-red-900/30"
          }`}>
            <i className={`pi ${icon} ${
              status?.toLowerCase() === "healthy"
                ? "text-green-600 dark:text-green-400"
                : status?.toLowerCase() === "degraded"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
            }`} />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {displayName}
            </div>
            {message && (
              <div className="text-xs text-gray-500">{message}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {responseTime !== undefined && (
            <span className="text-xs text-gray-500 font-mono">{responseTime}ms</span>
          )}
          <Tag
            value={config.label}
            severity={config.severity}
            className="text-xs"
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="pi pi-heart text-lg text-gray-700 dark:text-gray-300" />
          <span className="font-semibold text-gray-900 dark:text-white">Services</span>
        </div>
        <Tag
          value={detailed.overallStatus || "Unknown"}
          severity={getStatus(detailed.overallStatus || "").severity}
          className="text-xs"
        />
      </div>

      <div className="space-y-1">
        {/* Database */}
        {renderServiceRow(
          "database",
          detailed.database?.status || "unknown",
          detailed.database?.responseTimeMs
        )}

        {/* Other services */}
        {detailed.services?.map((service) =>
          renderServiceRow(
            service.name,
            service.status,
            service.responseTimeMs,
            service.message
          )
        )}

        {(!detailed.services || detailed.services.length === 0) && (
          <p className="text-sm text-gray-500 py-4 text-center">
            No additional services configured
          </p>
        )}
      </div>
    </Card>
  );
}
