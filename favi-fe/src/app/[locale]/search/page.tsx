"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { useTranslations } from "next-intl";

import type { SearchPostDto, SearchResult, PostResponse } from "@/types";
import { searchAPI } from "@/lib/api/searchAPI";
import postAPI from "@/lib/api/postAPI";
import { useAuth } from "@/components/AuthProvider";

/* ==================== Types & Utils ==================== */
type Mode = "keyword" | "semantic" | "tag";

function ResultCard({ post, t }: { post: PostResponse; t: (key: string) => string }) {
  const medias = post.medias || [];

  return (
    <a
      href={`/posts/${post.id}`}
      className="group relative overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-sm hover:shadow-md transition-shadow block"
      style={{ borderColor: 'var(--border)' }}
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
            <span className="text-xs">{t("NoImage")}</span>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 text-xs bg-gradient-to-t from-black/60 to-transparent text-white">
        <p className="line-clamp-2 text-sm">{post.caption || t("NoCaption")}</p>
      </div>
    </a>
  );
}

function ResultGrid({ items, loading, hasSearched, t }: { items: PostResponse[]; loading?: boolean; hasSearched?: boolean; t: (key: string) => string }) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <ProgressSpinner />
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="grid place-items-center h-60 text-sm opacity-70">
        <div className="text-center">
          <i className="pi pi-search text-4xl mb-3 opacity-50" />
          <p>{t("EnterSearchTerm")}</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="grid place-items-center h-60 text-sm opacity-70">
        <div className="text-center">
          <i className="pi pi-inbox text-4xl mb-3 opacity-50" />
          <p>{t("NoResults")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((post) => (
        <ResultCard key={post.id} post={post} t={t} />
      ))}
    </div>
  );
}

