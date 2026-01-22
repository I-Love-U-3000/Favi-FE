"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Menu } from "primereact/menu";
import { Skeleton } from "primereact/skeleton";
import { useDeletePost } from "@/hooks/queries/useAdminPosts";
import { PostDto } from "@/lib/api/admin";
import DeleteContentDialog from "@/components/admin/modals/DeleteContentDialog";
import PostPreviewDialog from "@/components/admin/modals/PostPreviewDialog";

interface PostsTableProps {
  posts?: PostDto[];
  loading?: boolean;
  totalRecords?: number;
  first?: number;
  onPageChange: (first: number, rows: number) => void;
  selection?: PostDto[];
  onSelectionChange: (selection: PostDto[]) => void;
}

export default function PostsTable({
  posts = [],
  loading = false,
  totalRecords = 0,
  first = 0,
  onPageChange,
  selection = [],
  onSelectionChange,
}: PostsTableProps) {
  const router = useRouter();
  const menuRef = useRef<Menu>(null);
  const [selectedPost, setSelectedPost] = useState<PostDto | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deletePost = useDeletePost();

  const handleMenuAction = (e: { item: { action: string } }, post: PostDto) => {
    switch (e.item.action) {
      case "view":
        setSelectedPost(post);
        setShowPreviewDialog(true);
        break;
      case "author":
        router.push(`/admin/users/${post.authorProfileId || post.author?.id}`);
        break;
      case "delete":
        setSelectedPost(post);
        setShowDeleteDialog(true);
        break;
      case "copy":
        navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
        break;
    }
  };

  const getMenuItems = (post: PostDto) => [
    {
      label: "View Full",
      icon: "pi pi-eye",
      action: "view",
    },
    {
      label: "View Author",
      icon: "pi pi-user",
      action: "author",
    },
    { separator: true },
    {
      label: "Copy Link",
      icon: "pi pi-link",
      action: "copy",
    },
    {
      label: "Delete",
      icon: "pi pi-trash",
      action: "delete",
      className: "text-red-600",
    },
  ];

  const actionsTemplate = (post: PostDto) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-text p-button-sm p-button-rounded"
          tooltip="Preview"
          onClick={() => {
            setSelectedPost(post);
            setShowPreviewDialog(true);
          }}
        />
        <Button
          icon="pi pi-ellipsis-v"
          className="p-button-text p-button-sm p-button-rounded"
          onClick={(e) => {
            setSelectedPost(post);
            menuRef.current?.toggle(e);
          }}
        />
        <Menu
          ref={menuRef}
          model={getMenuItems(post).map((item) => {
            if ("separator" in item) return { separator: true };
            return {
              label: item.label,
              icon: item.icon,
              className: item.className,
              command: () => handleMenuAction({ item: item as any }, post),
            };
          })}
          popup
        />
      </div>
    );
  };

  const contentTemplate = (post: PostDto) => {
    return (
      <div
        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 -m-2 rounded-lg transition"
        onClick={() => {
          setSelectedPost(post);
          setShowPreviewDialog(true);
        }}
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
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
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900 dark:text-white truncate">
            {post.caption || "No caption"}
          </p>
          {post.isDeleted && <Tag value="Deleted" severity="danger" className="mt-1 text-[10px]" />}
        </div>
      </div>
    );
  };

  const authorTemplate = (post: PostDto) => {
    const username = post.authorUsername || post.author?.username || "Unknown";
    const avatar = post.authorAvatar || post.author?.avatar;
    const authorId = post.authorProfileId || post.author?.id;

    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={() => authorId && router.push(`/admin/users/${authorId}`)}
      >
        <Avatar
          image={avatar}
          icon={!avatar ? "pi pi-user" : undefined}
          shape="circle"
        />
        <span className="text-sm text-gray-900 dark:text-white">
          @{username}
        </span>
      </div>
    );
  };

  const privacyTemplate = (post: PostDto) => {
    const privacy = (post.privacy || "public").toLowerCase();
    const severity = {
      public: "success",
      private: "danger",
      followers: "info",
    } as const;

    const label = post.privacy
      ? post.privacy.charAt(0).toUpperCase() + post.privacy.slice(1)
      : (post.privacyLevel === 0 ? "Public" : post.privacyLevel === 1 ? "Followers" : "Private");

    const sev = (severity as any)[privacy] || "info";

    return (
      <Tag
        value={label}
        severity={sev}
        className="text-xs"
      />
    );
  };

  const statsTemplate = (post: PostDto) => {
    const likes = post.reactionsCount ?? post.likeCount ?? 0;
    const comments = post.commentsCount ?? post.commentCount ?? 0;
    return (
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <i className="pi pi-heart text-red-500" />
          {likes.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <i className="pi pi-comment text-blue-500" />
          {comments.toLocaleString()}
        </span>
      </div>
    );
  };

  const dateTemplate = (post: PostDto) => {
    return (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {new Date(post.createdAt).toLocaleDateString()}
      </span>
    );
  };

  const header = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
      <span className="text-sm text-gray-500">
        {loading ? "Loading..." : `${totalRecords} posts found`}
      </span>
    </div>
  );

  const emptyMessage = (
    <div className="text-center py-8">
      <i className="pi pi-file text-4xl text-gray-300 mb-2" />
      <p className="text-gray-500">No posts found</p>
    </div>
  );

  if (loading) {
    return (
      <div className="card">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b last:border-0 border-gray-100 dark:border-gray-800">
              <Skeleton width="20px" height="20px" />
              <Skeleton width="48px" height="48px" borderRadius="8px" />
              <div className="flex-1">
                <Skeleton width="60%" className="mb-2" />
                <Skeleton width="40%" />
              </div>
              <Skeleton width="60px" />
              <Skeleton width="100px" />
              <Skeleton width="50px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <DataTable
          value={posts}
          header={header}
          emptyMessage={emptyMessage}
          selection={selection}
          onSelectionChange={(e) => onSelectionChange(e.value)}
          selectionMode="multiple"
          dataKey="id"
          paginator
          rows={20}
          first={first}
          onPage={(e) => onPageChange(e.first, e.rows)}
          totalRecords={totalRecords}
          className="p-datatable-sm"
          responsiveLayout="scroll"
          rowHover
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            style={{ width: "3rem" }}
          />
          <Column
            header="Content"
            body={contentTemplate}
            style={{ minWidth: "250px" }}
          />
          <Column
            header="Author"
            body={authorTemplate}
            style={{ width: "150px" }}
          />
          <Column
            header="Privacy"
            body={privacyTemplate}
            style={{ width: "100px" }}
          />
          <Column
            header="Stats"
            body={statsTemplate}
            style={{ width: "120px" }}
          />
          <Column
            header="Date"
            body={dateTemplate}
            style={{ width: "120px" }}
          />
          <Column
            header="Actions"
            body={actionsTemplate}
            style={{ width: "100px" }}
          />
        </DataTable>
      </div>

      {/* Preview Dialog */}
      <PostPreviewDialog
        visible={showPreviewDialog}
        onHide={() => {
          setShowPreviewDialog(false);
          setSelectedPost(null);
        }}
        post={selectedPost!}
        onDelete={() => {
          setShowPreviewDialog(false);
          setShowDeleteDialog(true);
        }}
        deleteLoading={deletePost.isPending}
      />

      {/* Delete Dialog */}
      <DeleteContentDialog
        visible={showDeleteDialog}
        onHide={() => {
          setShowDeleteDialog(false);
          setSelectedPost(null);
        }}
        contentId={selectedPost?.id || ""}
        contentType="post"
        onDelete={(id, reason) => {
          deletePost.mutate({ postId: id, reason });
          setShowDeleteDialog(false);
          setSelectedPost(null);
        }}
        loading={deletePost.isPending}
      />
    </>
  );
}
