"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import postAPI from "@/lib/api/postAPI";
import type { PostReactionResponse, ReactionType } from "@/types";
import { useTranslations } from "next-intl";

interface PostReactorsDialogProps {
  visible: boolean;
  onHide: () => void;
  postId: string;
}

const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  Like: "👍",
  Love: "❤️",
  Haha: "😂",
  Wow: "😮",
  Sad: "😢",
  Angry: "😡",
};

export default function PostReactorsDialog({
  visible,
  onHide,
  postId,
}: PostReactorsDialogProps) {
  const t = useTranslations("Reactions");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [reactors, setReactors] = useState<PostReactionResponse[]>([]);
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

  const loadReactors = useCallback(async () => {
    if (!postId || hasLoadedRef.current) return;

    hasLoadedRef.current = true;
    setLoading(true);
    try {
      const data = await postAPI.getReactors(postId);
      setReactors(data);
    } catch (error) {
      console.error("Failed to load reactors:", error);
      setReactors([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible && postId) {
      hasLoadedRef.current = false;
      loadReactors();
    }
  }, [visible, postId, loadReactors]);

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

  const handleReactorClick = useCallback((reactor: PostReactionResponse) => {
    handleHide();
    router.push(`/profile/${reactor.profileId}`);
  }, [handleHide, router]);

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header={
        <div className="flex items-center gap-2">
          <span className="text-xl">❤️</span>
          <span className="font-semibold">{t("Reactions")}</span>
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
        ) : reactors.length === 0 ? (
          <div className="flex items-center justify-center h-48 opacity-70">
            <div className="text-center">
              <span className="text-4xl mb-2 block">💔</span>
              <p>{t("NoReactionsYet")}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
            {reactors.map((reactor) => (
              <button
                key={reactor.profileId}
                onClick={() => handleReactorClick(reactor)}
                className="w-full text-left transition-colors hover:bg-opacity-80"
                style={{ backgroundColor: "transparent" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  {reactor.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reactor.avatarUrl}
                      alt={reactor.displayName || reactor.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {(reactor.displayName || reactor.username)?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Name, username, reaction emoji and time */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {reactor.displayName || reactor.username}
                      </p>
                      <span className="text-lg">
                        {REACTION_EMOJI_MAP[reactor.reactionType]}
                      </span>
                    </div>
                    <p className="text-sm opacity-70 truncate">@{reactor.username}</p>
                    <p className="text-xs opacity-50 mt-1">{timeAgo(reactor.createdAt)}</p>
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
