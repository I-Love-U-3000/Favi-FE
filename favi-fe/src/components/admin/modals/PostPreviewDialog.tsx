"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Tag } from "primereact/tag";
import { PostDto } from "@/hooks/queries/useAdminPosts";

interface PostPreviewDialogProps {
  visible: boolean;
  onHide: () => void;
  post: PostDto;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

export default function PostPreviewDialog({
  visible,
  onHide,
  post,
  onDelete,
  deleteLoading = false,
}: PostPreviewDialogProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const privacySeverity = {
    public: "success",
    private: "danger",
    followers: "info",
  } as const;

  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        label="Close"
        className="p-button-text"
        onClick={onHide}
      />
      {onDelete && (
        <Button
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          onClick={onDelete}
          loading={deleteLoading}
        />
      )}
    </div>
  );

  return (
    <Dialog
      header="Post Preview"
      visible={visible}
      onHide={onHide}
      style={{ width: "600px", maxWidth: "90vw" }}
      footer={footer}
      className="p-fluid"
    >
      <div className="space-y-4">
        {/* Author Info */}
        <div className="flex items-center gap-3">
          <Avatar
            image={post.author?.avatar}
            icon={!post.author?.avatar ? "pi pi-user" : undefined}
            shape="circle"
            size="normal"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              @{post.author?.username || "Unknown"}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(post.createdAt)}
            </div>
          </div>
          <Tag
            value={post.privacy.charAt(0).toUpperCase() + post.privacy.slice(1)}
            severity={privacySeverity[post.privacy]}
            className="ml-auto"
          />
        </div>

        {/* Media */}
        {post.mediaUrl && (
          <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {post.mediaType === "image" ? (
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="w-full max-h-80 object-contain"
              />
            ) : (
              <video
                src={post.mediaUrl}
                controls
                className="w-full max-h-80"
              />
            )}
          </div>
        )}

        {/* Caption */}
        <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
          {post.caption || "No caption"}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <i className="pi pi-heart text-red-500" />
            {post.likeCount?.toLocaleString() || 0} likes
          </span>
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <i className="pi pi-comment text-blue-500" />
            {post.commentCount?.toLocaleString() || 0} comments
          </span>
        </div>
      </div>
    </Dialog>
  );
}
