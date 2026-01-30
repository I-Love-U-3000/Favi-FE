"use client";

import { use, useState } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { useOverlay } from "@/components/RootProvider";
import { usePost, useDeletePost } from "@/hooks/queries/useAdminPosts";
import { PostDto } from "@/lib/api/admin";
import { profileAPI } from "@/lib/api/profileAPI";
import DeleteContentDialog from "@/components/admin/modals/DeleteContentDialog";

const PRIVACY_COLORS: Record<string, "success" | "info" | "warning" | undefined> = {
  public: "success",
  private: "info",
  followers: "warning",
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  const router = useRouter();
  const { showToast } = useOverlay();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: post, isLoading: postLoading } = usePost(postId);
  const deletePost = useDeletePost();

  // Fetch author profile to get username
  const { data: authorProfile } = useQuery({
    queryKey: ["profile", post?.authorProfileId],
    queryFn: () => profileAPI.getById(post!.authorProfileId),
    enabled: !!post?.authorProfileId,
  });

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

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = (reason?: string) => {
    deletePost.mutate(
      { postId, reason },
      {
        onSuccess: () => {
          router.push("/admin/posts");
        },
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      severity: "success",
      summary: "Copied",
      detail: "Copied to clipboard",
    });
  };

  if (postLoading) {
    return (
      <div className="space-y-6">
        <Skeleton width="300px" height="40px" className="mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton height="400px" />
          </div>
          <div>
            <Skeleton height="300px" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <i className="pi pi-exclamation-triangle text-5xl text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Post not found
        </h2>
        <p className="text-gray-500 mt-2">
          The post you're looking for doesn't exist or has been deleted.
        </p>
        <Button
          label="Back to Posts"
          icon="pi pi-arrow-left"
          className="mt-4"
          onClick={() => router.push("/admin/posts")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            icon="pi pi-arrow-left"
            className="p-button-text"
            onClick={() => router.push("/admin/posts")}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Post Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ID: {post.id}
              <Button
                icon="pi pi-copy"
                className="p-button-text p-button-sm ml-2"
                onClick={() => copyToClipboard(post.id)}
              />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            onClick={handleDelete}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Preview */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Media">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
              {(() => {
                // Check for media in medias array first, then fallback to mediaUrl
                const firstMedia = post.medias?.[0];
                const mediaUrl = firstMedia?.url || post.mediaUrl;

                if (!mediaUrl) {
                  return (
                    <div className="text-center text-gray-400">
                      <i className="pi pi-image text-6xl mb-2" />
                      <p>No media available</p>
                    </div>
                  );
                }

                // Determine if media is video based on mediaType, format, or file extension
                const isVideo = post.mediaType === "video" ||
                  firstMedia?.format?.startsWith('video') ||
                  mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i);

                if (isVideo) {
                  return (
                    <video
                      src={mediaUrl}
                      controls
                      className="max-w-full max-h-full"
                    />
                  );
                }

                // Default to image
                return (
                  <img
                    src={mediaUrl}
                    alt="Post media"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      console.error('Failed to load image:', mediaUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                );
              })()}
            </div>
          </Card>
        </div>

        {/* Post Info */}
        <div className="space-y-6">
          {/* Caption */}
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Caption">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {post.caption || "No caption"}
            </p>
          </Card>

          {/* Author */}
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Author">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80"
              onClick={() => router.push(`/admin/users/${post.authorProfileId || post.author?.id}`)}
            >
              <Avatar
                image={authorProfile?.avatarUrl || post.authorAvatarUrl || post.authorAvatar || post.author?.avatar}
                icon={!(authorProfile?.avatarUrl || post.authorAvatarUrl || post.authorAvatar || post.author?.avatar) ? "pi pi-user" : undefined}
                shape="circle"
                size="large"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  @{authorProfile?.username || post.authorUsername || post.author?.username}
                </p>
                <p className="text-sm text-gray-500">View profile</p>
              </div>
              <i className="pi pi-external-link ml-auto text-gray-400" />
            </div>
          </Card>

          {/* Stats */}
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Statistics">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Likes</span>
                <span className="font-medium">{formatNumber(post.reactionsCount ?? post.likeCount ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Comments</span>
                <span className="font-medium">{formatNumber(post.commentsCount ?? post.commentCount ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Privacy</span>
                <Tag
                  value={post.privacy ? post.privacy.charAt(0).toUpperCase() + post.privacy.slice(1) : (post.privacyLevel === 0 ? "Public" : post.privacyLevel === 1 ? "Followers" : "Private")}
                  severity={PRIVACY_COLORS[post.privacy || (post.privacyLevel === 0 ? "public" : post.privacyLevel === 1 ? "followers" : "private")]}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="shadow-sm border border-gray-100 dark:border-gray-800" title="Quick Actions">
            <div className="space-y-2">
              <Button
                label="View on Profile"
                icon="pi pi-external-link"
                className="w-full p-button-outlined"
                onClick={() =>
                  window.open(`/profile/${post.authorProfileId || post.author?.id}/posts/${post.id}`, "_blank")
                }
              />
              <Button
                label="View Author"
                icon="pi pi-user"
                className="w-full p-button-outlined"
                onClick={() => router.push(`/admin/users/${post.authorProfileId || post.author?.id}`)}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteContentDialog
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        contentId={postId}
        contentType="post"
        onDelete={handleDeleteConfirm}
        loading={deletePost.isPending}
      />
    </div>
  );
}
