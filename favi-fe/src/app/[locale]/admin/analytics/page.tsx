"use client";

import { useState, useCallback } from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import GrowthChart from "@/components/admin/charts/GrowthChart";
import UserActivityChart from "@/components/admin/charts/UserActivityChart";
import ContentActivityChart from "@/components/admin/charts/ContentActivityChart";
import BasePieChart from "@/components/admin/charts/BasePieChart";
import UserStatusPieChart from "@/components/admin/charts/UserStatusPieChart";
import {
  useGrowthChart,
  useUserActivityChart,
  useContentActivityChart,
  useUserRolesChart,
  usePostPrivacyChart,
  useReportStatusChart,
  usePeriodComparison,
} from "@/hooks/queries/useAdminAnalytics";

type DatePreset = "today" | "7d" | "30d" | "90d";

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

export default function AnalyticsPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [customRange, setCustomRange] = useState<Date[] | null>(null);

  const dateRange = useCallback(() => {
    if (customRange && customRange.length === 2) {
      return {
        startDate: customRange[0].toISOString(),
        endDate: customRange[1].toISOString(),
      };
    }

    const now = new Date();
    const endDate = now.toISOString();

    let startDate: Date;
    switch (datePreset) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString(),
      endDate,
    };
  }, [datePreset, customRange]);

  const range = dateRange();

  // Chart data queries
  const { data: growthData, isLoading: growthLoading } = useGrowthChart(range);
  const { data: userActivityData, isLoading: userActivityLoading } =
    useUserActivityChart(range);
  const { data: contentActivityData, isLoading: contentActivityLoading } =
    useContentActivityChart(range);
  const { data: userRolesData, isLoading: userRolesLoading } = useUserRolesChart();
  const { data: postPrivacyData, isLoading: postPrivacyLoading } = usePostPrivacyChart();
  const { data: reportStatusData, isLoading: reportStatusLoading } =
    useReportStatusChart();
  const { data: comparisonData, isLoading: comparisonLoading } = usePeriodComparison("week");

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderComparisonItem = (
    label: string,
    data: { current: number; previous: number; change: number }
  ) => {
    const isPositive = data.change > 0;
    const isNegative = data.change < 0;

    return (
      <div key={label} className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatNumber(data.current)}
        </span>
        <Tag
          value={`${isPositive ? "+" : ""}${data.change}%`}
          severity={isPositive ? "success" : isNegative ? "danger" : "info"}
          className="text-xs"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor platform growth and user activity over time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.value);
              setCustomRange(null);
            }}
            options={DATE_PRESETS}
            optionLabel="label"
            optionValue="value"
            placeholder="Select range"
            className="w-40"
          />
          <Calendar
            value={customRange}
            onChange={(e) => {
              setCustomRange(e.value as Date[] | null);
              if (e.value) {
                setDatePreset("today"); // Reset preset when custom range is used
              }
            }}
            selectionMode="range"
            placeholder="Custom range"
            showIcon
            className="w-64"
            dateFormat="mm/dd/yy"
          />
          <Button icon="pi pi-refresh" className="p-button-outlined" tooltip="Refresh" />
        </div>
      </div>

      {/* Period Comparison */}
      {!comparisonLoading && comparisonData && (
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
          <Card.Title className="text-base font-semibold mb-3">
            This Week vs Last Week
          </Card.Title>
          <div className="flex flex-wrap gap-6">
            {renderComparisonItem("Users", comparisonData.users)}
            {renderComparisonItem("Posts", comparisonData.posts)}
            {renderComparisonItem("Reports", comparisonData.reports)}
          </div>
        </Card>
      )}

      {/* Row 1: Growth and User Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart data={growthData} loading={growthLoading} />
        <UserActivityChart data={userActivityData} loading={userActivityLoading} />
      </div>

      {/* Row 2: Content Activity */}
      <ContentActivityChart data={contentActivityData} loading={contentActivityLoading} />

      {/* Row 3: Pie Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <UserStatusPieChart
          data={
            userRolesData
              ? {
                  active: userRolesData.data[0] || 0,
                  banned: userRolesData.data[1] || 0,
                  inactive: userRolesData.data[2] || 0,
                }
              : undefined
          }
          loading={userRolesLoading}
        />
        <BasePieChart
          title="User Roles"
          data={userRolesData}
          loading={userRolesLoading}
          colors={["#ef4444", "#6366f1", "#22c55e"]}
        />
        <BasePieChart
          title="Post Privacy"
          data={postPrivacyData}
          loading={postPrivacyLoading}
          colors={["#22c55e", "#6366f1", "#f59e0b"]}
        />
        <BasePieChart
          title="Report Status"
          data={reportStatusData}
          loading={reportStatusLoading}
          colors={["#f59e0b", "#22c55e", "#ef4444"]}
        />
      </div>
    </div>
  );
}
