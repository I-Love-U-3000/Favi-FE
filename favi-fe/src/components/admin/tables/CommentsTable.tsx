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
import { CommentDto, useDeleteComment } from "@/hooks/queries/useAdminComments";
import DeleteContentDialog from "@/components/admin/modals/DeleteContentDialog";

interface CommentsTableProps {
  comments?: CommentDto[];
  loading?: boolean;
  totalRecords?: number;
  first?: number;
  onPageChange: (first: number, rows: number) => void;
  selection?: CommentDto[];
  onSelectionChange: (selection: CommentDto[]) => void;
}

const STATUS_COLORS: Record<string, "success" | "info" | "warning" | "danger" | undefined> = {
  active: "success",
  hidden: "warning",
  deleted: "danger",
};

export default function CommentsTable({
  comments = [],
  loading = false,
  totalRecords = 0,
  first = 0,
  onPageChange,
  selection = [],
  onSelectionChange,
}: CommentsTableProps) {
  const router = useRouter();
  const menuRef = useRef<Menu>(null);
  const [selectedComment, setSelectedComment] = useState<CommentDto | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const deleteComment = useDeleteComment();

  const handleMenuAction = (e: { item: { action: string } }, comment: CommentDto) => {
    switch (e.item.action) {
      case "view-post":
        router.push(`/admin/posts/${comment.postId}`);
        break;
      case "view-comment":
        setSelectedComment(comment);
        setShowPreviewDialog(true);
        break;
      case "delete":
        setSelectedComment(comment);
        setShowDeleteDialog(true);
        break;
      case "author":
        router.push(`/admin/users/${comment.author.id}`);
        break;
    }
  };

  const getMenuItems = (comment: CommentDto) => [
    {
      label: "View Post",
      icon: "pi pi-external-link",
      action: "view-post",
    },
    {
      label: "View Comment",
      icon: "pi pi-eye",
      action: "view-comment",
    },
    { separator: true },
    {
      label: "Delete",
      icon: "pi pi-trash",
      action: "delete",
      className: "text-red-600",
    },
    { separator: true },
    {
      label: "View Author",
      icon: "pi pi-user",
      action: "author",
    },
  ].filter(Boolean);

  const actionsTemplate = (comment: CommentDto) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-text p-button-sm p-button-rounded"
          tooltip="View Details"
          onClick={() => {
            setSelectedComment(comment);
            setShowPreviewDialog(true);
          }}
        />
        <Button
          icon="pi pi-ellipsis-v"
          className="p-button-text p-button-sm p-button-rounded"
          onClick={(e) => {
            setSelectedComment(comment);
            menuRef.current?.toggle(e);
          }}
        />
        <Menu
          ref={menuRef}
          model={getMenuItems(comment).map((item: any) => ({
            label: item.label,
            icon: item.icon,
            className: item.className,
            command: () => handleMenuAction({ item }, comment),
          }))}
          popup
        />
      </div>
    );
  };

  const contentTemplate = (comment: CommentDto) => {
    return (
      <div className="flex items-start gap-3">
        <Avatar
          image={comment.author.avatar}
          icon={!comment.author.avatar ? "pi pi-user" : undefined}
          shape="circle"
          size="normal"
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">
              @{comment.author.username}
            </span>
            {comment.parent && (
              <span className="text-xs text-gray-500">
                replying to @{comment.parent.author.username}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {comment.content}
          </p>
          {comment.status !== "active" && (
            <Tag
              value={comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
              severity={STATUS_COLORS[comment.status] || "info"}
              className="mt-2 text-xs"
            />
          )}
        </div>
      </div>
    );
  };

  const postTemplate = (comment: CommentDto) => {
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={() => router.push(`/admin/posts/${comment.postId}`)}
      >
        <i className="pi pi-file text-gray-400" />
        <span className="text-sm text-gray-900 dark:text-white truncate max-w-32">
          {comment.post?.caption?.substring(0, 20) || comment.postId}
        </span>
      </div>
    );
  };

  const authorTemplate = (comment: CommentDto) => {
    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
        onClick={() => router.push(`/admin/users/${comment.author.id}`)}
      >
        <Avatar
          image={comment.author.avatar}
          icon={!comment.author.avatar ? "pi pi-user" : undefined}
          shape="circle"
          size="small"
        />
        <span className="text-sm text-gray-900 dark:text-white">
          @{comment.author.username}
        </span>
      </div>
    );
  };

  const statsTemplate = (comment: CommentDto) => {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <i className="pi pi-heart" />
          {comment.likeCount}
        </span>
        <span className="flex items-center gap-1">
          <i className="pi pi-reply" />
          {comment.replyCount}
        </span>
      </div>
    );
  };

  const dateTemplate = (comment: CommentDto) => {
    const date = new Date(comment.createdAt);
    return (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    );
  };

  const header = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
      <span className="text-sm text-gray-500">
        {loading ? "Loading..." : `${totalRecords} comments found`}
      </span>
    </div>
  );

  const emptyMessage = (
    <div className="text-center py-8">
      <i className="pi pi-comments text-4xl text-gray-300 mb-2" />
      <p className="text-gray-500">No comments found</p>
    </div>
  );

  if (loading) {
    return (
      <div className="card">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 border-b last:border-0 border-gray-100 dark:border-gray-800"
            >
              <Skeleton width="20px" height="20px" />
              <Skeleton width="40px" height="40px" borderRadius="8px" />
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
          value={comments}
          header={header}
          emptyMessage={emptyMessage}
          selection={selection}
          onSelectionChange={(e) => onSelectionChange(e.value)}
          dataKey="id"
          paginator
          rows={20}
          first={first}
          onPage={(e) => onPageChange(e.first, e.rows)}
          totalRecords={totalRecords}
          className="p-datatable-sm"
          responsiveLayout="scroll"
          rowHover
          sortField="createdAt"
          sortOrder={-1}
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            style={{ width: "3rem" }}
          />
          <Column
            header="Content"
            body={contentTemplate}
            style={{ minWidth: "300px" }}
          />
          <Column
            header="Author"
            body={authorTemplate}
            style={{ width: "150px" }}
          />
          <Column
            header="Post"
            body={postTemplate}
            style={{ width: "130px" }}
          />
          <Column
            header="Stats"
            body={statsTemplate}
            style={{ width: "100px" }}
          />
          <Column
            header="Date"
            body={dateTemplate}
            style={{ width: "130px" }}
            sortable
            sortField="createdAt"
          />
          <Column
            header="Actions"
            body={actionsTemplate}
            style={{ width: "100px" }}
          />
        </DataTable>
      </div>

      {/* Delete Dialog */}
      <DeleteContentDialog
        visible={showDeleteDialog}
        onHide={() => {
          setShowDeleteDialog(false);
          setSelectedComment(null);
        }}
        contentId={selectedComment?.id || ""}
        contentType="Comment"
        onConfirm={(reason) => {
          if (selectedComment) {
            deleteComment.mutate({
              commentId: selectedComment.id,
              reason,
            });
          }
          setShowDeleteDialog(false);
          setSelectedComment(null);
        }}
        loading={deleteComment.isPending}
      />

      {/* Preview Dialog */}
      <CommentPreviewDialog
        visible={showPreviewDialog}
        onHide={() => {
          setShowPreviewDialog(false);
          setSelectedComment(null);
        }}
        comment={selectedComment}
      />
    </>
  );
}

