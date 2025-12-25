"use client";

import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import postAPI from "@/lib/api/postAPI";

type PostMenuDialogProps = {
  postId: string;
  onEdit?: () => void;
  onDeleted?: () => void;
  onArchived?: () => void;
  onUnarchived?: () => void;
  isArchived?: boolean;
};

export default function PostMenuDialog({
  postId,
  onEdit,
  onDeleted,
  onArchived,
  onUnarchived,
  isArchived = false,
}: PostMenuDialogProps) {
  const t = useTranslations("PostMenu");
  const tPostActions = useTranslations("PostActions");

  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleEdit = () => {
    setOpen(false);
    onEdit?.();
  };

  const handleArchive = async () => {
    const confirmMessage = isArchived
      ? tPostActions("Unarchive") + "?"
      : tPostActions("Archive") + "?";

    if (!confirm(confirmMessage)) return;

    try {
      setArchiving(true);
      setOpen(false);
      if (isArchived) {
        await postAPI.unarchive(postId);
        onUnarchived?.();
      } else {
        await postAPI.archive(postId);
        onArchived?.();
      }
    } catch (error: any) {
      alert(error?.error || error?.message || "Failed to archive post");
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      setDeleting(true);
      setOpen(false);
      await postAPI.delete(postId);
      onDeleted?.();
    } catch (error: any) {
      alert(error?.error || error?.message || "Failed to delete post");
      setDeleting(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="More options"
      >
        <i className="pi pi-ellipsis-h text-gray-600 dark:text-gray-400" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 z-50 w-48 overflow-hidden rounded-xl border bg-white shadow-lg dark:bg-neutral-900 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              onClick={handleEdit}
              disabled={deleting || archiving}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <i className="pi pi-pencil text-gray-500 dark:text-gray-400" />
              <span>{t("edit")}</span>
            </button>

            <button
              onClick={handleArchive}
              disabled={deleting || archiving}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {archiving ? (
                <i className="pi pi-spin pi-spinner text-gray-500 dark:text-gray-400" />
              ) : (
                <i className="pi pi-box text-gray-500 dark:text-gray-400" />
              )}
              <span>{isArchived ? tPostActions("Unarchive") : tPostActions("Archive")}</span>
            </button>

            <div className="my-1 mx-4 border-t border-gray-200 dark:border-gray-700" />

            <button
              onClick={handleDelete}
              disabled={deleting || archiving}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <i className="pi pi-spin pi-spinner" />
              ) : (
                <i className="pi pi-trash" />
              )}
              <span>{deleting ? t("deleting") : t("delete")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
