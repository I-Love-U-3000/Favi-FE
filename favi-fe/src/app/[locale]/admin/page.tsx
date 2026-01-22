"use client";

import { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Avatar } from "primereact/avatar";
import { Skeleton } from "primereact/skeleton";
import StatsCard from "@/components/admin/layout/StatsCard";
import GrowthChart from "@/components/admin/charts/GrowthChart";
import UserStatusPieChart from "@/components/admin/charts/UserStatusPieChart";
import {
  useDashboardStats,
  useGrowthChart,
  useUserStatusChart,
  useTopUsers,
  useTopPosts,
} from "@/hooks/queries/useAdminDashboard";

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<Date[] | null>(null);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: growthData, isLoading: growthLoading } = useGrowthChart();
  const { data: userStatusData, isLoading: userStatusLoading } = useUserStatusChart();
  const { data: topUsers, isLoading: topUsersLoading } = useTopUsers(5);
  const { data: topPosts, isLoading: topPostsLoading } = useTopPosts(5);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome to the admin panel. Here's an overview of your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar
            value={dateRange}
            onChange={(e) => setDateRange(e.value as Date[] | null)}
            selectionMode="range"
            placeholder="Select date range"
            showIcon
            className="w-full md:w-64"
          />
          <Button
            icon="pi pi-refresh"
            className="p-button-outlined"
            tooltip="Refresh"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={formatNumber(stats?.totalUsers || 0)}
          icon="pi pi-users"
          iconColor="text-blue-500"
          subtext={`${formatNumber(stats?.todayUsers || 0)} new today`}
          trend={{ value: 12, isPositive: true }}
          loading={statsLoading}
        />
        <StatsCard
          title="Total Posts"
          value={formatNumber(stats?.totalPosts || 0)}
          icon="pi pi-file"
          iconColor="text-green-500"
          subtext={`${formatNumber(stats?.todayPosts || 0)} new today`}
          trend={{ value: 8, isPositive: true }}
          loading={statsLoading}
        />
        <StatsCard
          title="Pending Reports"
          value={stats?.pendingReports || 0}
          icon="pi pi-flag"
          iconColor="text-yellow-500"
          subtext="Requires attention"
          loading={statsLoading}
        />
        <StatsCard
          title="Banned Users"
          value={stats?.bannedUsers || 0}
          icon="pi pi-ban"
          iconColor="text-red-500"
          subtext="Currently restricted"
          loading={statsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GrowthChart data={growthData} loading={growthLoading} />
        </div>
        <div>
          <UserStatusPieChart data={userStatusData} loading={userStatusLoading} />
        </div>
      </div>

      {/* Top Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card title="Top Active Users" className="shadow-sm border border-gray-100 dark:border-gray-800">
          {topUsersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton shape="circle" size="2.5rem" />
                  <div className="flex-1">
                    <Skeleton width="40%" className="mb-2" />
                    <Skeleton width="30%" />
                  </div>
                </div>
              ))}
            </div>
          ) : topUsers && topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <span className="w-6 text-center font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <Avatar
                    image={user.avatarUrl || user.avatar}
                    icon={!(user.avatarUrl || user.avatar) ? "pi pi-user" : undefined}
                    shape="circle"
                    size="normal"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      @{user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      ❤️ {formatNumber(user.reactionsReceived ?? user.likeCount ?? 0)} • 💬 {formatNumber(user.postsCount ?? user.commentCount ?? 0)}
                    </p>
                  </div>
                  <Button
                    icon="pi pi-external-link"
                    className="p-button-text p-button-sm"
                    tooltip="View profile"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="pi pi-users text-4xl mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </Card>

        {/* Top Posts */}
        <Card title="Trending Posts" className="shadow-sm border border-gray-100 dark:border-gray-800">
          {topPostsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton width="3rem" height="3rem" borderRadius="8px" />
                  <div className="flex-1">
                    <Skeleton width="80%" className="mb-2" />
                    <Skeleton width="40%" />
                  </div>
                </div>
              ))}
            </div>
          ) : topPosts && topPosts.length > 0 ? (
            <div className="space-y-3">
              {topPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <span className="w-6 text-center font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                    {post.mediaUrl ? (
                      <img
                        src={post.mediaUrl}
                        alt="Post thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="pi pi-image text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {post.caption || "No caption"}
                    </p>
                    <p className="text-xs text-gray-500">
                      by @{post.authorUsername || post.author?.username}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ❤️ {formatNumber(post.reactionsCount ?? post.likeCount ?? 0)} • 💬 {formatNumber(post.commentsCount ?? post.commentCount ?? 0)}
                    </p>
                  </div>
                  <Button
                    icon="pi pi-external-link"
                    className="p-button-text p-button-sm"
                    tooltip="View post"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="pi pi-file text-4xl mb-2 opacity-50" />
              <p>No posts found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" className="shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap gap-3">
          <Button
            label="View All Users"
            icon="pi pi-users"
            className="p-button-outlined"
          />
          <Button
            label="Manage Reports"
            icon="pi pi-flag"
            className="p-button-outlined p-button-warning"
          />
          <Button
            label="View Analytics"
            icon="pi pi-chart-bar"
            className="p-button-outlined"
          />
          <Button
            label="Check System Health"
            icon="pi pi-heart"
            className="p-button-outlined p-button-help"
          />
        </div>
      </Card>
    </div>
  );
}
