"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { mockPosts, createPagedResult } from "@/lib/mock/adminMockData";
import type { PagedResult, AnalyticsPostDto } from "@/types/admin";
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
  ResponsiveContainer,
} from "recharts";

type DeleteDialogState = {
  isOpen: boolean;
  postId: string | null;
  postCaption: string | null;
};

export default function AdminPostsPage() {
  const t = useTranslations("AdminPanel");
  const [posts, setPosts] = useState<PagedResult<AnalyticsPostDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    postId: null,
    postCaption: null,
  });
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Use mock data with pagination
        const data = createPagedResult(mockPosts, page, 20);
        setPosts(data);
      } catch (err: any) {
        console.error("Failed to fetch posts:", err);
        setError(err?.message || t("LoadFailed"));
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [page, t]);

  const handleDelete = async () => {
    if (!deleteDialog.postId || !deleteReason.trim()) {
      alert("Please provide a delete reason.");
      return;
    }

    try {
      setActionLoading(deleteDialog.postId);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Remove post from mock data
      const index = mockPosts.findIndex((p) => p.PostId === deleteDialog.postId);
      if (index !== -1) {
        mockPosts.splice(index, 1);
      }

      // Refresh posts
      const data = createPagedResult(mockPosts, page, 20);
      setPosts(data);

      alert(t("DeleteSuccess"));
      closeDeleteDialog();
    } catch (err: any) {
      console.error("Failed to delete post:", err);
      alert(t("DeleteFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteDialog = (postId: string, postCaption: string | null) => {
    setDeleteDialog({ isOpen: true, postId, postCaption });
    setDeleteReason("");
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, postId: null, postCaption: null });
    setDeleteReason("");
  };

  const getPrivacyLabel = (privacyLevel: number) => {
    switch (privacyLevel) {
      case 0:
        return t("Public");
      case 1:
        return t("Private");
      case 2:
        return t("FollowersOnly");
      case 3:
        return t("CollectionsOnly");
      default:
        return "-";
    }
  };

  const getPrivacyColor = (privacyLevel: number) => {
    switch (privacyLevel) {
      case 0:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 1:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 2:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 3:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
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

  if (!posts || posts.items.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">{t("Posts")}</h2>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("EmptyPosts")}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const privacyLevelData = [
    { name: t("Public"), value: posts.items.filter((p) => p.PrivacyLevel === 0).length },
    { name: t("Private"), value: posts.items.filter((p) => p.PrivacyLevel === 1).length },
    { name: t("FollowersOnly"), value: posts.items.filter((p) => p.PrivacyLevel === 2).length },
    { name: t("CollectionsOnly"), value: posts.items.filter((p) => p.PrivacyLevel === 3).length },
  ];

  const topReportedPosts = [...posts.items]
    .sort((a, b) => b.ReportsCount - a.ReportsCount)
    .slice(0, 5)
    .map((p) => ({
      name: p.AuthorUsername,
      reports: p.ReportsCount,
    }));

  const topLikedPosts = [...posts.items]
    .sort((a, b) => b.LikesCount - a.LikesCount)
    .slice(0, 5)
    .map((p) => ({
      name: p.AuthorUsername,
      likes: p.LikesCount,
    }));

  const PRIVACY_COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">{t("Posts")}</h2>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Privacy Level Distribution */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("Privacy")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={privacyLevelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {privacyLevelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PRIVACY_COLORS[index % PRIVACY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Most Reported Posts */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("Reports")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topReportedPosts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" width={100} className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="reports" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Liked Posts */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-medium text-foreground mb-4">{t("Likes")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topLikedPosts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" width={100} className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="likes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Posts Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Post")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Author")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("CreatedAt")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Privacy")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Likes")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Comments")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  {t("Reports")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  {t("Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.items.map((post) => (
                <tr key={post.PostId} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {post.ThumbnailUrl && (
                        <img
                          src={post.ThumbnailUrl}
                          alt={post.Caption || "Post"}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground">
                          ID: {post.PostId.slice(0, 8)}...
                        </div>
                        {post.Caption && (
                          <div className="text-sm text-foreground max-w-xs truncate mt-1">
                            {post.Caption}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="font-medium text-foreground">
                        {post.AuthorDisplayName || post.AuthorUsername}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{post.AuthorUsername}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(post.CreatedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrivacyColor(
                        post.PrivacyLevel
                      )}`}
                    >
                      {getPrivacyLabel(post.PrivacyLevel)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground">{post.LikesCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground">{post.CommentsCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground">{post.ReportsCount}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/posts/${post.PostId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      >
                        {t("ViewPost")}
                      </a>
                      <button
                        onClick={() => openDeleteDialog(post.PostId, post.Caption)}
                        disabled={actionLoading === post.PostId}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading === post.PostId ? t("Loading") : t("DeletePost")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {posts.totalCount > posts.pageSize && (
          <div className="border-t bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t("Showing", {
                from: (page - 1) * posts.pageSize + 1,
                to: Math.min(page * posts.pageSize, posts.totalCount),
                total: posts.totalCount,
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("AriaPrevious")}
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * posts.pageSize >= posts.totalCount}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("AriaNext")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t("DeletePost")}
            </h3>

            <div className="space-y-4">
              {deleteDialog.postCaption && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">{deleteDialog.postCaption}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("DeleteReason")} *
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter the reason for deleting this post..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={closeDeleteDialog}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  {t("CancelAction")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === deleteDialog.postId || !deleteReason.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === deleteDialog.postId ? t("Loading") : t("DeletePost")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
