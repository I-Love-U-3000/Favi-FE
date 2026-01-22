"use client";

import { use, useState } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import { TabView, TabPanel } from "primereact/tabview";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Skeleton } from "primereact/skeleton";
import {
  useUser,
  useUserPosts,
  useUserWarnHistory,
  useUserBanHistory,
  useBanUser,
  useUnbanUser,
  useWarnUser,
  UserDto,
} from "@/hooks/queries/useAdminUsers";
import BanUserDialog from "@/components/admin/modals/BanUserDialog";
import WarnUserDialog from "@/components/admin/modals/WarnUserDialog";
import { confirmDialog } from "primereact/confirmdialog";
import { useOverlay } from "@/components/RootProvider";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const toast = useOverlay();

  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showWarnDialog, setShowWarnDialog] = useState(false);

  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: posts, isLoading: postsLoading } = useUserPosts(userId);
  const { data: warnHistory, isLoading: warnLoading } = useUserWarnHistory(userId);
  const { data: banHistory, isLoading: banLoading } = useUserBanHistory(userId);

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const warnUser = useWarnUser();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return formatDate(date);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.showToast({
      severity: "success",
      summary: "Copied",
      detail: `${label} copied to clipboard`,
    });
  };

  const handleBan = (reason?: string) => {
    banUser.mutate({ userId, reason });
    setShowBanDialog(false);
  };

  const handleUnban = () => {
    confirmDialog({
      message: "Are you sure you want to unban this user?",
      header: "Confirm Unban",
      icon: "pi pi-question-circle",
      accept: () => unbanUser.mutate(userId),
    });
  };

  const handleWarn = (reason?: string) => {
    warnUser.mutate({ userId, reason });
    setShowWarnDialog(false);
  };

  // Post actions
  const postActionsTemplate = (post: any) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-external-link"
          className="p-button-text p-button-sm"
          tooltip="View post"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-text p-button-sm p-button-danger"
          tooltip="Delete post"
        />
      </div>
    );
  };

  const postMediaTemplate = (post: any) => {
    if (post.mediaUrl) {
      return (
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          <img
            src={post.mediaUrl}
            alt="Post thumbnail"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <i className="pi pi-image text-gray-400" />
      </div>
    );
  };

  const postStatsTemplate = (post: any) => {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <i className="pi pi-heart text-red-500" />
          {formatNumber(post.likeCount)}
        </span>
        <span className="flex items-center gap-1">
          <i className="pi pi-comment text-blue-500" />
          {formatNumber(post.commentCount)}
        </span>
      </div>
    );
  };

  // Loading state
  if (userLoading) {
    return (
      <div className="space-y-6">
        <Skeleton width="200px" height="2rem" className="mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <Skeleton width="150px" height="150px" borderRadius="50%" className="mb-4 mx-auto" />
            <Skeleton width="80%" className="mb-2" />
            <Skeleton width="60%" />
          </Card>
          <Card className="lg:col-span-2">
            <Skeleton width="100%" height="200px" />
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <i className="pi pi-user text-6xl text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          User not found
        </h2>
        <p className="text-gray-500 mb-4">The user you're looking for doesn't exist.</p>
        <Link href="/admin/users">
          <Button label="Back to Users" icon="pi pi-arrow-left" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition">
        <i className="pi pi-arrow-left" />
        <span>Back to Users</span>
      </Link>

      {/* Profile Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar & Quick Actions */}
        <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col items-center text-center">
            <Avatar
              image={user.avatarUrl}
              icon={!user.avatarUrl ? "pi pi-user" : undefined}
              shape="circle"
              size="xlarge"
              className="w-32 h-32 mb-4 bg-primary/10"
              style={{ fontSize: "3rem" }}
            />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              @{user.username}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {user.displayName || "No display name"}
            </p>

            <div className="flex gap-2 w-full">
              {user.isBanned ? (
                <Button
                  label="Unban"
                  icon="pi pi-check"
                  severity="success"
                  className="flex-1"
                  onClick={handleUnban}
                  loading={unbanUser.isPending}
                />
              ) : (
                <>
                  <Button
                    label="Ban"
                    icon="pi pi-ban"
                    severity="danger"
                    className="flex-1"
                    onClick={() => setShowBanDialog(true)}
                  />
                  <Button
                    label="Warn"
                    icon="pi pi-exclamation-triangle"
                    severity="warning"
                    className="flex-1"
                    onClick={() => setShowWarnDialog(true)}
                  />
                </>
              )}
            </div>
          </div>
        </Card>

        {/* User Info */}
        <Card className="lg:col-span-2 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-lg font-semibold mb-4">User Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg -m-2 transition"
                onClick={() => handleCopy(user.username, "Username")}
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  @{user.username}
                </span>
                <i className="pi pi-copy text-xs text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg -m-2 transition"
                onClick={() => handleCopy(user.email, "Email")}
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {user.email}
                </span>
                <i className="pi pi-copy text-xs text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
              <Tag
                value={user.role === "admin" ? "Administrator" : "User"}
                severity={user.role === "admin" ? "info" : "secondary"}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <Tag
                value={user.isBanned ? "Banned" : "Active"}
                severity={user.isBanned ? "danger" : "success"}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Joined</p>
              <p className="text-gray-900 dark:text-white">
                {formatDate(user.createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Last Active</p>
              <p className="text-gray-900 dark:text-white">
                {formatRelativeTime(user.lastActiveAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <TabView>
          {/* Posts Tab */}
          <TabPanel header={`Posts (${posts?.totalCount || 0})`}>
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height="60px" />
                ))}
              </div>
            ) : posts?.items && posts.items.length > 0 ? (
              <DataTable
                value={posts.items}
                dataKey="id"
                className="p-datatable-sm"
                responsiveLayout="scroll"
              >
                <Column header="Media" body={postMediaTemplate} style={{ width: "80px" }} />
                <Column
                  field="caption"
                  header="Caption"
                  body={(row: any) => (
                    <div className="max-w-md truncate">{row.caption || "No caption"}</div>
                  )}
                />
                <Column header="Stats" body={postStatsTemplate} style={{ width: "150px" }} />
                <Column
                  field="createdAt"
                  header="Date"
                  body={(row: any) => formatDate(row.createdAt)}
                  style={{ width: "150px" }}
                />
                <Column header="Actions" body={postActionsTemplate} style={{ width: "100px" }} />
              </DataTable>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="pi pi-file text-4xl mb-2 opacity-50" />
                <p>No posts yet</p>
              </div>
            )}
          </TabPanel>

          {/* Warn History Tab */}
          <TabPanel header="Warnings">
            {warnLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height="60px" />
                ))}
              </div>
            ) : warnHistory && warnHistory.length > 0 ? (
              <DataTable
                value={warnHistory}
                dataKey="id"
                className="p-datatable-sm"
                responsiveLayout="scroll"
              >
                <Column
                  header="Date"
                  body={(row: any) => formatDate(row.createdAt)}
                  style={{ width: "180px" }}
                />
                <Column header="Reason" field="reason" />
                <Column
                  header="Admin"
                  body={(row: any) => row.adminName || row.adminId}
                  style={{ width: "150px" }}
                />
              </DataTable>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="pi pi-check-circle text-4xl mb-2 opacity-50 text-green-500" />
                <p>No warnings sent</p>
              </div>
            )}
          </TabPanel>

          {/* Ban History Tab */}
          <TabPanel header="Ban History">
            {banLoading ? (
              <Skeleton width="100%" height="100px" />
            ) : banHistory ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <i className="pi pi-ban text-red-500 text-xl" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-300">Currently Banned</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {formatDate(banHistory.createdAt)}
                    </p>
                  </div>
                </div>
                {banHistory.reason && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                    <p className="text-gray-900 dark:text-white">{banHistory.reason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="pi pi-check-circle text-4xl mb-2 opacity-50 text-green-500" />
                <p>User has never been banned</p>
              </div>
            )}
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel header="Activity">
            <div className="text-center py-8 text-gray-500">
              <i className="pi pi-chart-line text-4xl mb-2 opacity-50" />
              <p>Activity timeline coming soon</p>
            </div>
          </TabPanel>
        </TabView>
      </Card>

      {/* Ban Dialog */}
      <BanUserDialog
        visible={showBanDialog}
        onHide={() => setShowBanDialog(false)}
        userId={userId}
        userName={user.username}
        onBan={handleBan}
        loading={banUser.isPending}
      />

      {/* Warn Dialog */}
      <WarnUserDialog
        visible={showWarnDialog}
        onHide={() => setShowWarnDialog(false)}
        userId={userId}
        userName={user.username}
        onWarn={handleWarn}
        loading={warnUser.isPending}
      />
    </div>
  );
}
