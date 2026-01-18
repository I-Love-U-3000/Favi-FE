"use client";

import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  subtext?: string;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  icon,
  iconColor = "text-primary",
  subtext,
  loading = false,
  trend,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <Skeleton width="3rem" height="3rem" borderRadius="50%" />
          <div className="flex-1">
            <Skeleton width="40%" height="1rem" className="mb-2" />
            <Skeleton width="60%" height="1.5rem" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center ${iconColor}`}>
          <i className={`${icon} text-xl`} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
