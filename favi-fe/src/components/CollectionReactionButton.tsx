"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import collectionAPI from "@/lib/api/collectionAPI";
import { readCollectionReaction, writeCollectionReaction } from "@/lib/collectionCache";
import type { ReactionType, ReactionSummaryDto } from "@/types";

const REACTION_EMOJIS: Record<ReactionType, string> = {
  Like: "👍",
  Love: "❤️",
  Haha: "😂",
  Wow: "😮",
  Sad: "😢",
  Angry: "😡",
};

const REACTION_TYPES: ReactionType[] = ["Like", "Love", "Haha", "Wow", "Sad", "Angry"];

interface CollectionReactionButtonProps {
  collectionId: string;
  reactions?: ReactionSummaryDto;
  onReactionChange?: (newReactions: ReactionSummaryDto | null) => void;
  size?: "small" | "normal";
  showCount?: boolean;
}

export default function CollectionReactionButton({
  collectionId,
  reactions,
  onReactionChange,
  size = "small",
  showCount = true,
}: CollectionReactionButtonProps) {
  const { requireAuth } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const hoverTimer = useRef<number | null>(null);

  // Read from cache synchronously on mount (like posts do)
  const cached = readCollectionReaction(collectionId);

  // Initialize state from cache first, then fall back to server data
  const [byType, setByType] = useState<Record<ReactionType, number>>(
    cached?.byType ?? {
      Like: reactions?.byType?.Like ?? 0,
      Love: reactions?.byType?.Love ?? 0,
      Haha: reactions?.byType?.Haha ?? 0,
      Wow: reactions?.byType?.Wow ?? 0,
      Sad: reactions?.byType?.Sad ?? 0,
      Angry: reactions?.byType?.Angry ?? 0,
    }
  );
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    (cached?.currentUserReaction ?? reactions?.currentUserReaction ?? null) as any
  );

  const totalReactions = Object.values(byType).reduce((a, b) => a + b, 0);

  // Sync from other views via localStorage version key (like posts do)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      const key = `collection_cache:${collectionId}`;
      if (!e || !e.key || (e.key !== key && e.key !== `${key}:v`)) return;
      const c = readCollectionReaction(collectionId);
      if (c?.byType) setByType(c.byType as any);
      if (typeof c?.currentUserReaction !== 'undefined') setUserReaction(c.currentUserReaction ?? null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [collectionId]);

  // Sync with server data when it changes (update cache if server has newer data)
  useEffect(() => {
    if (reactions && reactions.currentUserReaction !== undefined) {
      setUserReaction(reactions.currentUserReaction ?? null);
      setByType(reactions.byType as any);
    }
  }, [reactions]);

  const openPicker = () => {
    if (hoverTimer.current) { window.clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    setPickerOpen(true);
  };

  const closePickerWithDelay = (ms = 120) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setPickerOpen(false), ms) as unknown as number;
  };

  const chooseReaction = async (type: ReactionType) => {
    if (!requireAuth()) return;
    try {
      const prev = userReaction;
      // Optimistic update (like posts do)
      setByType(prevCounts => {
        const next = { ...prevCounts };
        if (prev && next[prev] > 0) next[prev] -= 1;
        if (prev !== type) next[type] = (next[type] || 0) + 1;
        return next;
      });
      setUserReaction(prev === type ? null : type);

      await collectionAPI.toggleReaction(collectionId, type);

      // Persist latest reaction snapshot for cross-view consistency
      const snapshot = { ...byType } as Record<ReactionType, number>;
      if (prev && snapshot[prev] > 0) snapshot[prev] -= 1;
      if (prev !== type) snapshot[type] = (snapshot[type] || 0) + 1;
      writeCollectionReaction(collectionId, { byType: snapshot, currentUserReaction: prev === type ? null : type });

      // Notify parent component
      onReactionChange?.({
        byType: snapshot,
        total: Object.values(snapshot).reduce((a, b) => a + b, 0),
        currentUserReaction: prev === type ? null : type,
      });
    } catch (e) {
      // On error, reload from server next time
      console.error("Error toggling reaction:", e);
    } finally {
      setPickerOpen(false);
    }
  };

  const buttonSize = size === "small" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
  const emojiSize = size === "small" ? "text-sm" : "text-base";

  return (
    <div className="relative inline-flex items-center">
      <div
        className="relative"
        onMouseEnter={openPicker}
        onMouseLeave={() => closePickerWithDelay(140)}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); userReaction ? chooseReaction(userReaction) : chooseReaction("Like"); }}
          className={`rounded-full border transition-colors ${buttonSize}`}
          style={{
            backgroundColor: "var(--bg)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          {userReaction ? (
            <span className={emojiSize}>{REACTION_EMOJIS[userReaction]}</span>
          ) : (
            <img src="/reaction-default.svg" alt="react" className="w-4 h-4" />
          )}
        </button>

        {pickerOpen && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[70] bg-black/75 text-white rounded-full px-1.5 py-1 flex items-center gap-1.5 shadow-lg"
            onMouseEnter={openPicker}
            onMouseLeave={() => closePickerWithDelay(120)}
          >
            {REACTION_TYPES.map((r) => (
              <button
                key={r}
                type="button"
                className="w-8 h-8 grid place-items-center text-xl hover:scale-110 transition"
                onClick={() => chooseReaction(r)}
                title={r}
              >
                {REACTION_EMOJIS[r]}
              </button>
            ))}
          </div>
        )}
      </div>

      {showCount && totalReactions > 0 && (
        <span className="ml-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          {totalReactions}
        </span>
      )}
    </div>
  );
}
