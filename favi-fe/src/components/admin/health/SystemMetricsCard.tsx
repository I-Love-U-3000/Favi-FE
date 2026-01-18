"use client";

import { ProgressBar } from "primereact/progressbar";
import { Card } from "primereact/card";
import { SystemMetrics, formatBytes } from "@/hooks/queries/useAdminHealth";

interface SystemMetricsCardProps {
  metrics?: SystemMetrics;
  loading?: boolean;
}

export default function SystemMetricsCard({
  metrics,
  loading = false,
}: SystemMetricsCardProps) {
  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <Card.Title className="text-base font-semibold mb-4 flex items-center gap-2">
          <i className="pi pi-chart-bar text-lg" />
          System Metrics
        </Card.Title>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <Card.Title className="text-base font-semibold mb-4 flex items-center gap-2">
          <i className="pi pi-chart-bar text-lg" />
          System Metrics
        </Card.Title>
        <div className="text-center py-8 text-gray-500">
          <i className="pi pi-info-circle text-4xl mb-2 opacity-50" />
          <p>No metrics available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
      <Card.Title className="text-base font-semibold mb-4 flex items-center gap-2">
        <i className="pi pi-chart-bar text-lg" />
        System Metrics
      </Card.Title>
      <div className="space-y-4">
        {/* CPU */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">CPU</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics.cpu.usagePercent.toFixed(1)}% ({metrics.cpu.cores} cores)
            </span>
          </div>
          <ProgressBar
            value={metrics.cpu.usagePercent}
            showValue={false}
            className="h-2"
            color={metrics.cpu.usagePercent > 80 ? "#ef4444" : metrics.cpu.usagePercent > 50 ? "#f59e0b" : "#22c55e"}
          />
        </div>

        {/* Memory */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatBytes(metrics.memory.usedMB * 1024 * 1024)} / {formatBytes(metrics.memory.totalMB * 1024 * 1024)}
            </span>
          </div>
          <ProgressBar
            value={metrics.memory.usagePercent}
            showValue={false}
            className="h-2"
            color={metrics.memory.usagePercent > 80 ? "#ef4444" : metrics.memory.usagePercent > 50 ? "#f59e0b" : "#22c55e"}
          />
        </div>

        {/* Disk */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Disk</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics.disk.usedGB.toFixed(1)} GB / {metrics.disk.totalGB.toFixed(1)} GB
            </span>
          </div>
          <ProgressBar
            value={metrics.disk.usagePercent}
            showValue={false}
            className="h-2"
            color={metrics.disk.usagePercent > 80 ? "#ef4444" : metrics.disk.usagePercent > 50 ? "#f59e0b" : "#22c55e"}
          />
        </div>

        {/* Network */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Network In:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {formatBytes(metrics.network.bytesIn)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Network Out:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {formatBytes(metrics.network.bytesOut)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
