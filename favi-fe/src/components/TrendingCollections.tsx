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
  const [error, setError] = useState<string | null>(null);
  const [reactorsDialogOpen, setReactorsDialogOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
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

  const handleCountClick = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setReactorsDialogOpen(true);
  };

  if (loading && !hasFetchedRef.current) {
    return (
      <aside className="hidden xl:block xl:h-screen xl:sticky xl:top-0 xl:self-start">
        <div className="relative rounded-2xl p-4 xl:h-full xl:overflow-y-auto glass">
          {/* Soft highlight layer to make the glass feel deeper */}
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
      </aside>
    );
  }

  if (error || collections.length === 0) {
    return null;
  }

  return (
    <>
      <aside className="hidden xl:block xl:h-screen xl:sticky xl:top-0 xl:self-start">
        <div className="relative rounded-2xl p-4 xl:h-full xl:overflow-y-auto glass">
          {/* Soft highlight layer to make the glass feel deeper */}
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
        </div>
      </aside>

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
