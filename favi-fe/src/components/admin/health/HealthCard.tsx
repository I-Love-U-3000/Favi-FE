"use client";

import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";

interface HealthCardProps {
  title: string;
  icon: string;
  status: "healthy" | "degraded" | "unhealthy";
  children: React.ReactNode;
  className?: string;
}

const STATUS_CONFIG = {
  healthy: { severity: "success" as const, icon: "pi-check-circle", label: "Healthy" },
  degraded: { severity: "warning" as const, icon: "pi-exclamation-triangle", label: "Degraded" },
  unhealthy: { severity: "danger" as const, icon: "pi-times-circle", label: "Unhealthy" },
};

export default function HealthCard({
  title,
  icon,
  status,
  children,
  className = "",
}: HealthCardProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Card
      className={`shadow-sm border border-gray-100 dark:border-gray-800 ${className}`}
    >
      <Card.Title className="text-base font-semibold mb-4 flex items-center gap-2">
        <i className={`pi ${icon} text-lg`} />
        {title}
        <Tag
          value={config.label}
          severity={config.severity}
          icon={`pi ${config.icon}`}
          className="ml-auto"
        />
      </Card.Title>
      {children}
    </Card>
  );
}
