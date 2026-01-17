"use client";

import { useRouter } from "@/i18n/routing";
import type { PostPreviewDto } from "@/types";

interface PostPreviewMessageProps {
  postPreview: PostPreviewDto;
  isSent: boolean;
}

export default function PostPreviewMessage({ postPreview, isSent }: PostPreviewMessageProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/posts/${postPreview.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 hover:opacity-80 active:scale-[0.98]"
      style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        {postPreview.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={postPreview.thumbnailUrl}
            alt="Post"
            className="w-16 h-16 object-cover rounded-lg"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <span className="text-2xl opacity-50">📷</span>
          </div>
        )}
        {/* Media count indicator */}
        {postPreview.mediasCount > 1 && (
          <div className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {postPreview.mediasCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
          Post Preview
        </div>
        {postPreview.caption ? (
          <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "var(--text)" }}>
            {postPreview.caption}
          </p>
        ) : (
          <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
            No caption
          </p>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="flex items-center justify-center px-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--text-secondary)" }}
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
