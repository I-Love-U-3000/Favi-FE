"use client";

import BasePieChart from "./BasePieChart";
import { PieChartData } from "@/hooks/queries/useAdminAnalytics";

interface PostPrivacyPieChartProps {
  data?: PieChartData;
  loading?: boolean;
}

export default function PostPrivacyPieChart({ data, loading }: PostPrivacyPieChartProps) {
  const colors = ["#22c55e", "#6366f1", "#f59e0b"];

  return (
    <BasePieChart
      title="Post Privacy"
      data={data}
      loading={loading}
      colors={colors}
    />
  );
}
