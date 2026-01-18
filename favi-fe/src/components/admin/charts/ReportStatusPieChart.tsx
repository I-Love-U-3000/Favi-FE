"use client";

import BasePieChart from "./BasePieChart";
import { PieChartData } from "@/hooks/queries/useAdminAnalytics";

interface ReportStatusPieChartProps {
  data?: PieChartData;
  loading?: boolean;
}

export default function ReportStatusPieChart({ data, loading }: ReportStatusPieChartProps) {
  const colors = ["#f59e0b", "#22c55e", "#ef4444"];

  return (
    <BasePieChart
      title="Report Status"
      data={data}
      loading={loading}
      colors={colors}
    />
  );
}
