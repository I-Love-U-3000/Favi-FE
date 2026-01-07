"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { mockUsers, createPagedResult } from "@/lib/mock/adminMockData";
import type { PagedResult, AnalyticsUserDto } from "@/types/admin";
import { ReportStatus } from "@/types";
import {
  BarChart,
  Bar,
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

type BanDialogState = {
  isOpen: boolean;
  userId: string | null;
  username: string | null;
};

type WarnDialogState = {
  isOpen: boolean;
  userId: string | null;
  username: string | null;
};

export default function AdminUsersPage() {
  const t = useTranslations("AdminPanel");
  const [users, setUsers] = useState<PagedResult<AnalyticsUserDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banDialog, setBanDialog] = useState<BanDialogState>({
    isOpen: false,
    userId: null,
    username: null,
  });
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState<number | null>(null);
  const [warnDialog, setWarnDialog] = useState<WarnDialogState>({
    isOpen: false,
    userId: null,
    username: null,
  });
  const [warnMessage, setWarnMessage] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Use mock data with pagination
        const data = createPagedResult(mockUsers, page, 20);
        setUsers(data);
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setError(err?.message || t("LoadFailed"));
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [page, t]);

  const handleBan = async () => {
    if (!banDialog.userId || !banReason.trim()) {
      alert("Please provide a ban reason.");
      return;
    }

    try {
      setActionLoading(banDialog.userId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update mock data
      const user = mockUsers.find((u) => u.ProfileId === banDialog.userId);
      if (user) {
        user.IsBanned = true;
        user.BannedAt = new Date().toISOString();
        user.BannedUntil = banDays
          ? new Date(Date.now() + banDays * 24 * 60 * 60 * 1000).toISOString()
          : null;
      }

      // Refresh users
      const data = createPagedResult(mockUsers, page, 20);
      setUsers(data);

      alert(t("BanSuccess"));
      closeBanDialog();
    } catch (err: any) {
      console.error("Failed to ban user:", err);
      alert(t("BanFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnban = async (userId: string, username: string) => {
    if (!confirm(`${t("UnbanConfirm")} ${username}?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update mock data
      const user = mockUsers.find((u) => u.ProfileId === userId);
      if (user) {
        user.IsBanned = false;
        user.BannedAt = null;
        user.BannedUntil = null;
      }

      // Refresh users
      const data = createPagedResult(mockUsers, page, 20);
      setUsers(data);

      alert(t("UnbanSuccess"));
    } catch (err: any) {
      console.error("Failed to unban user:", err);
      alert(t("UnbanFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleWarn = async () => {
    if (!warnDialog.userId || !warnMessage.trim()) {
      alert("Please provide a warning message.");
      return;
    }

    try {
      setActionLoading(warnDialog.userId);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, this would send a warning to the user
      console.log(`Warning sent to ${warnDialog.username}: ${warnMessage}`);

      // Refresh users
      const data = createPagedResult(mockUsers, page, 20);
      setUsers(data);

      alert(t("WarnSuccess"));
      closeWarnDialog();
    } catch (err: any) {
      console.error("Failed to warn user:", err);
      alert(t("WarnFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const openWarnDialog = (userId: string, username: string) => {
    setWarnDialog({ isOpen: true, userId, username });
    setWarnMessage("");
  };

  const closeWarnDialog = () => {
    setWarnDialog({ isOpen: false, userId: null, username: null });
    setWarnMessage("");
  };

  const openBanDialog = (userId: string, username: string) => {
    setBanDialog({ isOpen: true, userId, username });
    setBanReason("");
    setBanDays(null);
  };

  const closeBanDialog = () => {
    setBanDialog({ isOpen: false, userId: null, username: null });
    setBanReason("");
    setBanDays(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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

  if (!users || users.items.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">{t("Users")}</h2>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("EmptyUsers")}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const bannedCount = users.items.filter((u) => u.IsBanned).length;
  const activeCount = users.items.length - bannedCount;

  const userStatusData = [
    { name: t("Active"), value: activeCount },
    { name: t("Banned"), value: bannedCount },
  ];

  const topReportedUsers = [...users.items]
    .sort((a, b) => b.ReceivedReportsCount - a.ReceivedReportsCount)
    .slice(0, 5)
    .map((u) => ({
      name: u.Username,
      reports: u.ReceivedReportsCount,
    }));

  const topPosters = [...users.items]
    .sort((a, b) => b.PostsCount - a.PostsCount)
    .slice(0, 5)
    .map((u) => ({
      name: u.Username,
      posts: u.PostsCount,
    }));

  const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{t("Users")}</h2>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* User Status Distribution */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("Status")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={userStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={70}
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

        {/* Top Reported Users */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("ReportsReceived")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topReportedUsers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" width={80} className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="reports" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Posters */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("PostsCount")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topPosters} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" width={80} className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Username")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("JoinedAt")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("LastActive")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("PostsCount")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Followers")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("ReportsReceived")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Status")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  {t("Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.items.map((user) => (
                <tr key={user.ProfileId} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.AvatarUrl && (
                        <img
                          src={user.AvatarUrl}
                          alt={user.Username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {user.DisplayName || user.Username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{user.Username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(user.CreatedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(user.LastActiveAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground">{user.PostsCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground">{user.FollowersCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground">{user.ReceivedReportsCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    {user.IsBanned ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          {t("Banned")}
                        </span>
                        {user.BannedUntil && (
                          <div className="text-xs text-muted-foreground">
                            {t("BannedUntil")}: {formatDate(user.BannedUntil)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/profile/${user.ProfileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        {t("ViewOnProfile")}
                      </a>
                      <button
                        onClick={() => openWarnDialog(user.ProfileId, user.Username)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
                      >
                        {t("WarnUser")}
                      </button>
                      {user.IsBanned ? (
                        <button
                          onClick={() => handleUnban(user.ProfileId, user.Username)}
                          disabled={actionLoading === user.ProfileId}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === user.ProfileId
                            ? t("Loading")
                            : t("UnbanUser")}
                        </button>
                      ) : (
                        <button
                          onClick={() => openBanDialog(user.ProfileId, user.Username)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          {t("BanUser")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {users.totalCount > users.pageSize && (
          <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * users.pageSize + 1} to{" "}
              {Math.min(page * users.pageSize, users.totalCount)} of{" "}
              {users.totalCount} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * users.pageSize >= users.totalCount}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ban Dialog */}
      {banDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t("BanUser")}: @{banDialog.username}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("BanReason")} *
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter the reason for banning this user..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("BanDuration")}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBanDays(null)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      banDays === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t("Permanent")}
                  </button>
                  {[1, 3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setBanDays(days)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        banDays === days
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {days} {t("Days")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={closeBanDialog}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  {t("CancelAction")}
                </button>
                <button
                  onClick={handleBan}
                  disabled={actionLoading === banDialog.userId || !banReason.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === banDialog.userId ? t("Loading") : t("BanUser")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warn Dialog */}
      {warnDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t("WarnUser")}: @{warnDialog.username}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("WarnMessage")} *
                </label>
                <textarea
                  value={warnMessage}
                  onChange={(e) => setWarnMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter the warning message for this user..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={closeWarnDialog}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  {t("CancelAction")}
                </button>
                <button
                  onClick={handleWarn}
                  disabled={actionLoading === warnDialog.userId || !warnMessage.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === warnDialog.userId ? t("Loading") : t("SendWarning")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
