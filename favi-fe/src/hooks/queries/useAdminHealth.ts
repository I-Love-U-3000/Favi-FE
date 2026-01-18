"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import {
  HealthStatus,
  SystemMetrics,
  DetailedHealth,
  formatUptime,
  formatBytes,
} from "@/lib/api/admin";

export function useHealth() {
  return useQuery<HealthStatus>({
    queryKey: ["admin", "health"],
    queryFn: () => fetchWrapper.get<HealthStatus>("/api/admin/health"),
    refetchInterval: 30000,
  });
}

export function useHealthMetrics() {
  return useQuery<SystemMetrics>({
    queryKey: ["admin", "health", "metrics"],
    queryFn: () => fetchWrapper.get<SystemMetrics>("/api/admin/health/metrics"),
    refetchInterval: 30000,
  });
}

export function useHealthDetailed() {
  return useQuery<DetailedHealth>({
    queryKey: ["admin", "health", "detailed"],
    queryFn: () => fetchWrapper.get<DetailedHealth>("/api/admin/health/detailed"),
    refetchInterval: 30000,
  });
}

export function useHealthStatus() {
  const { data: health, isLoading: healthLoading } = useHealth();
  const { data: metrics, isLoading: metricsLoading } = useHealthMetrics();
  const { data: detailed, isLoading: detailedLoading } = useHealthDetailed();

  return {
    overallStatus: health?.status || "unknown",
    isHealthy: health?.status === "healthy",
    isLoading: healthLoading || metricsLoading || detailedLoading,
    health,
    metrics,
    detailed,
  };
}

export { formatUptime, formatBytes };
