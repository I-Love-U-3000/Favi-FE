"use client";

import type {
  PostResponse,
  StoryFeedResponse,
  ProfileResponse,
  CollectionResponse,
} from "@/types";

export interface StoryItem {
  profileId: string;
  username: string;
  avatarUrl: string | null;
  stories: StoryFeedResponse["stories"];
  hasViewed: boolean;
}

export interface HomeFeedCache {
  posts: PostResponse[];
  page: number;
  hasNext: boolean;
  view: "list" | "grid";
  nsfwConfirmedGridPosts: Set<string>;
  scrollY: number;
  isInitialized: boolean;
}

export interface HomeStoriesCache {
  stories: StoryItem[];
  storyFeeds: StoryFeedResponse[];
  page: number;
  hasNext: boolean;
  isInitialized: boolean;
}

export interface HomeFriendsCache {
  friends: ProfileResponse[];
  page: number;
  hasNext: boolean;
  isInitialized: boolean;
}

export interface HomeCollectionsCache {
  collections: CollectionResponse[];
  page: number;
  hasNext: boolean;
  isInitialized: boolean;
}

interface HomeState {
  cachedUserId: string | null | undefined;
  feed: HomeFeedCache;
  stories: HomeStoriesCache;
  friends: HomeFriendsCache;
  collections: HomeCollectionsCache;
}

const initialFeedState: HomeFeedCache = {
  posts: [],
  page: 1,
  hasNext: false,
  view: "list",
  nsfwConfirmedGridPosts: new Set(),
  scrollY: 0,
  isInitialized: false,
};

const initialStoriesState: HomeStoriesCache = {
  stories: [],
  storyFeeds: [],
  page: 1,
  hasNext: false,
  isInitialized: false,
};

const initialFriendsState: HomeFriendsCache = {
  friends: [],
  page: 1,
  hasNext: false,
  isInitialized: false,
};

const initialCollectionsState: HomeCollectionsCache = {
  collections: [],
  page: 1,
  hasNext: false,
  isInitialized: false,
};

// Singleton in-memory store for Home page
const homeState: HomeState = {
  cachedUserId: undefined,
  feed: { ...initialFeedState },
  stories: { ...initialStoriesState },
  friends: { ...initialFriendsState },
  collections: { ...initialCollectionsState },
};

function ensureUserConsistency(userId: string | null | undefined) {
  // If user changed (e.g. login / logout / switch account), clear cache
  if (homeState.cachedUserId !== undefined && homeState.cachedUserId !== userId) {
    clearHomeCache();
  }
  homeState.cachedUserId = userId;
}

// ---------------- FEED CACHE ----------------
export function getHomeFeedCache(userId?: string | null): HomeFeedCache {
  ensureUserConsistency(userId);
  return homeState.feed;
}

export function updateHomeFeedCache(
  data: Partial<Omit<HomeFeedCache, "nsfwConfirmedGridPosts">> & {
    nsfwConfirmedGridPosts?: Set<string>;
    userId?: string | null;
  }
) {
  ensureUserConsistency(data.userId);
  if (data.posts !== undefined) homeState.feed.posts = data.posts;
  if (data.page !== undefined) homeState.feed.page = data.page;
  if (data.hasNext !== undefined) homeState.feed.hasNext = data.hasNext;
  if (data.view !== undefined) homeState.feed.view = data.view;
  if (data.nsfwConfirmedGridPosts !== undefined) {
    homeState.feed.nsfwConfirmedGridPosts = data.nsfwConfirmedGridPosts;
  }
  if (data.scrollY !== undefined) homeState.feed.scrollY = data.scrollY;
  if (data.isInitialized !== undefined) {
    homeState.feed.isInitialized = data.isInitialized;
  }
}

export function saveHomeScroll(scrollY: number) {
  homeState.feed.scrollY = scrollY;
}

export function removeHomePost(postId: string) {
  homeState.feed.posts = homeState.feed.posts.filter((p) => p.id !== postId);
}

// ---------------- STORIES CACHE ----------------
export function getHomeStoriesCache(userId?: string | null): HomeStoriesCache {
  ensureUserConsistency(userId);
  return homeState.stories;
}

export function updateHomeStoriesCache(
  data: Partial<HomeStoriesCache> & { userId?: string | null }
) {
  ensureUserConsistency(data.userId);
  if (data.stories !== undefined) homeState.stories.stories = data.stories;
  if (data.storyFeeds !== undefined) homeState.stories.storyFeeds = data.storyFeeds;
  if (data.page !== undefined) homeState.stories.page = data.page;
  if (data.hasNext !== undefined) homeState.stories.hasNext = data.hasNext;
  if (data.isInitialized !== undefined) {
    homeState.stories.isInitialized = data.isInitialized;
  }
}

// ---------------- FRIENDS CACHE ----------------
export function getHomeFriendsCache(userId?: string | null): HomeFriendsCache {
  ensureUserConsistency(userId);
  return homeState.friends;
}

export function updateHomeFriendsCache(
  data: Partial<HomeFriendsCache> & { userId?: string | null }
) {
  ensureUserConsistency(data.userId);
  if (data.friends !== undefined) homeState.friends.friends = data.friends;
  if (data.page !== undefined) homeState.friends.page = data.page;
  if (data.hasNext !== undefined) homeState.friends.hasNext = data.hasNext;
  if (data.isInitialized !== undefined) {
    homeState.friends.isInitialized = data.isInitialized;
  }
}

// ---------------- COLLECTIONS CACHE ----------------
export function getHomeCollectionsCache(userId?: string | null): HomeCollectionsCache {
  ensureUserConsistency(userId);
  return homeState.collections;
}

export function updateHomeCollectionsCache(
  data: Partial<HomeCollectionsCache> & { userId?: string | null }
) {
  ensureUserConsistency(data.userId);
  if (data.collections !== undefined) {
    homeState.collections.collections = data.collections;
  }
  if (data.page !== undefined) homeState.collections.page = data.page;
  if (data.hasNext !== undefined) homeState.collections.hasNext = data.hasNext;
  if (data.isInitialized !== undefined) {
    homeState.collections.isInitialized = data.isInitialized;
  }
}

// ---------------- CLEAR ----------------
export function clearHomeCache() {
  homeState.feed = {
    ...initialFeedState,
    nsfwConfirmedGridPosts: new Set(),
  };
  homeState.stories = { ...initialStoriesState };
  homeState.friends = { ...initialFriendsState };
  homeState.collections = { ...initialCollectionsState };
}
