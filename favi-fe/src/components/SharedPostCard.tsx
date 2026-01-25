import { useRouter } from "@/i18n/routing";
import type { RepostResponse } from "@/types";

interface SharedPostCardProps {
  repost: RepostResponse;
  onNavigateToOriginal: () => void;
  onProfileClick: () => void;
}

export default function SharedPostCard({ repost, onNavigateToOriginal, onProfileClick }: SharedPostCardProps) {
  const router = useRouter();

  return (
    <div className="space-y-0 mb-0 max-w-3xl">
      {/* Sharer Info */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:opacity-80 mb-2"
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
          Shared a post at {new Date(repost.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Sharer's Caption */}
      {repost.caption && (
        <div
          className="p-4 rounded-xl mb-2"
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
          <div className={`grid gap-1 ${repost.originalPostMedias.length === 1 ? 'grid-cols-1' : repost.originalPostMedias.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`} style={{ maxHeight: '400px', overflow: 'hidden' }}>
            {repost.originalPostMedias.map((media) => (
              <div key={media.id} className="relative" style={{ height: '300px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url}
                  alt="Post media"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
