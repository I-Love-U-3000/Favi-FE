"use client";

import React from "react";

export interface PostSkeletonProps {
  /**
   * The variant of post skeleton to render:
   * - "feed" or "list": Single column feed post card with header, media, caption, actions (for Home list view, Reposts)
   * - "grid": Grid item for photo grids (for Home grid view, Profile photo grid, Search results, Related posts, Collections)
   * - "card": 3-column card style with top media and bottom content (for Archive, Recycle bin)
   * - "detail": Full post detail page skeleton with media on left/top and metadata/comments on right
   */
  variant?: "feed" | "list" | "grid" | "card" | "detail";
  /**
   * Number of skeleton items to render (default: 1)
   */
  count?: number;
  /**
   * If true (default), wraps items in the standard container (e.g. grid layout or list layout).
   * If false, renders only the skeleton items so they can be injected directly into an existing CSS grid or list.
   */
  wrap?: boolean;
  /**
   * Additional container CSS classes
   */
  className?: string;
}

export function FeedPostSkeletonItem() {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-all"
      style={{ backgroundColor: "var(--bg-secondary, #ffffff)" }}
    >
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-3 w-20 rounded-md bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
      </div>

      {/* Caption lines */}
      <div className="mt-4 space-y-2">
        <div className="h-3.5 w-5/6 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-3.5 w-1/2 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
      </div>

      {/* Media area */}
      <div className="mt-4 w-full h-80 sm:h-96 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
      </div>

      {/* Tags placeholder */}
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        <div className="h-6 w-14 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
      </div>

      {/* Action Bar */}
      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-6 w-10 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-6 w-8 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-6 w-8 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function GridPostSkeletonItem() {
  return (
    <div className="group relative h-44 w-full overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-slate-200 dark:bg-slate-800 animate-pulse">
      {/* Bottom gradient overlay with mock stats */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded-full bg-white/30" />
          <div className="h-3 w-8 rounded-full bg-white/30" />
        </div>
        <div className="h-4 w-4 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

export function CardPostSkeletonItem() {
  return (
    <div
      className="relative rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-sm"
      style={{ backgroundColor: "var(--bg-secondary, #ffffff)" }}
    >
      {/* Top media */}
      <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 animate-pulse relative">
        <div className="absolute top-2 right-2 flex gap-1.5">
          <div className="h-6 w-6 rounded-md bg-white/20" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-4 w-20 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="h-3.5 w-3/4 rounded bg-slate-200/80 dark:bg-slate-800/80 animate-pulse" />
        <div className="pt-1 flex items-center gap-4">
          <div className="h-3.5 w-10 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-3.5 w-10 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function DetailPostSkeletonItem() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: media skeleton (7-8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="w-full aspect-[4/3] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse ring-1 ring-black/5 dark:ring-white/10" />
          <div className="rounded-2xl p-5 ring-1 ring-black/5 dark:ring-white/10 space-y-4" style={{ backgroundColor: "var(--bg-secondary, #ffffff)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right: comments panel skeleton (4 cols) */}
        <div className="lg:col-span-4">
          <div
            className="rounded-2xl p-5 ring-1 ring-black/5 dark:ring-white/10 space-y-4 h-[600px] flex flex-col"
            style={{ backgroundColor: "var(--bg-secondary, #ffffff)" }}
          >
            <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-10 w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            <div className="flex-1 space-y-4 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-3 w-full rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostSkeleton({
  variant = "feed",
  count = 1,
  wrap = true,
  className = "",
}: PostSkeletonProps) {
  const items = Array.from({ length: Math.max(1, count) });

  if (variant === "detail") {
    return <DetailPostSkeletonItem />;
  }

  if (variant === "grid") {
    if (!wrap) {
      return (
        <>
          {items.map((_, i) => (
            <GridPostSkeletonItem key={i} />
          ))}
        </>
      );
    }
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
        {items.map((_, i) => (
          <GridPostSkeletonItem key={i} />
        ))}
      </div>
    );
  }

  if (variant === "card") {
    if (!wrap) {
      return (
        <>
          {items.map((_, i) => (
            <CardPostSkeletonItem key={i} />
          ))}
        </>
      );
    }
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {items.map((_, i) => (
          <CardPostSkeletonItem key={i} />
        ))}
      </div>
    );
  }

  // variant === "feed" or "list"
  if (!wrap) {
    return (
      <>
        {items.map((_, i) => (
          <FeedPostSkeletonItem key={i} />
        ))}
      </>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((_, i) => (
        <FeedPostSkeletonItem key={i} />
      ))}
    </div>
  );
}
