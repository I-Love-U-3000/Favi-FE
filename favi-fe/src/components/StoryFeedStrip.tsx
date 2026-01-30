"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import storyAPI from "@/lib/api/storyAPI";
import type { StoryFeedResponse } from "@/types";
import { useTranslations } from "next-intl";
import StoryViewerDialog from "@/components/StoryViewerDialog";
import StoryCreateDialog from "@/components/StoryCreateDialog";

interface StoryItem {
  profileId: string;
  username: string;
  avatarUrl: string | null;
  stories: StoryFeedResponse["stories"];
  hasViewed: boolean;
}

export default function StoryFeedStrip() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("Stories");
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [storyFeeds, setStoryFeeds] = useState<StoryFeedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();
  const [selectedStoryFeed, setSelectedStoryFeed] = useState<StoryFeedResponse | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const loadStories = async () => {
      setLoading(true);
      setError(null);
      try {
        const feed = await storyAPI.getFeed();

        if (!cancelled) {
          const storyItems: StoryItem[] = feed.map((item) => ({
            profileId: item.profileId,
            username: item.profileUsername,
            avatarUrl: item.profileAvatarUrl,
            stories: item.stories,
            hasViewed: item.stories.every((s) => s.hasViewed),
          }));
          setStories(storyItems);
          setStoryFeeds(feed);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.error || e?.message || t("LoadFailed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStories();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, t]);

  // Show nothing for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full border-b overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-4 py-4 px-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (stories.length === 0) {
    return (
      <>
        <div className="w-full border-b overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col items-center justify-center py-4 px-2 text-center text-sm gap-2" style={{ color: "var(--text-secondary)" }}>
            <div className="flex items-center">
              <i className="pi pi-image text-2xl mr-2 opacity-50" />
              <span className="opacity-70">No stories to show</span>
            </div>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <i className="pi pi-plus" />
              Add your story
            </button>
          </div>
        </div>
        <StoryCreateDialog
          visible={createDialogOpen}
          onHide={() => setCreateDialogOpen(false)}
          onStoryCreated={() => {
            setCreateDialogOpen(false);
            // Trigger a refresh by setting loading and clearing stories
            setLoading(true);
            setStories([]);
            storyAPI.getFeed().then((feed) => {
              const storyItems: StoryItem[] = feed.map((item) => ({
                profileId: item.profileId,
                username: item.profileUsername,
                avatarUrl: item.profileAvatarUrl,
                stories: item.stories,
                hasViewed: item.stories.every((s) => s.hasViewed),
              }));
              setStories(storyItems);
              setStoryFeeds(feed);
            }).catch(console.error).finally(() => setLoading(false));
          }}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="w-full border-b overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-4 py-4 px-2 overflow-x-auto no-scrollbar">
          {stories.map((story) => (
            <StoryItem
              key={story.profileId}
              story={story}
              onClick={() => {
                // Find the story feed for this profile
                const feed = storyFeeds.find(f => f.profileId === story.profileId);
                console.log("Story clicked:", {
                  profileId: story.profileId,
                  username: story.username,
                  storiesCount: story.stories.length,
                  foundFeed: !!feed,
                  feedStoriesCount: feed?.stories.length || 0
                });
                if (feed && feed.stories.length > 0) {
                  setSelectedProfileId(story.profileId);
                  setSelectedStoryFeed(feed);
                  setViewerOpen(true);
                } else {
                  console.error("No feed found for profile:", story.profileId);
                }
              }}
            />
          ))}
        </div>
      </div>

      <StoryViewerDialog
        visible={viewerOpen}
        onHide={() => {
          setViewerOpen(false);
          // Don't reset the selected values immediately to prevent re-renders
          // They will be reset when the dialog opens again
        }}
        initialProfileId={selectedProfileId}
        initialStoryFeed={selectedStoryFeed}
        onStoriesViewed={() => {
          // Refresh stories to update hasViewed state
          storyAPI.getFeed().then((feed) => {
            const storyItems: StoryItem[] = feed.map((item) => ({
              profileId: item.profileId,
              username: item.profileUsername,
              avatarUrl: item.profileAvatarUrl,
              stories: item.stories,
              hasViewed: item.stories.every((s) => s.hasViewed),
            }));
            setStories(storyItems);
            setStoryFeeds(feed);
          }).catch(console.error);
        }}
      />
    </>
  );
}

function StoryItem({
  story,
  onClick,
}: {
  story: StoryItem;
  onClick: () => void;
}) {
  const avatar = story.avatarUrl || "/avatar-default.svg";
  const displayName = story.username;

  return (
    <button
      className="shrink-0 flex flex-col items-center gap-1.5 group"
      onClick={onClick}
      title={`${displayName} (${story.stories.length} ${story.stories.length === 1 ? "story" : "stories"})`}
    >
      <div
        className={`relative p-[2px] rounded-full ${story.hasViewed
          ? "bg-gray-300 dark:bg-neutral-600"
          : "bg-gradient-to-tr from-sky-400 via-violet-400 to-amber-400"
          }`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-full p-[2px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt={displayName}
            className="w-14 h-14 object-cover rounded-full group-hover:opacity-90 transition-opacity"
          />
        </div>
        {!story.hasViewed && (
          <div className="absolute -top-0.5 -right-0.5">
            <span className="flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500" />
            </span>
          </div>
        )}
      </div>
      <span className="text-xs text-center max-w-[70px] truncate" style={{ color: "var(--text)" }}>
        {displayName}
      </span>
    </button>
  );
}
