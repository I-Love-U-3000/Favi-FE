"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

import collectionAPI from "@/lib/api/collectionAPI";
import type { CollectionResponse } from "@/types";
import CollectionReactionButton from "./CollectionReactionButton";
import CollectionReactorsDialog from "./CollectionReactorsDialog";

const FALLBACK_COVER = "https://via.placeholder.com/400x200/6366f1/ffffff?text=Collection";

export default function TrendingCollections() {
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactorsDialogOpen, setReactorsDialogOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchTrending = async () => {
    let cancelled = false;

    try {
      setLoading(true);
      const response = await collectionAPI.getTrending(1, 3);
      if (!cancelled) {
        setCollections(response.items || response.data || []);
        setPage(response.page || 1);
        setHasNext(response.hasNext ?? false);
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

  const handleLoadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await collectionAPI.getTrending(nextPage, 3);
      const newItems = response.items || response.data || [];
      setCollections((prev) => [...prev, ...newItems]);
      setPage(response.page || nextPage);
      setHasNext(response.hasNext ?? false);
    } catch (e: any) {
      console.error("Error loading more trending collections:", e);
    } finally {
      setLoadingMore(false);
    }
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

  const handleCountClick = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setReactorsDialogOpen(true);
  };

  if (loading && !hasFetchedRef.current) {
    return (
      <div className="relative rounded-2xl p-4 glass">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
          }}
        />
        <div className="relative text-sm font-semibold pb-3 mb-3 border-b border-white/10 dark:border-white/5" style={{ color: "var(--text)" }}>
          Trending Collections
        </div>
        <div className="relative space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 rounded-lg mb-2 bg-white/10 dark:bg-white/5" />
              <div className="h-4 rounded w-3/4 bg-white/10 dark:bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || collections.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative rounded-2xl p-4 glass">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
          }}
        />
        <div className="relative flex items-center justify-between py-3 border-b border-white/10 dark:border-white/5">
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Trending Collections
          </div>
          <i className="pi pi-fire" style={{ color: "#f97316" }} />
        </div>

        <div className="relative space-y-3">
          {collections.map((collection) => (
            <div key={collection.id} className="group">
              <Link href={`/collections/${collection.id}`} className="block">
                <div className="rounded-lg overflow-hidden ring-1 ring-black/5 hover:ring-black/10 transition-all">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collection.coverImageUrl?.trim() || FALLBACK_COVER}
                    alt={collection.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                    {collection.title}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {collection.postCount} {collection.postCount === 1 ? "post" : "posts"}
                  </div>
                </div>
              </Link>
              <div className="mt-2 flex justify-end">
                <CollectionReactionButton
                  collectionId={collection.id}
                  reactions={collection.reactions}
                  onReactionChange={(newReactions) => handleReactionChange(collection.id, newReactions)}
                  onCountClick={() => handleCountClick(collection.id)}
                  size="small"
                  showCount={true}
                />
              </div>
            </div>
          ))}
        </div>

        {hasNext && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-2 px-4 rounded-xl font-medium text-xs transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary, #3b82f6)",
                color: "white",
              }}
            >
              {loadingMore ? (
                <>
                  <i className="pi pi-spin pi-spinner text-xs" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load more</span>
              )}
            </button>
          </div>
        )}
      </div>

      {selectedCollectionId && (
        <CollectionReactorsDialog
          visible={reactorsDialogOpen}
          onHide={() => setReactorsDialogOpen(false)}
          collectionId={selectedCollectionId}
        />
      )}
    </>
  );
}
