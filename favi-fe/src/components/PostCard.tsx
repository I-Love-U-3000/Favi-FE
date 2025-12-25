"use client";

import { useRouter } from "@/i18n/routing";
import type { PostResponse } from "@/types";

type PrivacyKind = "Public" | "Followers" | "Private";

const PRIVACY_ICON_MAP: Record<PrivacyKind, string> = {
  Public: "pi pi-globe",
  Followers: "pi pi-users",
  Private: "pi pi-lock",
};

function normalizePrivacy(raw: unknown): PrivacyKind {
  if (raw === 0 || raw === "0" || raw === "Public") return "Public";
  if (raw === 1 || raw === "1" || raw === "Followers") return "Followers";
  if (raw === 2 || raw === "2" || raw === "Private") return "Private";
  return "Public";
}

export default function PostCard({ post }: { post: PostResponse }) {
  const router = useRouter();
  const medias = post.medias || [];
  const privacy: PrivacyKind = normalizePrivacy(
    (post as any).privacyLevel ?? (post as any).privacy
  );

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
      onClick={() => router.push(`/posts/${post.id}`)}
    >
      {/* Media preview */}
      {medias.length > 0 ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={medias[0].thumbnailUrl || medias[0].url}
            alt={post.caption ?? ""}
            className="w-full h-48 object-cover"
          />
          {medias.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              <i className="pi pi-clone mr-1" />
              {medias.length}
            </div>
          )}
        </div>
      ) : (
        // Fallback when no media
        <div className="w-full h-48 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
          <i className="pi pi-image text-4xl text-gray-400 dark:text-neutral-600" />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Privacy and location */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs"
            style={{
              borderColor: "var(--border)",
            }}
          >
            <i className={`${PRIVACY_ICON_MAP[privacy]} text-xs`} />
          </span>
          {post.location?.name && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs truncate"
              style={{
                borderColor: "var(--border)",
              }}
            >
              <i className="pi pi-map-marker text-xs" />
              <span className="truncate max-w-[150px]">{post.location.name}</span>
            </span>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--text)' }}>
            {post.caption}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--text)",
                }}
              >
                #{tag.name}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs opacity-70">+{post.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs opacity-70">
          <span className="flex items-center gap-1">
            <i className="pi pi-heart" />
            {post.reactions?.total ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <i className="pi pi-comment" />
            {post.commentsCount ?? 0}
          </span>
          <span className="text-xs opacity-50">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
