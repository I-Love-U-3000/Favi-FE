"use client";

import type { PostResponse } from "@/types";

export type SearchMode = "keyword" | "semantic" | "tag";

export interface ModeResults {
  results: PostResponse[];
  page: number;
  hasMore: boolean;
  searched: boolean;
}

export interface SearchPageCache {
  query: string;
  mode: SearchMode;
  keyword: ModeResults;
  semantic: ModeResults;
  tag: ModeResults;
  scrollY: number;
  isInitialized: boolean;
}

const initialModeState: ModeResults = {
  results: [],
  page: 1,
  hasMore: true,
  searched: false,
};

const initialSearchState: SearchPageCache = {
  query: "",
  mode: "keyword",
  keyword: { ...initialModeState },
  semantic: { ...initialModeState },
  tag: { ...initialModeState },
  scrollY: 0,
  isInitialized: false,
};

const SESSION_KEY = "favi_search_cache";

function loadFromSession(): SearchPageCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        ...initialSearchState,
        ...parsed,
        isInitialized: true,
      };
    }
  } catch {}
  return null;
}

function persistToSession(state: SearchPageCache) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        query: state.query,
        mode: state.mode,
        keyword: state.keyword,
        semantic: state.semantic,
        tag: state.tag,
        scrollY: state.scrollY,
        isInitialized: state.isInitialized,
      })
    );
  } catch {}
}

let inMemorySearchState: SearchPageCache = { ...initialSearchState };

export function getSearchPageCache(): SearchPageCache {
  if (!inMemorySearchState.isInitialized) {
    const fromSession = loadFromSession();
    if (fromSession) {
      inMemorySearchState = fromSession;
    }
  }
  return inMemorySearchState;
}

export function updateSearchPageCache(updates: Partial<SearchPageCache>) {
  inMemorySearchState = {
    ...inMemorySearchState,
    ...updates,
    isInitialized: true,
  };
  persistToSession(inMemorySearchState);
}

export function saveSearchScroll(scrollY: number) {
  if (scrollY > 0) {
    inMemorySearchState.scrollY = scrollY;
    persistToSession(inMemorySearchState);
  }
}

export function clearSearchCache() {
  inMemorySearchState = {
    ...initialSearchState,
    keyword: { ...initialModeState },
    semantic: { ...initialModeState },
    tag: { ...initialModeState },
  };
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }
}
