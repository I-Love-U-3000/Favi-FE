"use client";

import { useMemo } from "react";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";

interface PieChartData {
  labels: string[];
  data: number[];
}

interface BasePieChartProps {
  title: string;
  data?: PieChartData;
  loading?: boolean;
  colors?: string[];
  centerText?: string;
}

const DEFAULT_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

export default function BasePieChart({
  title,
  data,
  loading = false,
  colors = DEFAULT_COLORS,
  centerText,
}: BasePieChartProps) {
  const chartData = useMemo(() => {
    if (!data || !data.data) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: data.labels,
      datasets: [
        {
          data: data.data,
          backgroundColor: colors.slice(0, data.data.length),
          hoverBackgroundColor: colors.slice(0, data.data.length).map((c) => c + "cc"),
        },
      ],
    };
  }, [data, colors]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        cornerRadius: 8,
      },
    },
    cutout: "60%",
  };

  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="text-base font-semibold mb-4">{title}</div>
        <div className="h-64">
          <Skeleton width="100%" height="100%" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="text-base font-semibold mb-4">{title}</div>
      <div className="h-64 relative">
        <Chart type="doughnut" data={chartData} options={chartOptions} className="h-full" />
        {centerText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {centerText}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
