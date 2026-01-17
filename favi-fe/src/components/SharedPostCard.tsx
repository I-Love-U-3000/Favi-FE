import { useRouter } from "@/i18n/routing";
import type { RepostResponse, ReactionType } from "@/types";
import postAPI from "@/lib/api/postAPI";

interface SharedPostCardProps {
  repost: RepostResponse;
  onNavigateToOriginal: () => void;
  onProfileClick: () => void;
}

export default function SharedPostCard({ repost, onNavigateToOriginal, onProfileClick }: SharedPostCardProps) {
  const router = useRouter();

  const handleReaction = async (type: ReactionType) => {
    try {
      // This would need to be implemented - reactions on reposts
      // For now, it's a placeholder
      console.log("Reaction on repost:", type);
    } catch (e) {
      console.error("Error reacting to repost:", e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sharer Info */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:opacity-80"
        style={{ backgroundColor: "var(--bg-primary)" }}
        onClick={onProfileClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={repost.avatarUrl || "/avatar-default.svg"}
          alt={repost.username}
          className="w-12 h-12 rounded-full border object-cover"
          style={{ borderColor: "var(--border)" }}
        />
        <div className="flex-1">
          <div className="font-semibold" style={{ color: "var(--text)" }}>
            {repost.displayName || repost.username}
          </div>
          <div className="text-sm opacity-70" style={{ color: "var(--text-secondary)" }}>
            @{repost.username}
          </div>
        </div>
        <div className="text-xs opacity-60" style={{ color: "var(--text-secondary)" }}>
          Shared a post
        </div>
      </div>

      {/* Sharer's Caption */}
      {repost.caption && (
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
            {repost.caption}
          </p>
        </div>
      )}

      {/* Nested Original Post */}
      <div
        className="border rounded-xl overflow-hidden cursor-pointer transition-all hover:opacity-90"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-primary)" }}
        onClick={onNavigateToOriginal}
      >
        {/* Original Post Header */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={repost.originalAuthorAvatarUrl || "/avatar-default.svg"}
            alt={repost.originalAuthorUsername}
            className="w-10 h-10 rounded-full border object-cover"
            style={{ borderColor: "var(--border)" }}
          />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {repost.originalAuthorDisplayName || repost.originalAuthorUsername}
            </div>
            <div className="text-xs opacity-60" style={{ color: "var(--text-secondary)" }}>
              Original post · {new Date(repost.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Original Post Content */}
        {repost.originalCaption && (
          <div className="p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
              {repost.originalCaption}
            </p>
          </div>
        )}

        {/* Original Post Media */}
        {repost.originalPostMedias && repost.originalPostMedias.length > 0 && (
          <div className={`grid gap-1 ${repost.originalPostMedias.length === 1 ? 'grid-cols-1' : repost.originalPostMedias.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {repost.originalPostMedias.map((media) => (
              <div key={media.id} className="aspect-square relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url}
                  alt="Post media"
                  className="w-full h-full object-cover"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Original Post Footer */}
        <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-4">
            {/* Reactions */}
            <div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              <span className="text-xl">❤️</span>
              <span className="text-sm">{repost.reactions.total}</span>
            </div>
            {/* Comments */}
            <div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              <span className="text-xl">💬</span>
              <span className="text-sm">{repost.commentsCount}</span>
            </div>
            {/* Reposts */}
            <div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              <span className="text-xl">🔄</span>
              <span className="text-sm">{repost.repostsCount}</span>
            </div>
          </div>
          <div className="text-xs opacity-60" style={{ color: "var(--text-secondary)" }}>
            View original post
          </div>
        </div>
      </div>

      {/* Engagement Bar for the Repost itself */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="flex items-center gap-4">
          {/* Reaction */}
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{ color: repost.reactions.currentUserReaction ? "#ef4444" : "var(--text-secondary)" }}
            onClick={() => handleReaction(repost.reactions.currentUserReaction || "Like" as ReactionType)}
          >
            <span className="text-lg">
              {repost.reactions.currentUserReaction === "Like" ? "❤️" : "🤍"}
            </span>
            <span className="text-sm">{repost.reactions.total}</span>
          </button>

          {/* Comment */}
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="text-lg">💬</span>
            <span className="text-sm">{repost.commentsCount}</span>
          </button>
        </div>

        {/* Share */}
        <button
          className="px-3 py-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          🔄 Share
        </button>
      </div>

      {/* Timestamp */}
      <div className="text-center text-xs opacity-60" style={{ color: "var(--text-secondary)" }}>
        Shared {new Date(repost.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
