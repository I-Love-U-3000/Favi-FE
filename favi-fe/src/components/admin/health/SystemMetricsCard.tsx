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
      <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <i className="pi pi-chart-bar text-lg text-gray-700 dark:text-gray-300" />
          <span className="font-semibold text-gray-900 dark:text-white">System</span>
        </div>
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
      <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <i className="pi pi-chart-bar text-lg text-gray-700 dark:text-gray-300" />
          <span className="font-semibold text-gray-900 dark:text-white">System</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <i className="pi pi-info-circle text-3xl mb-2" />
          <p>No metrics data</p>
        </div>
      </Card>
    );
  }

  const getProgressColor = (value: number) => {
    if (value > 80) return "#ef4444";
    if (value > 50) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="pi pi-chart-bar text-lg text-gray-700 dark:text-gray-300" />
          <span className="font-semibold text-gray-900 dark:text-white">System</span>
        </div>
        {metrics.process && (
          <span className="text-xs text-gray-500">
            {metrics.process.threadCount} threads
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* CPU */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">CPU</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics.cpu?.usagePercent?.toFixed(1) ?? 0}%
            </span>
          </div>
          <ProgressBar
            value={metrics.cpu?.usagePercent ?? 0}
            showValue={false}
            className="h-2"
            color={getProgressColor(metrics.cpu?.usagePercent ?? 0)}
          />
        </div>

        {/* Memory */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Working Set</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics.memory?.workingSetMB?.toFixed(0) ?? 0} MB
            </span>
          </div>
          <ProgressBar
            value={Math.min(((metrics.memory?.workingSetMB ?? 0) / 1024) * 100, 100)}
            showValue={false}
            className="h-2"
            color={getProgressColor(((metrics.memory?.workingSetMB ?? 0) / 1024) * 100)}
          />
        </div>

        {/* GC Memory */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">GC Memory</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics.memory?.gcMemoryMB?.toFixed(0) ?? 0} MB
            </span>
          </div>
        </div>

        {/* Process Info Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Threads</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {metrics.process?.threadCount ?? "-"}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Handles</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {metrics.process?.handleCount?.toLocaleString() ?? "-"}
            </div>
          </div>
        </div>

        {/* GC Collections */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <div className="text-xs text-gray-500">Gen 0</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics.garbageCollection?.gen0Collections?.toLocaleString() ?? "-"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Gen 1</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics.garbageCollection?.gen1Collections?.toLocaleString() ?? "-"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Gen 2</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {metrics.garbageCollection?.gen2Collections?.toLocaleString() ?? "-"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