function TagCloud({ tags, onSelectTag }: { tags: string[]; onSelectTag: (tag: string) => void }) {
  if (!tags.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelectTag(tag)}
          className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition border border-neutral-200 dark:border-neutral-700"
        >
          #{tag}
        </button>
      ))}
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

  // URL state
  const [mode, setMode] = useState<Mode>((sp.get("mode") as Mode) || "keyword");
  const [query, setQuery] = useState(sp.get("q") ?? "");

  // Keyword search state
  const [keywordResults, setKeywordResults] = useState<PostResponse[]>([]);
  const [keywordTags, setKeywordTags] = useState<string[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [keywordPage, setKeywordPage] = useState(1);
  const [hasMoreKeyword, setHasMoreKeyword] = useState(true);
  const [keywordSearched, setKeywordSearched] = useState(false);

  // Semantic search state
  const [semanticResults, setSemanticResults] = useState<PostResponse[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);
  const [semanticPage, setSemanticPage] = useState(1);
  const [hasMoreSemantic, setHasMoreSemantic] = useState(true);
  const [semanticSearched, setSemanticSearched] = useState(false);

  // Tag search state
  const [tagResults, setTagResults] = useState<PostResponse[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagPage, setTagPage] = useState(1);
  const [hasMoreTag, setHasMoreTag] = useState(true);
  const [tagSearched, setTagSearched] = useState(false);

  // Sync URL when inputs change (without triggering search)
  useEffect(() => {
    const params = new URLSearchParams(sp.toString());
    params.set("mode", mode);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [mode, query, pathname, router, sp]);

  // Keyword search function
  const performKeywordSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }

    setKeywordLoading(true);
    setKeywordError(null);
    setKeywordPage(1);
    setKeywordResults([]);
    setKeywordTags([]);
    setHasMoreKeyword(true);
    setKeywordSearched(true);

    try {
      const result: SearchResult = await searchAPI.search({
        query: query.trim(),
        page: 1,
        pageSize: 20,
      });

      // Fetch full post data for each search result
      const searchPosts = result.posts || [];
      const fullPosts = await Promise.all(
        searchPosts.map((sp) => postAPI.getById(sp.id))
      );

      setKeywordResults(fullPosts);
      setKeywordTags(result.tags?.map((t) => t.name) || []);
      setHasMoreKeyword((result.posts?.length || 0) === 20);
    } catch (error: any) {
      console.error("Keyword search error:", error);
      setKeywordError(error?.error || error?.message || "Failed to search");
    } finally {
      setKeywordLoading(false);
    }
  }, [query]);

  // Semantic search function
  const performSemanticSearch = useCallback(async () => {
    if (!query.trim()) {
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
        query: query.trim(),
        page: 1,
        pageSize: 20,
        k: 100,
      });

      // Fetch full post data for each search result
      const searchPosts = result.posts || [];
      const fullPosts = await Promise.all(
        searchPosts.map((sp) => postAPI.getById(sp.id))
      );

      setSemanticResults(fullPosts);
      setHasMoreSemantic((result.posts?.length || 0) === 20);
    } catch (error: any) {
      console.error("Semantic search error:", error);
      setSemanticError(error?.error || error?.message || "Failed to perform semantic search");
    } finally {
      setSemanticLoading(false);
    }
  }, [query, isAuthenticated]);

  // Tag search function
  const performTagSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }

    setTagLoading(true);
    setTagError(null);
    setTagPage(1);
    setTagResults([]);
    setHasMoreTag(true);
    setTagSearched(true);

    try {
      // Remove # prefix if present for search
      const searchQuery = query.trim().startsWith('#') ? query.trim().substring(1) : query.trim();
      console.log("Searching for tag:", searchQuery);
      const result: SearchResult = await searchAPI.search({
        query: searchQuery,
        mode: "tag",
        page: 1,
        pageSize: 20,
      });

      console.log("Search API result:", result);

      // Fetch full post data for each search result
      const searchPosts = result.posts || [];
      console.log("Found search posts:", searchPosts.length);

      if (searchPosts.length > 0) {
        const fullPosts = await Promise.all(
          searchPosts.map((sp) => postAPI.getById(sp.id))
        );
        console.log("Full posts fetched:", fullPosts.length);
        setTagResults(fullPosts);
      } else {
        console.log("No posts found for tag:", query.trim());
        setTagResults([]);
      }

      setHasMoreTag((result.posts?.length || 0) === 20);
    } catch (error: any) {
      console.error("Tag search error:", error);
      console.error("Error details:", error?.response?.data || error.message);
      setTagError(error?.error || error?.message || "Failed to search by tags");
    } finally {
      setTagLoading(false);
    }
  }, [query]);

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

      // Fetch full post data for each search result
      const searchPosts = result.posts || [];
      const fullPosts = await Promise.all(
        searchPosts.map((sp) => postAPI.getById(sp.id))
      );

      setKeywordResults((prev) => [...prev, ...fullPosts]);
      setKeywordPage(nextPage);
      setHasMoreKeyword((result.posts?.length || 0) === 20);
    } catch (error: any) {
      console.error("Load more keyword search error:", error);
      setKeywordError(error?.error || error?.message || "Failed to load more results");
    } finally {
      setKeywordLoading(false);
    }
  }, [keywordLoading, hasMoreKeyword, keywordPage, query]);

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

      // Fetch full post data for each search result
      const searchPosts = result.posts || [];
      const fullPosts = await Promise.all(
        searchPosts.map((sp) => postAPI.getById(sp.id))
      );

      setSemanticResults((prev) => [...prev, ...fullPosts]);
      setSemanticPage(nextPage);
      setHasMoreSemantic((result.posts?.length || 0) === 20);
    } catch (error: any) {
      console.error("Load more semantic search error:", error);
      setSemanticError(error?.error || error?.message || "Failed to load more results");
    } finally {
      setSemanticLoading(false);
    }
  }, [semanticLoading, hasMoreSemantic, semanticPage, query]);

  // Load more tag results
  const loadMoreTag = useCallback(async () => {
    if (tagLoading || !hasMoreTag) {
      return;
    }

    setTagLoading(true);

    try {
      const nextPage = tagPage + 1;
      // Remove # prefix if present for search
      const searchQuery = query.trim().startsWith('#') ? query.trim().substring(1) : query.trim();
      const result: SearchResult = await searchAPI.search({
        query: searchQuery,
        mode: "tag",
        page: nextPage,
        pageSize: 20,
      });

      // Fetch full post data for each search result
      const searchPosts = result.posts || [];
      const fullPosts = await Promise.all(
        searchPosts.map((sp) => postAPI.getById(sp.id))
      );

      setTagResults((prev) => [...prev, ...fullPosts]);
      setTagPage(nextPage);
      setHasMoreTag((result.posts?.length || 0) === 20);
    } catch (error: any) {
      console.error("Load more tag search error:", error);
      setTagError(error?.error || error?.message || "Failed to load more results");
    } finally {
      setTagLoading(false);
    }
  }, [tagLoading, hasMoreTag, tagPage, query]);

  // Handle tag selection
  const handleSelectTag = (tag: string) => {
    setQuery(tag);
  };

  // Handle search submit
  const handleSearch = () => {
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Hero / Sticky filter bar */}
      <div
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{ backgroundColor: 'var(--surface-ground,transparent)/70', borderColor: 'var(--border)' }}
      >
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xl font-semibold flex items-center gap-2">
              <i className="pi pi-search" /> {t("Title")}
            </div>
          </div>

          {/* Tabs header */}
          <div className="mt-3">
            <TabView
              activeIndex={["keyword", "tag", "semantic"].indexOf(mode)}
              onTabChange={(e) => setMode(["keyword", "tag", "semantic"][e.index] as Mode)}
              pt={{
                navContainer: { className: "bg-[var(--surface-ground,transparent)]/80 backdrop-blur-md rounded-t-2xl" },
                panelContainer: { className: "rounded-b-2xl" },
                inkbar: { className: "bg-red-500 h-[3px]" },
              }}
            >
              <TabPanel
                header={<span className="inline-flex items-center gap-2"><i className="pi pi-align-left" />{t("Keyword")}</span>}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="p-input-icon-left flex-1">
                    <InputText
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder={t("EnterKeywords")}
                      className="w-full"
                    />
                  </span>
                  <Button label={t("Search")} onClick={handleSearch} />
                </div>
                {/* Related tags */}
                {mode === "keyword" && keywordTags.length > 0 && !keywordLoading && (
                  <TagCloud tags={keywordTags} onSelectTag={handleSelectTag} />
                )}
              </TabPanel>

              <TabPanel
                header={<span className="inline-flex items-center gap-2"><i className="pi pi-hashtag" />{t("Tags")}</span>}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="p-input-icon-left flex-1">
                    <InputText
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder={t("EnterTagNames")}
                      className="w-full"
                    />
                  </span>
                  <Button label={t("Search")} onClick={handleSearch} icon="pi pi-search" />
                </div>
                <p className="mt-2 text-xs opacity-60">
                  {t("TagSearchHint")}
                </p>
              </TabPanel>

              <TabPanel
                header={<span className="inline-flex items-center gap-2"><i className="pi pi-sparkles" />{t("AISearch")}</span>}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="p-input-icon-left flex-1">
                    <InputText
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder={t("DescribeSearch")}
                      className="w-full"
                    />
                  </span>
                  <Button label={t("Search")} onClick={handleSearch} icon="pi pi-magic" />
                </div>
                <p className="mt-2 text-xs opacity-60">
                  {t("AISearchHint")}
                </p>
                {!isAuthenticated && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    <i className="pi pi-lock mr-1" />
                    {t("SignInForAI")}
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
            style={{ borderColor: 'var(--red-200, rgb(254 202 202))' }}
          >
            <p className="text-sm text-red-600 dark:text-red-400">{currentError}</p>
          </div>
        )}

        {/* Results grid */}
        <ResultGrid items={currentResults} loading={currentLoading && currentPage === 1} hasSearched={currentSearched} t={t} />

        {/* Load more button */}
        {!currentLoading && currentHasMore && currentResults.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              label={t("LoadMore")}
              icon="pi pi-chevron-down"
              onClick={loadMore}
              className="p-button-outlined"
            />
          </div>
        )}

        {/* Loading spinner for load more */}
        {currentLoading && currentPage > 1 && (
          <div className="flex justify-center mt-8">
            <ProgressSpinner style={{ width: "32px", height: "32px" }} />
          </div>
        )}

        {/* No more results message */}
        {!currentHasMore && currentResults.length > 0 && (
          <div className="text-center mt-8 text-sm opacity-50">{t("NoMoreResults")}</div>
        )}
      </div>
    </div>
  );
}
