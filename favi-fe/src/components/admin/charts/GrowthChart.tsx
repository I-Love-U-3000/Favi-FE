"use client";

import { useMemo } from "react";
import { Chart } from "primereact/chart";
import { Skeleton } from "primereact/skeleton";
import { Card } from "primereact/card";

interface GrowthChartProps {
  data?: {
    labels: string[];
    users: number[];
    posts: number[];
  };
  loading?: boolean;
}

export default function GrowthChart({ data, loading = false }: GrowthChartProps) {
  const chartData = useMemo(() => {
    if (!data) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: data.labels,
      datasets: [
        {
          label: "Users",
          data: data.users,
          fill: false,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.2)",
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Posts",
          data: data.posts,
          fill: false,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
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
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      y: {
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <Card title="Growth Trends" className="shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="h-80">
          <Skeleton width="100%" height="100%" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Growth Trends" className="shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="h-80">
        <Chart type="line" data={chartData} options={chartOptions} className="h-full" />
      </div>
    </Card>
  );
}
