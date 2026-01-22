"use client";

import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { ServiceHealth, DetailedHealth } from "@/hooks/queries/useAdminHealth";

interface ServiceHealthCardProps {
  detailed?: DetailedHealth;
  loading?: boolean;
}

const SERVICE_STATUS_CONFIG = {
  healthy: { severity: "success" as const, icon: "pi-check-circle", label: "Healthy" },
  degraded: { severity: "warning" as const, icon: "pi-exclamation-triangle", label: "Degraded" },
  unhealthy: { severity: "danger" as const, icon: "pi-times-circle", label: "Unhealthy" },
};

export default function ServiceHealthCard({
  detailed,
  loading = false,
}: ServiceHealthCardProps) {
  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="text-base font-semibold mb-4">
          Service Health
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!detailed) {
    return (
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="text-base font-semibold mb-4">
          Service Health
        </div>
        <div className="text-center py-8 text-gray-500">
          <i className="pi pi-info-circle text-4xl mb-2 opacity-50" />
          <p>No service data available</p>
        </div>
      </Card>
    );
  }

  const renderServiceStatus = (
    name: string,
    status: "healthy" | "degraded" | "unhealthy",
    extra?: React.ReactNode
  ) => {
    const config = SERVICE_STATUS_CONFIG[status];

    return (
      <div
        key={name}
        className="flex items-center justify-between py-3 border-b last:border-0 border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-3">
          <i
            className={`pi ${config.icon} ${status === "healthy"
                ? "text-green-500"
                : status === "degraded"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {extra}
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
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="text-base font-semibold mb-4">
        Service Health
      </div>

      {/* Database */}
      {renderServiceStatus(
        "Database",
        detailed.database.status,
        <span className="text-xs text-gray-500">
          {detailed.database.responseTimeMs}ms | {detailed.database.connections}/{detailed.database.maxConnections}
        </span>
      )}

      {/* Cache */}
      {renderServiceStatus(
        "Cache",
        detailed.cache.status,
        <span className="text-xs text-gray-500">
          {detailed.cache.connected ? "Connected" : "Disconnected"} | Hit: {(detailed.cache.hitRate * 100).toFixed(1)}%
        </span>
      )}

      {/* Storage */}
      {renderServiceStatus(
        "Storage",
        detailed.storage.status,
        <span className="text-xs text-gray-500">
          {detailed.storage.usedGB.toFixed(1)} GB used
        </span>
      )}

      {/* Other services */}
      {detailed.services.map((service) =>
        renderServiceStatus(
          service.name,
          service.status,
          <span className="text-xs text-gray-500">
            {service.responseTimeMs}ms
            {service.message && ` | ${service.message}`}
          </span>
        )
      )}
    </Card>
  );
}
