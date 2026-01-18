"use client";

import BasePieChart from "./BasePieChart";
import { PieChartData } from "@/hooks/queries/useAdminAnalytics";

interface UserRolesPieChartProps {
  data?: PieChartData;
  loading?: boolean;
}

export default function UserRolesPieChart({ data, loading }: UserRolesPieChartProps) {
  const colors = ["#ef4444", "#6366f1", "#22c55e"];

  return (
    <BasePieChart
      title="User Roles"
      data={data}
      loading={loading}
      colors={colors}
    />
  );
}
