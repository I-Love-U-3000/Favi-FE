"use client";

import { useMemo } from "react";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { ContentActivityChartData } from "@/hooks/queries/useAdminAnalytics";

interface ContentActivityChartProps {
  data?: ContentActivityChartData;
  loading?: boolean;
}

export default function ContentActivityChart({
  data,
  loading = false,
}: ContentActivityChartProps) {
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
          label: "Posts",
          data: data.posts,
          fill: true,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Comments",
          data: data.comments,
          fill: true,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.2)",
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Likes",
          data: data.likes,
          fill: true,
          borderColor: "#ec4899",
          backgroundColor: "rgba(236, 72, 153, 0.2)",
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
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
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <Card.Title className="text-base font-semibold mb-4">
          Content Activity
        </Card.Title>
        <div className="h-80">
          <Skeleton width="100%" height="100%" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
      <Card.Title className="text-base font-semibold mb-4">
        Content Activity
      </Card.Title>
      <div className="h-80">
        <Chart type="line" data={chartData} options={chartOptions} className="h-full" />
      </div>
    </Card>
  );
}
