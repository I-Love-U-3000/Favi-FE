"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import storyAPI from "@/lib/api/storyAPI";
import type { StoryResponse, StoryFeedResponse } from "@/types";
import { useTranslations } from "next-intl";
import StoryViewersDialog from "./StoryViewersDialog";
import { useAuth } from "@/components/AuthProvider";

interface StoryViewerDialogProps {
  visible: boolean;
  onHide: () => void;
  initialStoryFeed?: StoryFeedResponse;
  initialProfileId?: string;
  archivedStories?: StoryResponse[];
  onViewerReady?: () => void;
  onNSFWConfirm?: (storyId: string) => void;
  isNSFWConfirmed?: (storyId: string) => boolean;
}

export default function StoryViewerDialog({
  visible,
  onHide,
  initialStoryFeed,
  initialProfileId,
  archivedStories = [],
  onViewerReady,
  onNSFWConfirm,
  isNSFWConfirmed = () => false,
}: StoryViewerDialogProps) {
  const t = useTranslations("Stories");
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [storyFeeds, setStoryFeeds] = useState<StoryFeedResponse[]>([]);
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewersDialogVisible, setViewersDialogVisible] = useState(false);
  const [nsfwConfirmedStories, setNsfwConfirmedStories] = useState<Set<string>>(new Set());

  const isStoryNSFWConfirmed = (storyId: string) => {
    return isNSFWConfirmed(storyId) || nsfwConfirmedStories.has(storyId);
  };

  const confirmStoryNSFW = (storyId: string) => {
    setNsfwConfirmedStories(prev => new Set(prev).add(storyId));
    onNSFWConfirm?.(storyId);
  };
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isViewingArchived, setIsViewingArchived] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const storyStateRef = useRef({
    currentFeedIndex: 0,
    currentStoryIndex: 0,
    storyFeeds: [] as StoryFeedResponse[],
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Lock body scroll and prevent key events when dialog is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onHide();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [visible, onHide]);

  // Load stories when dialog opens
  useEffect(() => {
    if (!visible) {
      setIsViewingArchived(false);
      setAutoPlayEnabled(true);
      // Cleanup timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Don't reset state here, let it be reset by the loadStories function

    const loadStories = async () => {
      if (!isMountedRef.current) return;

      console.log("Loading stories...", { archivedStories: !!archivedStories, initialProfileId, initialStoryFeed });

      // Reset state
      setStoryFeeds([]);
      setCurrentFeedIndex(0);
      setCurrentStoryIndex(0);
      setProgress(0);
      setViewersDialogVisible(false);

      // Update ref immediately
      storyStateRef.current = {
        currentFeedIndex: 0,
        currentStoryIndex: 0,
        storyFeeds: [],
      };

      setLoading(true);
      try {
        if (archivedStories && archivedStories.length > 0) {
          // Load archived stories
          setIsViewingArchived(true);

          // Convert archived stories to feed format
          const profileIds = Array.from(new Set(archivedStories.map(s => s.profileId)));
          const feeds: StoryFeedResponse[] = profileIds.map(profileId => {
            const profileStories = archivedStories.filter(s => s.profileId === profileId);
            const profile = profileStories[0]; // Get profile info from first story
            return {
              profileId,
              profileUsername: profile.profileUsername,
              profileAvatarUrl: profile.profileAvatarUrl,
              stories: profileStories
            };
          });

          if (isMountedRef.current) {
            setStoryFeeds(feeds);
            storyStateRef.current.storyFeeds = feeds;
            console.log("Archived stories loaded:", feeds.length, "feeds");
            onViewerReady?.();
          }
        } else {
          // Load active stories
          let feed: StoryFeedResponse[];

          if (initialStoryFeed) {
            // If initial feed is provided, get the full feed
            feed = await storyAPI.getFeed();
            const idx = feed.findIndex((f) => f.profileId === initialStoryFeed.profileId);
            setCurrentFeedIndex(idx >= 0 ? idx : 0);
            setCurrentStoryIndex(0);
          } else if (initialProfileId) {
            feed = await storyAPI.getFeed();
            const idx = feed.findIndex((f) => f.profileId === initialProfileId);
            setCurrentFeedIndex(idx >= 0 ? idx : 0);
            setCurrentStoryIndex(0);
          } else {
            feed = await storyAPI.getFeed();
            setCurrentFeedIndex(0);
            setCurrentStoryIndex(0);
          }

          if (isMountedRef.current) {
            setStoryFeeds(feed);
            storyStateRef.current.storyFeeds = feed;
            console.log("Active stories loaded:", feed.length, "feeds");
            setIsViewingArchived(false);
            onViewerReady?.();
          }
        }
      } catch (e) {
        if (isMountedRef.current) {
          console.error("Failed to load stories:", e);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          console.log("Loading completed");
        }
      }
    };

    loadStories();
  }, [visible, initialStoryFeed, initialProfileId, archivedStories]);

  // Auto-progress through stories
  useEffect(() => {
    if (!visible || !autoPlayEnabled) return;

    const { currentFeedIndex, currentStoryIndex, storyFeeds } = storyStateRef.current;
    const currentFeed = storyFeeds[currentFeedIndex];
    if (!currentFeed || currentFeed.stories.length === 0 || loading || viewersDialogVisible) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, autoPlayEnabled, loading, viewersDialogVisible]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, []);

  // Record view when story is shown
  useEffect(() => {
    if (!visible || loading || isViewingArchived) return;

    const { currentFeedIndex, currentStoryIndex, storyFeeds } = storyStateRef.current;
    if (storyFeeds.length === 0) return;

    const currentFeed = storyFeeds[currentFeedIndex];
    if (!currentFeed || currentFeed.stories.length === 0) return;

    const story = currentFeed.stories[currentStoryIndex];
    if (story && !story.hasViewed) {
      storyAPI.recordView(story.id).catch(console.error);
    }
  }, [visible, loading, isViewingArchived]);

  const nextStory = () => {
    const { currentFeedIndex, currentStoryIndex, storyFeeds } = storyStateRef.current;
    const currentFeed = storyFeeds[currentFeedIndex];
    if (!currentFeed) return;

    if (currentStoryIndex < currentFeed.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentFeedIndex < storyFeeds.length - 1) {
      setCurrentFeedIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      // End of stories
      onHide();
    }
  };

  const prevStory = () => {
    const { currentFeedIndex, currentStoryIndex, storyFeeds } = storyStateRef.current;
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentFeedIndex > 0) {
      setCurrentFeedIndex((prev) => prev - 1);
      const prevFeed = storyFeeds[currentFeedIndex - 1];
      if (prevFeed) {
        setCurrentStoryIndex(prevFeed.stories.length - 1);
      }
    }
  };

  const handleArchive = async () => {
    if (!currentStory) return;
    try {
      setArchiving(true);
      await storyAPI.archive(currentStory.id);
      // Remove the archived story from the current feed
      setStoryFeeds(prev => prev.map((feed, idx) => {
        if (idx === currentFeedIndex) {
          return {
            ...feed,
            stories: feed.stories.filter(s => s.id !== currentStory.id)
          };
        }
        return feed;
      }));
      // Move to next story or close if no more stories
      if (currentFeed.stories.length > 1) {
        nextStory();
      } else {
        onHide();
      }
    } catch (e: any) {
      console.error("Failed to archive story:", e);
      alert(e?.error || e?.message || "Failed to archive story");
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentStory) return;
    if (!confirm("Are you sure you want to delete this story? This action cannot be undone.")) return;

    try {
      setDeleting(true);
      await storyAPI.delete(currentStory.id);
      // Remove the deleted story from the current feed
      setStoryFeeds(prev => prev.map((feed, idx) => {
        if (idx === currentFeedIndex) {
          return {
            ...feed,
            stories: feed.stories.filter(s => s.id !== currentStory.id)
          };
        }
        return feed;
      }));
      // Move to next story or close if no more stories
      if (currentFeed.stories.length > 1) {
        nextStory();
      } else {
        onHide();
      }
    } catch (e: any) {
      console.error("Failed to delete story:", e);
      alert(e?.error || e?.message || "Failed to delete story");
    } finally {
      setDeleting(false);
    }
  };

  const currentFeed = storyFeeds[currentFeedIndex];
  const currentStory = currentFeed?.stories[currentStoryIndex];

  console.log("StoryViewerDialog render:", {
    visible,
    loading,
    storyFeedsLength: storyFeeds.length,
    currentFeedIndex,
    currentStoryIndex,
    currentStory: currentStory?.id,
    isViewingArchived,
    autoPlayEnabled,
  });

  if (!visible) return null;

  if (loading || storyFeeds.length === 0 || !currentStory) {
    console.log("Still loading or no stories", { loading, storyFeedsLength: storyFeeds.length, currentStory: !!currentStory });
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        onClick={onHide}
      >
        <div className="text-white text-lg">{t("Loading")}</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black touch-none"
      onClick={onHide}
    >
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {currentFeed.stories.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    idx < currentStoryIndex
                      ? "100%"
                      : idx === currentStoryIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-6 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentFeed.profileAvatarUrl || "/avatar-default.svg"}
              alt={currentFeed.profileUsername}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div className="text-white text-left">
              <div className="text-sm font-semibold flex items-center gap-2">
                {currentFeed.profileUsername}
                {isViewingArchived && (
                  <span className="text-xs bg-gray-700/80 px-2 py-0.5 rounded-full">Archived</span>
                )}
              </div>
              <div className="text-xs opacity-80">
                {new Date(currentStory.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action buttons for story owner */}
            {user?.id === currentStory.profileId && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {!isViewingArchived ? (
                  <>
                    <button
                      onClick={handleArchive}
                      disabled={archiving}
                      className="px-3 py-1.5 bg-blue-500/80 hover:bg-blue-500 text-white text-xs rounded-full flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Archive story"
                    >
                      {archiving ? (
                        <>
                          <i className="pi pi-spin pi-spinner" />
                        </>
                      ) : (
                        <>
                          <i className="pi pi-box" />
                          Archive
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        // Placeholder for unarchive - backend needed
                        alert("Unarchive feature coming soon!");
                      }}
                      className="px-3 py-1.5 bg-green-500/80 hover:bg-green-500 text-white text-xs rounded-full flex items-center gap-1 transition-colors"
                      title="Unarchive story"
                    >
                      <>
                        <i className="pi pi-undo" />
                        Unarchive
                      </>
                    </button>
                  </>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded-full flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Delete story"
                >
                  {deleting ? (
                    <>
                      <i className="pi pi-spin pi-spinner" />
                    </>
                  ) : (
                    <>
                      <i className="pi pi-trash" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Auto-play toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAutoPlayEnabled(!autoPlayEnabled);
              }}
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full text-xs"
              title={autoPlayEnabled ? "Pause auto-play" : "Play auto-play"}
            >
              {autoPlayEnabled ? (
                <i className="pi pi-pause" />
              ) : (
                <i className="pi pi-play" />
              )}
            </button>

            <button
              onClick={onHide}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
              aria-label="Close"
            >
              <i className="pi pi-times text-lg" />
            </button>
          </div>
        </div>

        {/* Story media - Full screen */}
        <div className="relative w-full h-full max-h-screen flex items-center justify-center">
          <div className="relative w-full h-full max-w-md mx-auto">
            {currentStory.mediaUrl.endsWith(".mp4") ||
            currentStory.mediaUrl.endsWith(".mov") ||
            currentStory.mediaUrl.endsWith(".webm") ? (
              <video
                src={currentStory.mediaUrl}
                className={`w-full h-full object-cover ${currentStory.isNSFW && !isNSFWConfirmed(currentStory.id) ? 'blur-3xl' : ''}`}
                style={{ maxHeight: "100vh" }}
                autoPlay
                playsInline
                muted
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentStory.thumbnailUrl || currentStory.mediaUrl}
                alt="Story"
                className={`w-full h-full object-cover ${currentStory.isNSFW && !isNSFWConfirmed(currentStory.id) ? 'blur-3xl' : ''}`}
                style={{ maxHeight: "100vh" }}
              />
            )}

            {/* NSFW overlay */}
            {currentStory.isNSFW && !isStoryNSFWConfirmed(currentStory.id) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmStoryNSFW(currentStory.id);
                  }}
                  className="px-6 py-3 bg-black/70 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2"
                >
                  <i className="pi pi-eye" />
                  Show NSFW content
                </button>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevStory();
                }}
                disabled={currentFeedIndex === 0 && currentStoryIndex === 0}
                className={`p-2 rounded-full ${currentFeedIndex === 0 && currentStoryIndex === 0 ? 'text-white/30' : 'text-white hover:bg-white/10'}`}
              >
                <i className="pi pi-chevron-left text-xl" />
              </button>
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextStory();
                }}
                disabled={currentFeedIndex === storyFeeds.length - 1 && currentStoryIndex === currentFeed.stories.length - 1}
                className={`p-2 rounded-full ${currentFeedIndex === storyFeeds.length - 1 && currentStoryIndex === currentFeed.stories.length - 1 ? 'text-white/30' : 'text-white hover:bg-white/10'}`}
              >
                <i className="pi pi-chevron-right text-xl" />
              </button>
            </div>

            {/* View count - only show to story owner */}
            {currentStory.viewCount > 0 && user?.id === currentStory.profileId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewersDialogVisible(true);
                }}
                className="absolute bottom-6 left-4 z-10 text-white text-sm opacity-80 hover:opacity-100 transition-opacity flex items-center"
              >
                <i className="pi pi-eye mr-1" />
                {currentStory.viewCount}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Viewers dialog */}
      <StoryViewersDialog
        visible={viewersDialogVisible}
        onHide={() => setViewersDialogVisible(false)}
        storyId={currentStory.id}
      />
    </div>
  );
}

