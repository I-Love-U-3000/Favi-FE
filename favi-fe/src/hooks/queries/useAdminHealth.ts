"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import {
  HealthStatus,
  SystemMetrics,
  DetailedHealth,
  HealthCheckEntryDto,
  formatUptime,
  formatBytes,
} from "@/lib/api/admin";

export function useHealth() {
  return useQuery<HealthStatus>({
    queryKey: ["admin", "health"],
    queryFn: () => fetchWrapper.get<HealthStatus>("/admin/health"),
    refetchInterval: 30000,
    networkMode: "always",
    gcTime: 5 * 60 * 1000, // 5 phút
    staleTime: 0, // Luôn fetch fresh data
  });
}

export function useHealthMetrics() {
  return useQuery<SystemMetrics>({
    queryKey: ["admin", "health", "metrics"],
    queryFn: () => fetchWrapper.get<SystemMetrics>("/admin/health/metrics"),
    refetchInterval: 30000,
    networkMode: "always",
    gcTime: 5 * 60 * 1000,
    staleTime: 0,
  });
}

export function useHealthDetailed() {
  return useQuery<DetailedHealth>({
    queryKey: ["admin", "health", "detailed"],
    queryFn: () => fetchWrapper.get<DetailedHealth>("/admin/health/detailed"),
    refetchInterval: 30000,
    networkMode: "always",
    gcTime: 5 * 60 * 1000,
    staleTime: 0,
  });
}

export function useHealthStatus() {
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealth();
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useHealthMetrics();
  const { data: detailed, isLoading: detailedLoading, refetch: refetchDetailed } = useHealthDetailed();

  const overallStatus = health?.status?.toLowerCase() || "unknown";

  const refetch = async () => {
    await Promise.all([refetchHealth(), refetchMetrics(), refetchDetailed()]);
  };

  return {
    overallStatus: overallStatus as "healthy" | "degraded" | "unhealthy" | "unknown",
    isHealthy: overallStatus === "healthy",
    isLoading: healthLoading || metricsLoading || detailedLoading,
    health,
    metrics,
    detailed,
    refetch,
  };
}

export { formatUptime, formatBytes };
export type { HealthCheckEntryDto };
