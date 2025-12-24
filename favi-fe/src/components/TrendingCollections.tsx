"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

import collectionAPI from "@/lib/api/collectionAPI";
import type { CollectionResponse } from "@/types";
import CollectionReactionButton from "./CollectionReactionButton";

const FALLBACK_COVER = "https://via.placeholder.com/400x200/6366f1/ffffff?text=Collection";

export default function TrendingCollections() {
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchTrending = async () => {
    let cancelled = false;

    try {
      setLoading(true);
      const response = await collectionAPI.getTrending(1, 5);
      if (!cancelled) {
        setCollections(response.items || []);
        hasFetchedRef.current = true;
      }
    } catch (e: any) {
      if (!cancelled) {
        console.error("Error fetching trending collections:", e);
        setError(e?.error || e?.message || "Failed to load trending collections");
      }
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchTrending();
    }
  }, []);

  // Refetch when component becomes visible (when user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasFetchedRef.current) {
        fetchTrending();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleReactionChange = (collectionId: string, newReactions: any) => {
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, reactions: newReactions }
          : c
      )
    );
  };

  if (loading && !hasFetchedRef.current) {
    return (
      <aside className="hidden xl:block">
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
            Trending Collections
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 rounded-lg mb-2" style={{ backgroundColor: "var(--border)" }} />
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: "var(--border)" }} />
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (error || collections.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block">
      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Trending Collections
          </div>
          <i className="pi pi-fire" style={{ color: "#f97316" }} />
        </div>

        <div className="space-y-3">
          {collections.map((collection) => (
            <div key={collection.id} className="group">
              <Link href={`/collections/${collection.id}`} className="block">
                <div className="rounded-lg overflow-hidden ring-1 ring-black/5 hover:ring-black/10 transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collection.coverImageUrl?.trim() || FALLBACK_COVER}
                    alt={collection.title}
                    className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                    {collection.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {collection.postCount} {collection.postCount === 1 ? "post" : "posts"}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <CollectionReactionButton
                        collectionId={collection.id}
                        reactions={collection.reactions}
                        onReactionChange={(newReactions) => handleReactionChange(collection.id, newReactions)}
                        size="small"
                        showCount={true}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
