"use client";

import { useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Avatar } from "primereact/avatar";
import { Skeleton } from "primereact/skeleton";
import { Link } from "@/i18n/routing";
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
    <div className="space-y-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview</h1>
          <p className="text-slate-400 font-medium">
            Manage your platform and monitor activity in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar
              value={dateRange}
              onChange={(e) => setDateRange(e.value as Date[] | null)}
              selectionMode="range"
              placeholder="Select date range"
              showIcon
              className="w-full md:w-72 custom-calendar shadow-sm"
              inputClassName="!rounded-xl !py-2.5"
            />
          </div>
          <Button
            icon="pi pi-refresh"
            className="p-button-outlined !rounded-xl !border-slate-200 dark:!border-slate-700 hover:!bg-gray-50 dark:hover:!bg-slate-800 transition-all font-semibold shadow-sm"
            tooltip="Refresh Data"
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
        <Card header={<div className="px-8 pt-8 font-black text-xl text-white tracking-tight">Top Active Users</div>} className="shadow-xl border border-white/5 bg-[#0f172a] rounded-[2.5rem] overflow-hidden">
          {topUsersLoading ? (
            <div className="space-y-4 px-4 pb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton shape="circle" size="3.5rem" />
                  <div className="flex-1">
                    <Skeleton width="60%" height="1.2rem" className="mb-2" />
                    <Skeleton width="40%" height="0.8rem" />
                  </div>
                </div>
              ))}
            </div>
          ) : topUsers && topUsers.length > 0 ? (
            <div className="space-y-4 px-4 pb-8">
              {topUsers.map((user, index) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-6 p-5 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-500 group block"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center font-black text-slate-500 dark:text-white/50 group-hover:bg-blue-600 group-hover:text-white transition-all text-lg shrink-0 shadow-inner">
                    {index + 1}
                  </div>
                  <Avatar
                    image={user.avatarUrl || user.avatar}
                    icon={!(user.avatarUrl || user.avatar) ? "pi pi-user" : undefined}
                    shape="circle"
                    size="large"
                    className="w-16 h-16 ring-4 ring-slate-100 dark:ring-white/10 shadow-2xl"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xl text-white truncate tracking-tighter">
                      @{user.username}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        ❤️ {formatNumber(user.reactionsReceived ?? user.likeCount ?? 0)}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/20">
                        💬 {formatNumber(user.postsCount ?? user.commentCount ?? 0)}
                      </span>
                    </div>
                  </div>
                  <Button
                    icon="pi pi-arrow-right"
                    className="p-button-rounded p-button-outlined !border-slate-200 dark:!border-white/10 !text-slate-400 dark:!text-white/40 group-hover:!bg-blue-600 group-hover:!text-white group-hover:!border-blue-600 transition-all opacity-0 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <i className="pi pi-users text-7xl mb-4 opacity-20" />
              <p className="font-black text-xl tracking-tight text-slate-400">Empty Plaza</p>
            </div>
          )}
        </Card>

        {/* Top Posts */}
        <Card header={<div className="px-8 pt-8 font-black text-xl text-white tracking-tight">Trending Posts</div>} className="shadow-xl border border-white/5 bg-[#0f172a] rounded-[2.5rem] overflow-hidden">
          {topPostsLoading ? (
            <div className="space-y-4 px-4 pb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton width="5rem" height="5rem" borderRadius="20px" />
                  <div className="flex-1">
                    <Skeleton width="80%" height="1.4rem" className="mb-2" />
                    <Skeleton width="50%" height="1rem" />
                  </div>
                </div>
              ))}
            </div>
          ) : topPosts && topPosts.length > 0 ? (
            <div className="space-y-4 px-4 pb-8">
              {topPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/admin/posts/${post.id}`}
                  className="flex items-center gap-6 p-5 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-500 group block"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center font-black text-slate-500 dark:text-white/50 group-hover:bg-blue-600 group-hover:text-white transition-all text-lg shrink-0 shadow-inner">
                    {index + 1}
                  </div>
                  <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 dark:bg-white/10 overflow-hidden flex-shrink-0 shadow-2xl border border-white/5">
                    {post.mediaUrl ? (
                      <img
                        src={post.mediaUrl}
                        alt="Post thumbnail"
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="pi pi-image text-slate-300 dark:text-white/20 text-3xl" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-white truncate tracking-tighter mb-1.5">
                      {post.caption || "Whisper in the dark"}
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      by <span className="text-blue-400">@{post.authorUsername || post.author?.username}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/20">
                        ❤️ {formatNumber(post.reactionsCount ?? post.likeCount ?? 0)}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-500 bg-sky-500/20 px-2.5 py-1 rounded-full border border-sky-500/20">
                        💬 {formatNumber(post.commentsCount ?? post.commentCount ?? 0)}
                      </span>
                    </div>
                  </div>
                  <Button
                    icon="pi pi-arrow-up-right"
                    className="p-button-rounded p-button-outlined !border-slate-200 dark:!border-white/10 !text-slate-400 dark:!text-white/40 group-hover:!bg-blue-600 group-hover:!text-white group-hover:!border-blue-600 transition-all opacity-0 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <i className="pi pi-file text-7xl mb-4 opacity-20" />
              <p className="font-black text-xl tracking-tight text-slate-400">Silence</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card header={<div className="px-6 pt-6 font-bold text-lg text-white">Quick Actions</div>} className="shadow-lg border border-slate-800 bg-[#0f172a] rounded-3xl overflow-hidden mb-10">
        <div className="flex flex-wrap gap-4 px-2">
          <Link href="/admin/users" className="inline-block">
            <Button
              label="View All Users"
              icon="pi pi-users"
              className="!rounded-2xl !px-6 !py-3 !border-slate-600 !text-slate-200 hover:!bg-slate-800 transition-all font-bold shadow-sm"
              outlined
            />
          </Link>
          <Link href="/admin/reports" className="inline-block">
            <Button
              label="Manage Reports"
              icon="pi pi-flag"
              className="!rounded-2xl !px-6 !py-3 !border-amber-700 !text-amber-400 hover:!bg-amber-900/30 transition-all font-bold shadow-sm"
              outlined
            />
          </Link>
          <Link href="/admin/analytics" className="inline-block">
            <Button
              label="View Analytics"
              icon="pi pi-chart-bar"
              className="!rounded-2xl !px-6 !py-3 !border-sky-700 !text-sky-400 hover:!bg-sky-900/30 transition-all font-bold shadow-sm"
              outlined
            />
          </Link>
          <Link href="/admin/health" className="inline-block">
            <Button
              label="Check System Health"
              icon="pi pi-heart"
              className="!rounded-2xl !px-6 !py-3 !border-rose-700 !text-rose-400 hover:!bg-rose-900/30 transition-all font-bold shadow-sm"
              outlined
            />
          </Link>
        </div>
      </Card>
    </div>
  );
}
