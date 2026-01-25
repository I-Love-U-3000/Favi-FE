"use client";

import { useMemo } from "react";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";

interface UserStatusPieChartProps {
  data?: {
    active: number;
    banned: number;
    inactive: number;
  };
  loading?: boolean;
}

export default function UserStatusPieChart({ data, loading = false }: UserStatusPieChartProps) {
  const chartData = useMemo(() => {
    if (!data) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: ["Active", "Banned", "Inactive"],
      datasets: [
        {
          data: [data.active, data.banned, data.inactive],
          backgroundColor: [
            "#22c55e", // Green - Active
            "#ef4444", // Red - Banned
            "#f59e0b", // Yellow - Inactive
          ],
          hoverBackgroundColor: [
            "#16a34a",
            "#dc2626",
            "#d97706",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: "#cbd5e1",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: "65%",
  };

  if (loading) {
    return (
      <Card
        header={<div className="px-6 pt-6 font-bold text-lg text-white">User Status Distribution</div>}
        className="shadow-xl border border-white/5 bg-[#0f172a] rounded-[2rem] overflow-hidden"
      >
        <div className="h-64">
          <Skeleton width="100%" height="100%" />
        </div>
      </Card>
    );
  }

  const total = (data?.active || 0) + (data?.banned || 0) + (data?.inactive || 0);

  return (
    <Card
      header={<div className="px-6 pt-6 font-bold text-lg text-white">User Status Distribution</div>}
      className="shadow-xl border border-white/5 bg-[#0f172a] rounded-[2rem] overflow-hidden"
    >
      <div className="h-64">
        <Chart type="doughnut" data={chartData} options={chartOptions} className="h-full" />
      </div>
      <div className="text-center mt-2 text-sm text-slate-400">
        Total: {total.toLocaleString()} users
      </div>
    </Card>
  );
}
