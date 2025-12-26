"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { mockDashboardStats } from "@/lib/mock/adminMockData";
import type { DashboardStatsResponse } from "@/types/admin";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations("AdminPanel");
  const [analytics, setAnalytics] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Use mock data instead of API call
        setAnalytics(mockDashboardStats);
      } catch (err: any) {
        console.error("Failed to fetch analytics:", err);
        setError(err?.message || t("LoadFailed"));
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">{t("Loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Prepare chart data
  const activityData = [
    { name: t("ActiveUsers24h"), value: analytics.ActiveUsersLast24h ?? 0 },
    { name: t("ActiveUsers7d"), value: analytics.ActiveUsersLast7d ?? 0 },
    { name: t("ActiveUsers30d"), value: analytics.ActiveUsersLast30d ?? 0 },
  ];

  const postsData = [
    { name: t("PostsLast24h"), value: analytics.PostsLast24h ?? 0 },
    { name: t("PostsLast7d"), value: analytics.PostsLast7d ?? 0 },
    { name: t("PostsLast30d"), value: analytics.PostsLast30d ?? 0 },
  ];

  const reportsData = [
    { name: t("ReportsLast24h"), value: analytics.ReportsLast24h ?? 0 },
    { name: t("ReportsLast7d"), value: analytics.ReportsLast7d ?? 0 },
    { name: t("ReportsLast30d"), value: analytics.ReportsLast30d ?? 0 },
  ];

  const userDistributionData = [
    { name: t("ActiveUsers"), value: analytics.UsersCount - analytics.BannedUsersCount },
    { name: t("BannedUsers"), value: analytics.BannedUsersCount ?? 0 },
  ];

  const COLORS = ["#3b82f6", "#ef4444"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{t("Dashboard")}</h2>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t("TotalUsers")} value={(analytics.UsersCount ?? 0).toLocaleString()} />
        <StatCard title={t("TotalPosts")} value={(analytics.PostsCount ?? 0).toLocaleString()} />
        <StatCard title={t("TotalComments")} value={(analytics.CommentsCount ?? 0).toLocaleString()} />
        <StatCard
          title={t("PendingReports")}
          value={(analytics.PendingReportsCount ?? 0).toLocaleString()}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Users Trend */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("ActiveUsers")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Status Distribution */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("Users")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill={COLORS[0]} />
                <Cell fill={COLORS[1]} />
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Posts Trend */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("TotalPosts")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={postsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reports Trend */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("Reports")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reportsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={t("PendingReports")}
          value={(analytics.PendingReportsCount ?? 0).toLocaleString()}
          description={`${t("TotalReports")}: ${(analytics.ReportsCount ?? 0).toLocaleString()}`}
        />
        <StatCard
          title={t("PostsLast24h")}
          value={(analytics.PostsLast24h ?? 0).toLocaleString()}
          description={`${t("PostsLast7d")}: ${(analytics.PostsLast7d ?? 0).toLocaleString()}`}
        />
        <StatCard
          title={t("BannedUsers")}
          value={(analytics.BannedUsersCount ?? 0).toLocaleString()}
        />
      </div>
    </div>
  );
}