// Comment Preview Dialog Component
import { Dialog } from "primereact/dialog";

interface CommentPreviewDialogProps {
  visible: boolean;
  onHide: () => void;
  comment: CommentDto | null;
}

function CommentPreviewDialog({ visible, onHide, comment }: CommentPreviewDialogProps) {
  if (!comment) return null;

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Comment Details"
      style={{ width: "600px" }}
      modal
    >
      <div className="space-y-4">
        {/* Author Info */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <Avatar
            image={comment.author.avatar}
            icon={!comment.author.avatar ? "pi pi-user" : undefined}
            shape="circle"
            size="large"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {comment.author.displayName}
            </p>
            <p className="text-sm text-gray-500">@{comment.author.username}</p>
          </div>
        </div>

        {/* Comment Content */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Content</p>
          <p className="text-gray-900 dark:text-white">{comment.content}</p>
        </div>

        {/* Parent Comment */}
        {comment.parent && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Replying to @{comment.parent.author.username}:</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {comment.parent.content}
            </p>
          </div>
        )}

        {/* Post Info */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <i className="pi pi-file text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Post: {comment.post?.caption?.substring(0, 50) || comment.postId}
          </span>
          <Button
            label="View"
            icon="pi pi-external-link"
            className="p-button-text p-button-sm ml-auto"
            onClick={() => window.location.href = `/admin/posts/${comment.postId}`}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <i className="pi pi-heart" /> {comment.likeCount} likes
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <i className="pi pi-reply" /> {comment.replyCount} replies
          </span>
        </div>

        {/* Date */}
        <p className="text-xs text-gray-400">
          Posted: {new Date(comment.createdAt).toLocaleString()}
        </p>
      </div>
    </Dialog>
  );
}
