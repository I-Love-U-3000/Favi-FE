"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import collectionAPI from "@/lib/api/collectionAPI";
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
  const [optimisticReactions, setOptimisticReactions] = useState<ReactionSummaryDto | null>(null);

  const currentReactions = optimisticReactions || reactions;
  const userReaction = currentReactions?.currentUserReaction ?? null;
  const totalReactions = currentReactions?.total ?? 0;

  const handleReaction = async (type: ReactionType) => {
    if (!requireAuth()) return;

    const previousReaction = userReaction;
    // If clicking the same reaction, remove it. Otherwise, add/change to the new reaction.
    const isRemoving = previousReaction === type;

    // Optimistic update
    const nextReactions: ReactionSummaryDto = {
      byType: { ...currentReactions?.byType } || {
        Like: 0,
        Love: 0,
        Haha: 0,
        Wow: 0,
        Sad: 0,
        Angry: 0,
      },
      total: 0,
      currentUserReaction: null,
    };

    // Remove previous reaction if exists
    if (previousReaction && nextReactions.byType[previousReaction] > 0) {
      nextReactions.byType[previousReaction]--;
    }

    // Add new reaction if not removing
    if (!isRemoving) {
      nextReactions.byType[type]++;
      nextReactions.currentUserReaction = type;
    }
    // If removing, currentUserReaction stays null

    nextReactions.total = Object.values(nextReactions.byType).reduce((a, b) => a + b, 0);

    setOptimisticReactions(nextReactions);

    try {
      await collectionAPI.toggleReaction(collectionId, type);
      onReactionChange?.(nextReactions);
      setOptimisticReactions(null);
    } catch (error: any) {
      console.error("Error toggling reaction:", error);
      // Revert on error
      setOptimisticReactions(null);
      alert(error?.error || error?.message || "Failed to react to collection");
    }
  };

  const buttonSize = size === "small" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
  const emojiSize = size === "small" ? "text-sm" : "text-base";

  return (
    <div className="relative inline-flex items-center">
      <div
        className="relative"
        onMouseEnter={() => setPickerOpen(true)}
        onMouseLeave={() => setTimeout(() => setPickerOpen(false), 150)}
      >
        <button
          type="button"
          onClick={() => handleReaction(userReaction ?? "Like")}
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
            <i className="pi pi-heart" />
          )}
        </button>

        {pickerOpen && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 bg-black/75 text-white rounded-full px-2 py-1 flex items-center gap-1 shadow-lg"
            onMouseEnter={() => setPickerOpen(true)}
            onMouseLeave={() => setTimeout(() => setPickerOpen(false), 100)}
          >
            {REACTION_TYPES.map((r) => (
              <button
                key={r}
                type="button"
                className="w-8 h-8 grid place-items-center text-lg hover:scale-110 transition"
                onClick={() => handleReaction(r)}
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
