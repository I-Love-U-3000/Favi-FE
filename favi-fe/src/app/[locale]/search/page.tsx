"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { useTranslations } from "next-intl";

import type { SearchPostDto, SearchResult, PostResponse } from "@/types";
import { searchAPI } from "@/lib/api/searchAPI";
import postAPI from "@/lib/api/postAPI";
import { useAuth } from "@/components/AuthProvider";
import PostSkeleton from "@/components/PostSkeleton";
import {
  getSearchPageCache,
  updateSearchPageCache,
  saveSearchScroll,
  type SearchMode,
} from "@/lib/cache/searchCache";

/* ==================== Types & Utils ==================== */
type Mode = "keyword" | "semantic" | "tag";

function ResultCard({ post }: { post: PostResponse }) {
  const medias = post.medias || [];

  return (
    <Link
      href={`/posts/${post.id}`}
      onClick={() => {
        if (typeof window !== "undefined") {
          saveSearchScroll(window.scrollY);
        }
      }}
      className="group relative overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-sm hover:shadow-md transition-shadow block"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="relative h-56 w-full bg-gray-100 dark:bg-neutral-800">
        {medias.length > 0 && medias[0]?.url ? (
          <img
            src={medias[0].url}
            alt={post.caption || "Search result"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-neutral-600">
            <i className="pi pi-image text-4xl mb-2" />
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 text-xs bg-gradient-to-t from-black/60 to-transparent text-white">
        <p className="line-clamp-2 text-sm">{post.caption || "No caption"}</p>
      </div>
    </Link>
  );
}

function ResultGrid({
  items,
  loading,
  loadingMore,
  hasSearched,
}: {
  items: PostResponse[];
  loading?: boolean;
  loadingMore?: boolean;
  hasSearched?: boolean;
}) {
  if (loading) {
    return <PostSkeleton variant="grid" count={8} />;
  }

  if (!hasSearched) {
    return (
      <div className="grid place-items-center h-60 text-sm opacity-70">
        <div className="text-center">
          <i className="pi pi-search text-4xl mb-3 opacity-50" />
          <p>Enter a search term and press Search or Enter</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="grid place-items-center h-60 text-sm opacity-70">
        <div className="text-center">
          <i className="pi pi-inbox text-4xl mb-3 opacity-50" />
          <p>No results found. Try a different search term.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((post) => (
        <ResultCard key={post.id} post={post} />
      ))}
      {loadingMore && <PostSkeleton variant="grid" count={4} wrap={false} />}
    </div>
  );
}

/* ==================== Page ==================== */
export default function SearchPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const t = useTranslations("SearchPage");

  // Read existing cached search state
  const cachedSearch = getSearchPageCache();

  // URL state with cache fallback
  const urlMode = sp.get("mode") as Mode | null;
  const urlQuery = sp.get("q");

  const initialMode: Mode =
    urlMode || (cachedSearch.isInitialized ? cachedSearch.mode : "keyword");
  const initialQuery: string =
    urlQuery !== null
      ? urlQuery
      : cachedSearch.isInitialized
      ? cachedSearch.query
      : "";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [query, setQuery] = useState<string>(initialQuery);

  // Keyword search state
  const [keywordResults, setKeywordResults] = useState<PostResponse[]>(
    cachedSearch.isInitialized ? cachedSearch.keyword.results : []
  );
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [keywordPage, setKeywordPage] = useState(
    cachedSearch.isInitialized ? cachedSearch.keyword.page : 1
  );
  const [hasMoreKeyword, setHasMoreKeyword] = useState(
    cachedSearch.isInitialized ? cachedSearch.keyword.hasMore : true
  );
  const [keywordSearched, setKeywordSearched] = useState(
    cachedSearch.isInitialized ? cachedSearch.keyword.searched : false
  );

  // Semantic search state
  const [semanticResults, setSemanticResults] = useState<PostResponse[]>(
    cachedSearch.isInitialized ? cachedSearch.semantic.results : []
  );
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);
  const [semanticPage, setSemanticPage] = useState(
    cachedSearch.isInitialized ? cachedSearch.semantic.page : 1
  );
  const [hasMoreSemantic, setHasMoreSemantic] = useState(
    cachedSearch.isInitialized ? cachedSearch.semantic.hasMore : true
  );
  const [semanticSearched, setSemanticSearched] = useState(
    cachedSearch.isInitialized ? cachedSearch.semantic.searched : false
  );

  // Tag search state
  const [tagResults, setTagResults] = useState<PostResponse[]>(
    cachedSearch.isInitialized ? cachedSearch.tag.results : []
  );
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagPage, setTagPage] = useState(
    cachedSearch.isInitialized ? cachedSearch.tag.page : 1
  );
  const [hasMoreTag, setHasMoreTag] = useState(
    cachedSearch.isInitialized ? cachedSearch.tag.hasMore : true
  );
  const [tagSearched, setTagSearched] = useState(
    cachedSearch.isInitialized ? cachedSearch.tag.searched : false
  );

  // Track whether we are in the middle of restoring scroll or unmounting
  const isRestoringScrollRef = useRef(cachedSearch.isInitialized && cachedSearch.scrollY > 0);
  const isNavigatingAwayRef = useRef(false);

  // Temporary minHeight to prevent browser from clamping window.scrollTo
  const [restorationMinHeight, setRestorationMinHeight] = useState<number | undefined>(
    cachedSearch.isInitialized && cachedSearch.scrollY > 0
      ? cachedSearch.scrollY + 800
      : undefined
  );

  // Set manual scroll restoration so browser doesn't randomly jump to 0 on back/forward
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Restore scroll position after mount if returning to cached page
  useEffect(() => {
    if (!cachedSearch.isInitialized || cachedSearch.scrollY <= 0) {
      isRestoringScrollRef.current = false;
      return;
    }

    const targetY = cachedSearch.scrollY;
    isRestoringScrollRef.current = true;

    window.scrollTo({ top: targetY, behavior: "instant" });

    const cancelRestoration = () => {
      isRestoringScrollRef.current = false;
      setRestorationMinHeight(undefined);
    };

    window.addEventListener("wheel", cancelRestoration, { passive: true, once: true });
    window.addEventListener("touchstart", cancelRestoration, { passive: true, once: true });
    window.addEventListener("keydown", cancelRestoration, { passive: true, once: true });

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (!isRestoringScrollRef.current) {
        clearInterval(interval);
        return;
      }

      window.scrollTo({ top: targetY, behavior: "instant" });

      if (Math.abs(window.scrollY - targetY) < 15 || attempts >= 20) {
        clearInterval(interval);
        setTimeout(() => {
          isRestoringScrollRef.current = false;
          setRestorationMinHeight(undefined);
        }, 150);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      window.removeEventListener("wheel", cancelRestoration);
      window.removeEventListener("touchstart", cancelRestoration);
      window.removeEventListener("keydown", cancelRestoration);
    };
  }, [cachedSearch.isInitialized, cachedSearch.scrollY]);

  // Continuously record scroll position
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (isRestoringScrollRef.current || isNavigatingAwayRef.current) {
        return;
      }
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!isRestoringScrollRef.current && !isNavigatingAwayRef.current) {
            saveSearchScroll(window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    const handleNavClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("a") || target?.closest("[data-navigate]") || target?.closest("button")) {
        isNavigatingAwayRef.current = true;
        if (window.scrollY > 0) {
          saveSearchScroll(window.scrollY);
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", handleNavClick, { capture: true });
    return () => {
      isNavigatingAwayRef.current = true;
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", handleNavClick, { capture: true });
    };
  }, []);

  // Sync URL when inputs change (without triggering search)
  useEffect(() => {
    const currentMode = sp.get("mode") || "keyword";
    const currentQ = sp.get("q") || "";
    if (currentMode === mode && currentQ === query) {
      return;
    }
    const params = new URLSearchParams(sp.toString());
    params.set("mode", mode);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    const nextStr = params.toString();
    if (nextStr !== sp.toString()) {
      router.replace(`${pathname}?${nextStr}`, { scroll: false });
    }
  }, [mode, query, pathname, router, sp]);

  // Keyword search function
  const performKeywordSearch = useCallback(async (targetQuery?: string) => {
    const q = (targetQuery ?? query).trim();
    if (!q) {
      return;
    }

    setKeywordLoading(true);
    setKeywordError(null);
    setKeywordPage(1);
    setKeywordResults([]);
    setHasMoreKeyword(true);
    setKeywordSearched(true);

    try {
      const result: SearchResult = await searchAPI.search({
        query: q,
        page: 1,
        pageSize: 20,
      });

      // Fetch full post data for search results in a single batch
      const searchPosts = result.posts || [];
      const postIds = searchPosts.map((sp) => sp.id);
      const fullPosts = postIds.length > 0 ? await postAPI.getBatch(postIds) : [];
      const hasMore = (result.posts?.length || 0) === 20;

      setKeywordResults(fullPosts);
      setHasMoreKeyword(hasMore);

      updateSearchPageCache({
        query: q,
        mode: "keyword",
        keyword: {
          results: fullPosts,
          page: 1,
          hasMore,
          searched: true,
        },
      });
    } catch (error: any) {
      console.error("Keyword search error:", error);
      setKeywordError(error?.error || error?.message || "Failed to search");
    } finally {
      setKeywordLoading(false);
    }
  }, [query]);

  // Semantic search function
  const performSemanticSearch = useCallback(async (targetQuery?: string) => {
    const q = (targetQuery ?? query).trim();
    if (!q) {
      return;
    }

    if (!isAuthenticated) {
      setSemanticError("Please sign in to use AI search");
      return;
    }

    setSemanticLoading(true);
    setSemanticError(null);
    setSemanticPage(1);
    setSemanticResults([]);
    setHasMoreSemantic(true);
    setSemanticSearched(true);

    try {
      const result: SearchResult = await searchAPI.semanticSearch({
        query: q,
        page: 1,
        pageSize: 20,
        k: 100,
      });

      // Fetch full post data in a single batch request
      const searchPosts = result.posts || [];
      const postIds = searchPosts.map((sp) => sp.id);
      const fullPosts = postIds.length > 0 ? await postAPI.getBatch(postIds) : [];
      const hasMore = (result.posts?.length || 0) === 20;

      setSemanticResults(fullPosts);
      setHasMoreSemantic(hasMore);

      updateSearchPageCache({
        query: q,
        mode: "semantic",
        semantic: {
          results: fullPosts,
          page: 1,
          hasMore,
          searched: true,
        },
      });
    } catch (error: any) {
      console.error("Semantic search error:", error);
      setSemanticError(error?.error || error?.message || "Failed to perform semantic search");
    } finally {
      setSemanticLoading(false);
    }
  }, [query, isAuthenticated]);

  // Tag search function
  const performTagSearch = useCallback(async (targetQuery?: string) => {
    const q = (targetQuery ?? query).trim();
    if (!q) {
      return;
    }

    setTagLoading(true);
    setTagError(null);
    setTagPage(1);
    setTagResults([]);
    setHasMoreTag(true);
    setTagSearched(true);

    try {
      const searchQuery = q.startsWith("#") ? q.substring(1) : q;
      const result: SearchResult = await searchAPI.search({
        query: searchQuery,
        mode: "tag",
        page: 1,
        pageSize: 20,
      });

      const searchPosts = result.posts || [];
      let fullPosts: PostResponse[] = [];
      if (searchPosts.length > 0) {
        const postIds = searchPosts.map((sp) => sp.id);
        fullPosts = await postAPI.getBatch(postIds);
        setTagResults(fullPosts);
      } else {
        setTagResults([]);
      }

      const hasMore = (result.posts?.length || 0) === 20;
      setHasMoreTag(hasMore);

      updateSearchPageCache({
        query: q,
        mode: "tag",
        tag: {
          results: fullPosts,
          page: 1,
          hasMore,
          searched: true,
        },
      });
    } catch (error: any) {
      console.error("Tag search error:", error);
      setTagError(error?.error || error?.message || "Failed to search by tags");
    } finally {
      setTagLoading(false);
    }
  }, [query]);

  // Auto-search when query param is present on mount or URL change
  const cachedActive =
    cachedSearch.isInitialized && cachedSearch.query.trim()
      ? cachedSearch[cachedSearch.mode]
      : null;
  const initialKey =
    cachedActive && cachedActive.searched && cachedActive.results.length > 0
      ? `${cachedSearch.mode}:${cachedSearch.query.trim()}`
      : null;
  const lastExecutedKeyRef = useRef<string | null>(initialKey);

  useEffect(() => {
    const qFromUrl = sp.get("q");
    const modeFromUrl = (sp.get("mode") as Mode) || "keyword";
    if (qFromUrl && qFromUrl.trim()) {
      const key = `${modeFromUrl}:${qFromUrl.trim()}`;
      // Skip if this query and mode was already executed and cached in memory
      if (lastExecutedKeyRef.current !== key) {
        lastExecutedKeyRef.current = key;
        setQuery(qFromUrl);
        setMode(modeFromUrl);
        if (modeFromUrl === "keyword") {
          performKeywordSearch(qFromUrl);
        } else if (modeFromUrl === "semantic") {
          performSemanticSearch(qFromUrl);
        } else {
          performTagSearch(qFromUrl);
        }
      }
    }
  }, [sp, performKeywordSearch, performSemanticSearch, performTagSearch]);

  // Load more keyword results
  const loadMoreKeyword = useCallback(async () => {
    if (keywordLoading || !hasMoreKeyword) {
      return;
    }

    setKeywordLoading(true);

    try {
      const nextPage = keywordPage + 1;
      const result: SearchResult = await searchAPI.search({
        query: query.trim(),
        page: nextPage,
        pageSize: 20,
      });

      const searchPosts = result.posts || [];
      const postIds = searchPosts.map((sp) => sp.id);
      const fullPosts = postIds.length > 0 ? await postAPI.getBatch(postIds) : [];
      const updatedResults = [...keywordResults, ...fullPosts];
      const hasMore = (result.posts?.length || 0) === 20;

      setKeywordResults(updatedResults);
      setKeywordPage(nextPage);
      setHasMoreKeyword(hasMore);

      updateSearchPageCache({
        keyword: {
          results: updatedResults,
          page: nextPage,
          hasMore,
          searched: true,
        },
      });
    } catch (error: any) {
      console.error("Load more keyword search error:", error);
      setKeywordError(error?.error || error?.message || "Failed to load more results");
    } finally {
      setKeywordLoading(false);
    }
  }, [keywordLoading, hasMoreKeyword, keywordPage, query, keywordResults]);

  // Load more semantic results
  const loadMoreSemantic = useCallback(async () => {
    if (semanticLoading || !hasMoreSemantic) {
      return;
    }

    setSemanticLoading(true);

    try {
      const nextPage = semanticPage + 1;
      const result: SearchResult = await searchAPI.semanticSearch({
        query: query.trim(),
        page: nextPage,
        pageSize: 20,
        k: 100,
      });

      const searchPosts = result.posts || [];
      const postIds = searchPosts.map((sp) => sp.id);
      const fullPosts = postIds.length > 0 ? await postAPI.getBatch(postIds) : [];
      const updatedResults = [...semanticResults, ...fullPosts];
      const hasMore = (result.posts?.length || 0) === 20;

      setSemanticResults(updatedResults);
      setSemanticPage(nextPage);
      setHasMoreSemantic(hasMore);

      updateSearchPageCache({
        semantic: {
          results: updatedResults,
          page: nextPage,
          hasMore,
          searched: true,
        },
      });
    } catch (error: any) {
      console.error("Load more semantic search error:", error);
      setSemanticError(error?.error || error?.message || "Failed to load more results");
    } finally {
      setSemanticLoading(false);
    }
  }, [semanticLoading, hasMoreSemantic, semanticPage, query, semanticResults]);

  // Load more tag results
  const loadMoreTag = useCallback(async () => {
    if (tagLoading || !hasMoreTag) {
      return;
    }

    setTagLoading(true);

    try {
      const nextPage = tagPage + 1;
      const searchQuery = query.trim().startsWith("#") ? query.trim().substring(1) : query.trim();
      const result: SearchResult = await searchAPI.search({
        query: searchQuery,
        mode: "tag",
        page: nextPage,
        pageSize: 20,
      });

      const searchPosts = result.posts || [];
      const postIds = searchPosts.map((sp) => sp.id);
      const fullPosts = postIds.length > 0 ? await postAPI.getBatch(postIds) : [];
      const updatedResults = [...tagResults, ...fullPosts];
      const hasMore = (result.posts?.length || 0) === 20;

      setTagResults(updatedResults);
      setTagPage(nextPage);
      setHasMoreTag(hasMore);

      updateSearchPageCache({
        tag: {
          results: updatedResults,
          page: nextPage,
          hasMore,
          searched: true,
        },
      });
    } catch (error: any) {
      console.error("Load more tag search error:", error);
      setTagError(error?.error || error?.message || "Failed to load more results");
    } finally {
      setTagLoading(false);
    }
  }, [tagLoading, hasMoreTag, tagPage, query, tagResults]);

  // Handle search submit
  const handleSearch = () => {
    updateSearchPageCache({ query, mode });
    if (mode === "keyword") {
      performKeywordSearch();
    } else if (mode === "semantic") {
      performSemanticSearch();
    } else {
      performTagSearch();
    }
  };

  // Get current results and state
  const currentResults = mode === "keyword" ? keywordResults : mode === "tag" ? tagResults : semanticResults;
  const currentLoading = mode === "keyword" ? keywordLoading : mode === "tag" ? tagLoading : semanticLoading;
  const currentError = mode === "keyword" ? keywordError : mode === "tag" ? tagError : semanticError;
  const currentHasMore = mode === "keyword" ? hasMoreKeyword : mode === "tag" ? hasMoreTag : hasMoreSemantic;
  const currentSearched = mode === "keyword" ? keywordSearched : mode === "tag" ? tagSearched : semanticSearched;
  const loadMore = mode === "keyword" ? loadMoreKeyword : mode === "tag" ? loadMoreTag : loadMoreSemantic;
  const currentPage = mode === "keyword" ? keywordPage : mode === "tag" ? tagPage : semanticPage;

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        minHeight: restorationMinHeight ? `${restorationMinHeight}px` : undefined,
      }}
    >
      {/* Hero / Sticky filter bar */}
      <div
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{ backgroundColor: "var(--surface-ground,transparent)/70", borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xl font-semibold flex items-center gap-2">
              <i className="pi pi-search" /> Search
            </div>
          </div>

          {/* Tabs header */}
          <div className="mt-3">
            <TabView
              activeIndex={["keyword", "tag", "semantic"].indexOf(mode)}
              onTabChange={(e) => {
                const newMode = ["keyword", "tag", "semantic"][e.index] as Mode;
                setMode(newMode);
                updateSearchPageCache({ mode: newMode });
              }}
              pt={{
                navContainer: { className: "bg-[var(--surface-ground,transparent)]/80 backdrop-blur-md rounded-t-2xl" },
                panelContainer: { className: "rounded-b-2xl" },
                inkbar: { className: "bg-red-500 h-[3px]" },
              }}
            >
              <TabPanel
                header={<span className="inline-flex items-center gap-2"><i className="pi pi-align-left" />Keyword</span>}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="p-input-icon-left flex-1">
                    <InputText
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        updateSearchPageCache({ query: e.target.value });
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder="Enter keywords..."
                      className="w-full"
                    />
                  </span>
                  <Button label="Search" onClick={handleSearch} />
                </div>
              </TabPanel>

              <TabPanel
                header={<span className="inline-flex items-center gap-2"><i className="pi pi-hashtag" />Tags</span>}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="p-input-icon-left flex-1">
                    <InputText
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        updateSearchPageCache({ query: e.target.value });
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder="Enter tag names..."
                      className="w-full"
                    />
                  </span>
                  <Button label="Search" onClick={handleSearch} icon="pi pi-search" />
                </div>
                <p className="mt-2 text-xs opacity-60">
                  Search posts by their tags. Enter tag names separated by spaces or commas.
                </p>
              </TabPanel>

              <TabPanel
                header={<span className="inline-flex items-center gap-2"><i className="pi pi-sparkles" />AI Search</span>}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="p-input-icon-left flex-1">
                    <InputText
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        updateSearchPageCache({ query: e.target.value });
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder="Describe what you're looking for..."
                      className="w-full"
                    />
                  </span>
                  <Button label="Search" onClick={handleSearch} icon="pi pi-magic" />
                </div>
                <p className="mt-2 text-xs opacity-60">
                  AI-powered semantic search using embeddings. Describe what you're looking for in natural language.
                </p>
                {!isAuthenticated && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    <i className="pi pi-lock mr-1" />
                    Please sign in to use AI search
                  </p>
                )}
              </TabPanel>
            </TabView>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-6 mt-8">
        {/* Error state */}
        {currentError && (
          <div
            className="bg-red-50 dark:bg-red-900/20 border rounded-xl p-4 mb-4"
            style={{ borderColor: "var(--red-200, rgb(254 202 202))" }}
          >
            <p className="text-sm text-red-600 dark:text-red-400">{currentError}</p>
          </div>
        )}

        {/* Results grid */}
        <ResultGrid
          items={currentResults}
          loading={currentLoading && currentPage === 1}
          loadingMore={currentLoading && currentPage > 1}
          hasSearched={currentSearched}
        />

        {/* Load more button */}
        {!currentLoading && currentHasMore && currentResults.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              label="Load More"
              icon="pi pi-chevron-down"
              onClick={loadMore}
              className="p-button-outlined"
            />
          </div>
        )}

        {/* No more results message */}
        {!currentLoading && !currentHasMore && currentResults.length > 0 && (
          <div className="text-center mt-8 text-sm opacity-50">No more results</div>
        )}
      </div>
    </div>
  );
}
