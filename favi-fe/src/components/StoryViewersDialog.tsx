"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import storyAPI from "@/lib/api/storyAPI";
import type { StoryViewerResponse } from "@/types";
import { useTranslations } from "next-intl";

interface StoryViewersDialogProps {
  visible: boolean;
  onHide: () => void;
  storyId: string;
}

export default function StoryViewersDialog({
  visible,
  onHide,
  storyId,
}: StoryViewersDialogProps) {
  const t = useTranslations("Stories");
  const router = useRouter();
  const [viewers, setViewers] = useState<StoryViewerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  // Wrap onHide to prevent event bubbling to parent dialog
  const handleHide = useCallback((e?: any) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onHide();
  }, [onHide]);

  const loadViewers = useCallback(async () => {
    if (!storyId || hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    setLoading(true);
    try {
      const data = await storyAPI.getViewers(storyId);
      setViewers(data);
    } catch (error) {
      console.error("Failed to load viewers:", error);
      setViewers([]);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (visible && storyId) {
      hasLoadedRef.current = false;
      loadViewers();
    }
  }, [visible, storyId, loadViewers]);

  const timeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }, []);

  const handleViewerClick = useCallback((viewer: StoryViewerResponse) => {
    handleHide();
    router.push(`/profile/${viewer.viewerId}`);
  }, [handleHide, router]);

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header={
        <div className="flex items-center gap-2">
          <i className="pi pi-eye text-xl" />
          <span className="font-semibold">{t("Views")}</span>
        </div>
      }
      style={{ width: "90vw", maxWidth: "500px" }}
      className="rounded-xl"
      contentClassName="!p-0"
      headerClassName="!py-3 !px-4 border-b"
      modal
      dismissableMask
      closeOnEscape
      appendTo={typeof document !== "undefined" ? document.body : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col" style={{ color: "var(--text)" }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <i className="pi pi-spin pi-spinner text-2xl" />
          </div>
        ) : viewers.length === 0 ? (
          <div className="flex items-center justify-center h-48 opacity-70">
            <div className="text-center">
              <i className="pi pi-eye-slash text-4xl mb-2" />
              <p>{t("NoViewsYet")}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
            {viewers.map((viewer) => (
              <button
                key={viewer.viewerId}
                onClick={() => handleViewerClick(viewer)}
                className="w-full text-left transition-colors hover:bg-opacity-80"
                style={{ backgroundColor: "transparent" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  {viewer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={viewer.avatarUrl}
                      alt={viewer.displayName || viewer.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {(viewer.displayName || viewer.username)?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Name and time */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {viewer.displayName || viewer.username}
                    </p>
                    <p className="text-sm opacity-70 truncate">@{viewer.username}</p>
                    <p className="text-xs opacity-50 mt-1">{timeAgo(viewer.viewedAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
