"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import postAPI from "@/lib/api/postAPI";
import type { PostResponse } from "@/types";
import PostSkeleton from "@/components/PostSkeleton";

interface RelatedPostsProps {
  postId: string;
  className?: string;
}

export default function RelatedPosts({ postId, className = "" }: RelatedPostsProps) {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nsfwConfirmed, setNsfwConfirmed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadRelated = async () => {
      try {
        const result = await postAPI.getRelated(postId, 1, 10);
        const items = result.data || result.items || [];
        setPosts(items.filter((p: PostResponse) => (p.medias || []).length > 0));
        setPage(1);
        setHasNext(result.hasNext ?? false);
      } catch (e) {
        console.error("Failed to load related posts:", e);
      } finally {
        setLoading(false);
      }
    };
    loadRelated();
  }, [postId]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await postAPI.getRelated(postId, nextPage, 10);
      const items = result.data || result.items || [];
      const filtered = items.filter((p: PostResponse) => (p.medias || []).length > 0);
      setPosts((prev) => [...prev, ...filtered]);
      setPage(result.page || nextPage);
      setHasNext(result.hasNext ?? false);
    } catch (e) {
      console.error("Failed to load more related posts:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
          Related Posts
        </div>
        <PostSkeleton variant="grid" count={4} />
      </div>
    );
  }
  if (posts.length === 0) return null;

  return (
    <div className={className}>
      <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
        Related Posts
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {posts.map((p) => (
          <Link key={p.id} href={`/posts/${p.id}`} className="group relative overflow-hidden rounded-xl ring-1 ring-black/5">
            <img
              src={p.medias![0].thumbnailUrl || p.medias![0].url}
              alt={p.caption ?? ""}
              className={`h-44 w-full object-cover transition-transform group-hover:scale-105 ${
                p.isNSFW && !nsfwConfirmed.has(p.id) ? "blur-2xl scale-110" : ""
              }`}
            />
            {p.isNSFW && !nsfwConfirmed.has(p.id) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setNsfwConfirmed((prev) => new Set(prev).add(p.id));
                  }}
                  className="px-3 py-1.5 bg-black/70 hover:bg-black/80 text-white text-xs rounded-lg backdrop-blur-sm transition-colors"
                >
                  <i className="pi pi-eye mr-1" />
                  Show NSFW
                </button>
              </div>
            )}
          </Link>
        ))}
        {loadingMore && <PostSkeleton variant="grid" count={4} wrap={false} />}
      </div>

      {!loadingMore && hasNext && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-5 py-2 rounded-full font-medium text-xs transition-all shadow-sm hover:shadow flex items-center gap-2"
            style={{
              backgroundColor: "var(--primary, #3b82f6)",
              color: "white",
            }}
          >
            <span>Load more</span>
          </button>
        </div>
      )}
    </div>
  );
}