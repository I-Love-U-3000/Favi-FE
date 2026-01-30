"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
  onNSFWConfirm?: (storyId: string) => void;
  isNSFWConfirmed?: (storyId: string) => boolean;
}

export default function StoryViewerDialog({
  visible,
  onHide,
  initialStoryFeed,
  initialProfileId,
  archivedStories = [],
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
  const [error, setError] = useState<string | null>(null);

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
  const progressRef = useRef(0);
  const storyStateRef = useRef({
    currentFeedIndex: 0,
    currentStoryIndex: 0,
    storyFeeds: [] as StoryFeedResponse[],
  });
  // Prevent infinite re-renders with useMemo
  const storyState = useMemo(() => ({
    currentFeedIndex,
    currentStoryIndex,
    storyFeeds,
  }), [currentFeedIndex, currentStoryIndex, storyFeeds]);

  // Memoize props to prevent unnecessary re-renders
  const memoInitialStoryFeed = useMemo(() => initialStoryFeed, [initialStoryFeed?.profileId]);
  const memoInitialProfileId = useMemo(() => initialProfileId, [initialProfileId]);

  const loadingRef = useRef(false); // Prevent multiple simultaneous loads

  // Navigation functions
  const nextStory = useCallback(() => {
    const { currentFeedIndex, currentStoryIndex, storyFeeds } = storyStateRef.current;
    const currentFeed = storyFeeds[currentFeedIndex];
    if (!currentFeed || storyFeeds.length === 0) return;

    if (currentStoryIndex < currentFeed.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      storyStateRef.current.currentStoryIndex = currentStoryIndex + 1;
      progressRef.current = 0;
    } else if (currentFeedIndex < storyFeeds.length - 1) {
      setCurrentFeedIndex(currentFeedIndex + 1);
      setCurrentStoryIndex(0);
      storyStateRef.current.currentFeedIndex = currentFeedIndex + 1;
      storyStateRef.current.currentStoryIndex = 0;
      progressRef.current = 0;
    } else {
      // End of stories
      onHide();
    }
  }, [onHide]);

  const prevStory = useCallback(() => {
    const { currentFeedIndex, currentStoryIndex, storyFeeds } = storyStateRef.current;
    if (storyFeeds.length === 0) return;

    
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      storyStateRef.current.currentStoryIndex = currentStoryIndex - 1;
      progressRef.current = 0;
    } else if (currentFeedIndex > 0) {
      setCurrentFeedIndex(currentFeedIndex - 1);
      const prevFeed = storyFeeds[currentFeedIndex - 1];
      if (prevFeed) {
        setCurrentStoryIndex(prevFeed.stories.length - 1);
        storyStateRef.current.currentFeedIndex = currentFeedIndex - 1;
        storyStateRef.current.currentStoryIndex = prevFeed.stories.length - 1;
        progressRef.current = 0;
      }
    }
  }, [onHide]);

  // Component mount check
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      loadingRef.current = false;
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

  // Load stories when dialog opens - simplified approach
  useEffect(() => {
    if (!visible) {
      setAutoPlayEnabled(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Simple load function without complex state management
    const loadStories = async () => {
      if (loadingRef.current) {
        console.log("Already loading, skipping...");
        return;
      }

      console.log("Starting to load stories...");
      loadingRef.current = true;

      setLoading(true);

      
      try {
        let feed: StoryFeedResponse[] = [];
        if (archivedStories && archivedStories.length > 0) {
          const profileIds = Array.from(new Set(archivedStories.map((s: StoryResponse) => s.profileId)));
          feed = profileIds.map(profileId => {
            const profileStories = archivedStories.filter((s: StoryResponse) => s.profileId === profileId);
            const profile = profileStories[0];
            return {
              profileId,
              profileUsername: profile.profileUsername,
              profileAvatarUrl: profile.profileAvatarUrl || null,
              stories: profileStories
            };
          });
        } else {
          if (initialStoryFeed) {
            if (!initialStoryFeed.profileId || !initialStoryFeed.profileUsername || !initialStoryFeed.stories) {
              throw new Error("Invalid story feed data");
            }
            feed = [initialStoryFeed];
          } else if (initialProfileId) {
            const allFeeds = await storyAPI.getFeed();
            const idx = allFeeds.findIndex((f) => f.profileId === initialProfileId);
            feed = [allFeeds[idx]];
          } else {
            feed = await storyAPI.getFeed();
          }
        }

        if (!feed || feed.length === 0) {
          throw new Error("No stories found");
        }

        // Single state update to avoid multiple renders
        setStoryFeeds(feed);
        // Use setState updater function to ensure we get the latest state
        setCurrentFeedIndex(0);
        setCurrentStoryIndex(0);
        storyStateRef.current = {
          currentFeedIndex: 0,
          currentStoryIndex: 0,
          storyFeeds: feed
        };
        setProgress(0);
        progressRef.current = 0;
        setViewersDialogVisible(false);
        setNsfwConfirmedStories(new Set());
      } catch (e: any) {
        console.error("Failed to load stories:", e);
        setError(e?.error || e?.message || "Failed to load stories");
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadStories();

    return () => {
      // Clean up any ongoing operations
      loadingRef.current = false;
    };
  }, [visible]); // Simplified to only depend on visible

  
  
  
  // Auto-progress through stories - CSS animation approach
  useEffect(() => {
    if (!visible || loading || viewersDialogVisible || !autoPlayEnabled) return;

    const timer = setTimeout(() => {
      // Time to move to next story
      const { storyFeeds, currentFeedIndex, currentStoryIndex } = storyStateRef.current;
      if (storyFeeds.length > 0) {
        
        const currentFeed = storyFeeds[currentFeedIndex];
        if (currentFeed && currentStoryIndex < currentFeed.stories.length - 1) {
          setCurrentStoryIndex(prev => prev + 1);
        } else if (currentFeedIndex < storyFeeds.length - 1) {
          setCurrentFeedIndex(prev => prev + 1);
          setCurrentStoryIndex(0);
        } else {
          // End of stories
          onHide();
        }
      }
    }, 5000); // 5 seconds per story

    return () => clearTimeout(timer);
  }, [visible, loading, viewersDialogVisible, autoPlayEnabled, onHide]);

  // Record view when story is shown - simplified
  useEffect(() => {
    if (!visible || loading || isViewingArchived) return;

    const { currentFeedIndex, currentStoryIndex, storyFeeds } = storyStateRef.current;
    if (storyFeeds.length === 0) return;

    const currentFeed = storyFeeds[currentFeedIndex];
    if (!currentFeed || currentStoryIndex >= currentFeed.stories.length) return;

    const story = currentFeed.stories[currentStoryIndex];
    if (story && !story.hasViewed) {
      storyAPI.recordView(story.id).catch(console.error);
    }
  }, [visible, loading, isViewingArchived]);

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

  if (!visible) return null;

  if (loading || storyFeeds.length === 0 || !currentStory) {

    // Check if we have feeds but stories are empty
    if (!loading && storyFeeds.length > 0) {
      const firstFeed = storyFeeds[0];

      // If we have feeds but no stories, show empty state for that specific case
      if (firstFeed.stories.length === 0) {
        return (
          <div
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
            onClick={onHide}
          >
            <div className="text-white text-center">
              <i className="pi pi-image text-4xl mb-4 opacity-50" />
              <div className="text-xl mb-2">No stories available</div>
              <div className="text-sm opacity-70">This profile has no stories to view.</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHide();
                }}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        );
      }
    }

    if (error) {
      return (
        <div
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
          onClick={onHide}
        >
          <div className="text-white text-center mb-4">
            <i className="pi pi-exclamation-triangle text-4xl mb-2" />
            <div className="text-xl font-semibold mb-2">Failed to load stories</div>
            <div className="text-sm opacity-80">{error}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
              // Force reload by setting loading true and triggering useEffect
              setLoading(true);
              const loadStories = async () => {
                try {
                  const feed = await storyAPI.getFeed();
                  setStoryFeeds(feed);
                    storyStateRef.current.storyFeeds = feed;
                                        setError(null);
                } catch (e: any) {
                  console.error("Failed to reload stories:", e);
                  setError(e?.error || e?.message || "Failed to reload stories");
                } finally {
                  setLoading(false);
                }
              };
              loadStories();
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    // Handle case when no stories are available
    if (!loading && storyFeeds.length === 0) {
      return (
        <div
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
          onClick={onHide}
        >
          <div className="text-white text-center">
            <i className="pi pi-image text-4xl mb-4 opacity-50" />
            <div className="text-xl mb-2">No stories available</div>
            <div className="text-sm opacity-70">There are no stories to view at the moment.</div>
          </div>
        </div>
      );
    }

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
                className={`h-full bg-white ${idx === currentStoryIndex && autoPlayEnabled ? 'animate-progress' : ''}`}
                style={{
                  width:
                    idx < currentStoryIndex
                      ? "100%"
                      : idx === currentStoryIndex
                        ? "0%" // Animation will handle the progress
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

