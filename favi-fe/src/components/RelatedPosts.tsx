"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import postAPI from "@/lib/api/postAPI";
import type { PostResponse } from "@/types";

interface RelatedPostsProps {
  postId: string;
  className?: string;
}

export default function RelatedPosts({ postId, className = "" }: RelatedPostsProps) {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [nsfwConfirmed, setNsfwConfirmed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadRelated = async () => {
      try {
        const result = await postAPI.getRelated(postId, 1, 12);
        // Filter to only posts with media
        setPosts((result.items || []).filter((p: PostResponse) => (p.medias || []).length > 0));
      } catch (e) {
        console.error("Failed to load related posts:", e);
      } finally {
        setLoading(false);
      }
    };
    loadRelated();
  }, [postId]);

  if (loading) return <div className="text-sm opacity-70">Loading related posts…</div>;
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
      </div>
    </div>
  );
}