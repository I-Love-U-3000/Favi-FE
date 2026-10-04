"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatList from "@/components/ChatList";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import ImageViewer from "@/components/ImageViewer";
import MediaGallery from "@/components/MediaGallery";
import { useCall } from "@/components/CallProvider";
import type { CallType } from "@/types/call";
import { useTranslations } from "next-intl";
import * as signalR from "@microsoft/signalr";
import chatAPI from "@/lib/api/chatAPI";
import type {
  ConversationSummaryResponse,
  MessageResponse,
  MessagePageResponse,
} from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";
import type {
  ChatMessage,
  ChatRecipient,
  ChatConversation,
} from "@/lib/cache/chatCache";
import {
  getChatCache,
  updateChatConversations,
  setSelectedChatConversationId,
  setChatSearchQuery,
  getConversationMessages,
  setConversationMessages,
  appendMessageToConversation,
  addLoadedChatConversation,
  saveConversationScrollTop,
  saveConversationScroll,
  saveChatListScroll,
  getOrCreateChatHubConnection,
  removeMessageListener,
} from "@/lib/cache/chatCache";

// --------- UI TYPES cho ChatList / MessageList ---------
interface UiMessage {
  id: number; // UI-only id (number)
  senderId: string;
  sender: string; // username
  text: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
  isOwn: boolean;
  readBy?: string[]; // Array of profile IDs who have read this message
  postPreview?: {
    id: string;
    authorProfileId: string;
    caption?: string | null;
    thumbnailUrl?: string | null;
    mediasCount: number;
    createdAt: string;
  } | null;
}

interface UiConversation {
  key: string;
  recipient: ChatRecipient;
  messages: UiMessage[];
  unreadCount?: number; // Unread message count
  lastMessagePreview?: string | null; // Last message preview from backend
  lastMessageAt?: string | null; // Last message timestamp from backend
}

export default function ChatPage() {
  const t = useTranslations("ChatPage");
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");

  const chatCache = getChatCache(currentUserId);
  const initialConvId =
    initialConversationId ||
    (chatCache.isInitialized ? chatCache.selectedConversationId : null);

  const initialCachedMessages = initialConvId
    ? getConversationMessages(initialConvId)
    : undefined;

  // ---- TẤT CẢ HOOK LUÔN Ở TOP-LEVEL (KHÔNG RETURN TRƯỚC NỮA) ----
  const [conversations, setConversations] = useState<ChatConversation[]>(
    chatCache.isInitialized ? chatCache.conversations : []
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConvId
  );
  const selectedConversationIdRef = useRef(selectedConversationId);
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
    setSelectedChatConversationId(selectedConversationId);
  }, [selectedConversationId]);

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialCachedMessages ? initialCachedMessages.messages : []
  );
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(
    chatCache.isInitialized ? chatCache.searchQuery : ""
  );
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string>("");
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);

  // Conversation pagination
  const [conversationsPage, setConversationsPage] = useState(
    chatCache.isInitialized ? chatCache.conversationsPage : 1
  );
  const [hasNextConversations, setHasNextConversations] = useState(
    chatCache.isInitialized ? chatCache.hasNextConversations : false
  );
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);

  // Messages pagination (infinite scroll up)
  const [messagesPage, setMessagesPage] = useState(
    initialCachedMessages ? initialCachedMessages.messagesPage : 1
  );
  const [hasMoreMessages, setHasMoreMessages] = useState(
    initialCachedMessages ? initialCachedMessages.hasMoreMessages : false
  );
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const isInitialScrollDoneRef = useRef(false);

  // Track which conversations have been loaded (to preserve their unreadCount)
  const loadedConversationsRef = useRef<Set<string>>(
    chatCache.isInitialized ? new Set(chatCache.loadedConversations) : new Set()
  );
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatListContainerRef = useRef<HTMLDivElement>(null);
  const isRestoringMessagesScrollRef = useRef(false);
  const chatHubRef = useRef<signalR.HubConnection | null>(null);
  const [isChatHubConnected, setIsChatHubConnected] = useState(false);

  // ---- CALL CONTEXT ----
  const call = useCall();

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter((conv) =>
      conv.recipient.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  // ------------- 1. Load danh sách conversations từ backend -------------
  const fetchConversations = useCallback(async (preserveSelection: boolean = false) => {
    if (!currentUserId) return;

    try {
      const res = await chatAPI.getConversations(1, 10);
      const data = (res.data || res.items || []) as ConversationSummaryResponse[];

      const mapped: ChatConversation[] = data.map((c) => {
        const other =
          c.members.find((m) => m.profileId !== currentUserId) ?? c.members[0];

        const lastActive = other?.lastActiveAt
          ? new Date(other.lastActiveAt)
          : null;

        // Use 3 minutes threshold for faster online status updates
        const isOnline =
          !!lastActive &&
          Date.now() - lastActive.getTime() < 3 * 60 * 1000;

        return {
          id: c.id,
          key: c.id,
          recipient: {
            username: other?.username ?? "unknown",
            avatar: other?.avatarUrl ?? "/avatar-default.svg",
            isOnline,
            lastActiveAt: other?.lastActiveAt,
            profileId: other?.profileId,
          },
          messages: [],
          unreadCount: c.unreadCount,
          lastMessagePreview: c.lastMessagePreview,
          lastMessageAt: c.lastMessageAt,
        };
      });

      // Preserve local state: keep unreadCount for conversations that have been loaded
      // and keep messages for conversations that have been loaded
      setConversations((prev) => {
        const updatedConversations = mapped.map((newConv) => {
          const existingConv = prev.find((c) => c.id === newConv.id);
          if (existingConv && loadedConversationsRef.current.has(newConv.id)) {
            return {
              ...newConv,
              messages: existingConv.messages,
              unreadCount: existingConv.unreadCount,
            };
          }
          return newConv;
        });

        updateChatConversations(
          updatedConversations,
          res.page || 1,
          res.hasNext ?? false,
          currentUserId
        );

        return updatedConversations;
      });

      setConversationsPage(res.page || 1);
      setHasNextConversations(res.hasNext ?? false);

      // Only set initial selection if not preserving and no selection exists
      if (!preserveSelection && !selectedConversationIdRef.current) {
        // Ưu tiên mở conversationId từ URL nếu có
        const initialConv =
          (initialConversationId &&
            mapped.find((c) => c.id === initialConversationId)) ||
          mapped[0];

        if (initialConv) {
          setSelectedConversationId(initialConv.id);
        }
      }
    } catch (e) {
      console.error("Error fetching conversations", e);
    }
  }, [currentUserId, initialConversationId]);

  const handleLoadMoreConversations = async () => {
    if (!currentUserId || loadingMoreConversations || !hasNextConversations) return;
    setLoadingMoreConversations(true);
    try {
      const nextPage = conversationsPage + 1;
      const res = await chatAPI.getConversations(nextPage, 10);
      const data = (res.data || res.items || []) as ConversationSummaryResponse[];
      const mapped: ChatConversation[] = data.map((c) => {
        const other =
          c.members.find((m) => m.profileId !== currentUserId) ?? c.members[0];

        const lastActive = other?.lastActiveAt
          ? new Date(other.lastActiveAt)
          : null;

        const isOnline =
          !!lastActive &&
          Date.now() - lastActive.getTime() < 3 * 60 * 1000;

        return {
          id: c.id,
          key: c.id,
          recipient: {
            username: other?.username ?? "unknown",
            avatar: other?.avatarUrl ?? "/avatar-default.svg",
            isOnline,
            lastActiveAt: other?.lastActiveAt,
            profileId: other?.profileId,
          },
          messages: [],
          unreadCount: c.unreadCount,
          lastMessagePreview: c.lastMessagePreview,
          lastMessageAt: c.lastMessageAt,
        };
      });

      setConversations((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newItems = mapped.filter((c) => !existingIds.has(c.id));
        const updated = [...prev, ...newItems];
        updateChatConversations(
          updated,
          res.page || nextPage,
          res.hasNext ?? false,
          currentUserId
        );
        return updated;
      });
      setConversationsPage(res.page || nextPage);
      setHasNextConversations(res.hasNext ?? false);
    } catch (e) {
      console.error("Error loading more conversations", e);
    } finally {
      setLoadingMoreConversations(false);
    }
  };

  // Initial fetch only if not already cached
  useEffect(() => {
    if (!chatCache.isInitialized) {
      fetchConversations(false);
    }
  }, [fetchConversations, chatCache.isInitialized]);

  // Periodically refresh conversations to update online status (preserve selection)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 1 * 60 * 1000); // Refresh every 1 minute

    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Restore ChatList scroll position when conversations are loaded/rendered
  useEffect(() => {
    if (chatCache.chatListScrollTop > 0 && chatListContainerRef.current) {
      const target = chatCache.chatListScrollTop;
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (chatListContainerRef.current) {
          chatListContainerRef.current.scrollTop = target;
          if (
            Math.abs(chatListContainerRef.current.scrollTop - target) < 5 ||
            attempts >= 10
          ) {
            clearInterval(interval);
          }
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [conversations.length, chatCache.chatListScrollTop]);

  // Save scroll states on unmount
  useEffect(() => {
    return () => {
      if (selectedConversationIdRef.current && messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const threshold = 60;
        const isAtBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
        saveConversationScroll(
          selectedConversationIdRef.current,
          container.scrollTop,
          isAtBottom
        );
      }
      if (chatListContainerRef.current) {
        saveChatListScroll(chatListContainerRef.current.scrollTop);
      }
    };
  }, []);

  // ------------- 2. Hàm load messages cho 1 conversation -------------
  const loadMessages = useCallback(
    async (conversation: ChatConversation) => {
      // Guard: Don't load messages if user is not authenticated
      if (!currentUserId) {
        console.warn("Cannot load messages: user not authenticated");
        return;
      }

      try {
        const page = await chatAPI.getMessages(conversation.id, 1, 50);
        const apiMessages = (page.items || page.data || []) as MessageResponse[];
        const total = (page as any).total ?? (page as any).totalCount ?? 0;

        const mappedMsgs: ChatMessage[] = apiMessages.map((m) => {
          // Determine if this is a sticker (GIF URLs)
          const isGif = m.mediaUrl?.toLowerCase().includes('.gif');

          return {
            backendId: m.id,
            senderId: m.senderId,
            senderUsername: m.username,
            text: m.content ?? undefined,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            imageUrl: isGif ? undefined : (m.mediaUrl ?? undefined),
            stickerUrl: isGif ? m.mediaUrl : undefined,
            readBy: m.readBy ?? [],
            postPreview: m.postPreview ?? undefined,
          };
        });

        const hasMore = apiMessages.length < total || (page as any).hasNext === true;
        setMessages(mappedMsgs);
        setMessagesPage(1);
        setHasMoreMessages(hasMore);
        isInitialScrollDoneRef.current = false;

        setConversationMessages(conversation.id, {
          messages: mappedMsgs,
          messagesPage: 1,
          hasMoreMessages: hasMore,
        });

        // Mark this conversation as loaded (to preserve its unreadCount during refreshes)
        loadedConversationsRef.current.add(conversation.id);
        addLoadedChatConversation(conversation.id);

        // Mark ALL unread messages as read (not just the last one)
        // Find messages not from current user that haven't been read yet
        const unreadMessages = mappedMsgs.filter(
          (msg) => msg.senderId !== currentUserId && !msg.readBy?.includes(currentUserId)
        );

        if (unreadMessages.length > 0) {
          // Mark the oldest unread message as read
          // The backend should automatically mark all earlier messages as read too
          const oldestUnreadMessage = unreadMessages[0];
          try {
            await chatAPI.markAsRead(conversation.id, oldestUnreadMessage.backendId);
          } catch (e) {
            console.error("Error marking messages as read", e);
          }
        }

        // sync lại vào conversations để ChatList có preview, và reset unreadCount khi load messages
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversation.id
              ? { ...c, messages: mappedMsgs, unreadCount: 0 }
              : c
          )
        );
      } catch (e) {
        console.error("Error loading messages", e);
      }
    },
    [currentUserId]
  );

  // Auto-fetch older messages when scrolling up
  const handleMessagesScroll = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 60 && hasMoreMessages && !loadingOlderMessages && selectedConversationId) {
      setLoadingOlderMessages(true);
      const prevScrollHeight = container.scrollHeight;
      try {
        const nextPage = messagesPage + 1;
        const page = await chatAPI.getMessages(selectedConversationId, nextPage, 50);
        const apiMessages = (page.items || page.data || []) as MessageResponse[];
        const total = (page as any).total ?? (page as any).totalCount ?? 0;
        if (apiMessages.length > 0) {
          const mappedOlderMsgs: ChatMessage[] = apiMessages.map((m) => {
            const isGif = m.mediaUrl?.toLowerCase().includes('.gif');
            return {
              backendId: m.id,
              senderId: m.senderId,
              senderUsername: m.username,
              text: m.content ?? undefined,
              timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              imageUrl: isGif ? undefined : (m.mediaUrl ?? undefined),
              stickerUrl: isGif ? m.mediaUrl : undefined,
              readBy: m.readBy ?? [],
              postPreview: m.postPreview ?? undefined,
            };
          });

          const hasMore = nextPage * 50 < total || (page as any).hasNext === true;
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.backendId));
            const newOlder = mappedOlderMsgs.filter((m) => !existingIds.has(m.backendId));
            const updated = [...newOlder, ...prev];
            setConversationMessages(selectedConversationId, {
              messages: updated,
              messagesPage: nextPage,
              hasMoreMessages: hasMore,
            });
            return updated;
          });
          setMessagesPage(nextPage);
          setHasMoreMessages(hasMore);

          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          });
        } else {
          setHasMoreMessages(false);
        }
      } catch (e) {
        console.error("Error loading older messages", e);
      } finally {
        setLoadingOlderMessages(false);
      }
    }
  }, [hasMoreMessages, loadingOlderMessages, messagesPage, selectedConversationId]);

  const handleContainerScroll = useCallback(() => {
    handleMessagesScroll();
    const container = messagesContainerRef.current;
    if (!container || !selectedConversationId) return;

    if (isRestoringMessagesScrollRef.current) return;

    const threshold = 60;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;

    saveConversationScroll(selectedConversationId, container.scrollTop, isAtBottom);
  }, [handleMessagesScroll, selectedConversationId]);

  // Khi `selectedConversationId` thay đổi (do click hoặc do initial select) thì load messages
  useEffect(() => {
    if (!selectedConversationId) return;
    // Guard: Don't load messages if user is not authenticated
    if (!currentUserId) return;

    // Check if messages for this conversation are already in cache
    const cachedConv = getConversationMessages(selectedConversationId);
    if (cachedConv && cachedConv.messages.length > 0) {
      setMessages(cachedConv.messages);
      setMessagesPage(cachedConv.messagesPage);
      setHasMoreMessages(cachedConv.hasMoreMessages);
      isInitialScrollDoneRef.current = false;
      return;
    }

    const conv = conversations.find((c) => c.id === selectedConversationId);
    if (!conv) return;
    loadMessages(conv);
  }, [selectedConversationId, loadMessages, currentUserId]);

  // Sync if URL search parameter changes
  useEffect(() => {
    if (initialConversationId && initialConversationId !== selectedConversationId) {
      setSelectedConversationId(initialConversationId);
    }
  }, [initialConversationId, selectedConversationId]);

  // Scroll to bottom or restore position when conversation changes or initial messages are loaded
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0 && !isInitialScrollDoneRef.current) {
      isInitialScrollDoneRef.current = true;
      const cachedConv = selectedConversationId
        ? getConversationMessages(selectedConversationId)
        : null;

      isRestoringMessagesScrollRef.current = true;

      const restoreToExactPos =
        cachedConv &&
        cachedConv.isAtBottom === false &&
        typeof cachedConv.scrollTop === "number";

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const container = messagesContainerRef.current;
        if (!container || !isRestoringMessagesScrollRef.current) {
          clearInterval(interval);
          return;
        }

        if (restoreToExactPos) {
          const target = cachedConv.scrollTop!;
          container.scrollTop = target;
          if (Math.abs(container.scrollTop - target) < 5 || attempts >= 15) {
            clearInterval(interval);
            isRestoringMessagesScrollRef.current = false;
          }
        } else {
          // Bottom
          container.scrollTop = container.scrollHeight - container.clientHeight;
          if (attempts >= 15) {
            clearInterval(interval);
            isRestoringMessagesScrollRef.current = false;
          }
        }
      }, 40);

      const cancelRestoration = () => {
        isRestoringMessagesScrollRef.current = false;
      };

      const container = messagesContainerRef.current;
      container.addEventListener("wheel", cancelRestoration, { passive: true, once: true });
      container.addEventListener("touchstart", cancelRestoration, { passive: true, once: true });
      container.addEventListener("pointerdown", cancelRestoration, { passive: true, once: true });

      return () => {
        clearInterval(interval);
        if (container) {
          container.removeEventListener("wheel", cancelRestoration);
          container.removeEventListener("touchstart", cancelRestoration);
          container.removeEventListener("pointerdown", cancelRestoration);
        }
      };
    }
  }, [selectedConversationId, messages.length]);

  const handleConversationSelect = useCallback(
    (conversationId: string) => {
      // Save current conversation scroll state before switching
      if (selectedConversationId && messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const threshold = 60;
        const isAtBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
        saveConversationScroll(selectedConversationId, container.scrollTop, isAtBottom);
      }
      isInitialScrollDoneRef.current = false;
      setSelectedConversationId(conversationId);
    },
    [selectedConversationId]
  );

  // ------------- 3. SignalR: Connect to ChatHub and join conversation -------------
  useEffect(() => {
    if (!currentUserId) return;

    const handleIncomingMessage = (message: any) => {
      console.log("New message received via SignalR:", message);

      const isGif = message.mediaUrl?.toLowerCase().includes(".gif");

      const incoming: ChatMessage = {
        backendId: message.id,
        senderId: message.senderId,
        senderUsername: message.username,
        text: message.content,
        timestamp: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        imageUrl: isGif ? undefined : message.mediaUrl,
        stickerUrl: isGif ? message.mediaUrl : undefined,
        readBy: message.readBy ?? [],
        postPreview: message.postPreview ?? undefined,
      };

      appendMessageToConversation(message.conversationId, incoming);

      if (message.conversationId === selectedConversationIdRef.current) {
        setMessages((prev) => {
          if (prev.some((x) => x.backendId === incoming.backendId)) return prev;
          return [...prev, incoming];
        });

        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const wasNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight <= 120;
          if (wasNearBottom) {
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTo({
                  top: messagesContainerRef.current.scrollHeight,
                  behavior: "smooth",
                });
              }
            }, 50);
          }
        }
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === message.conversationId
            ? {
                ...c,
                messages: [...c.messages, incoming],
                lastMessagePreview:
                  incoming.text || (incoming.imageUrl ? "[Image]" : "[Attachment]"),
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );
    };

    const hub = getOrCreateChatHubConnection(currentUserId, handleIncomingMessage);
    chatHubRef.current = hub;

    if (hub) {
      const joinCurrent = () => {
        setIsChatHubConnected(true);
        if (selectedConversationIdRef.current && hub.state === signalR.HubConnectionState.Connected) {
          hub
            .invoke("JoinConversation", selectedConversationIdRef.current)
            .catch((err) => console.error("Error joining conversation:", err));
        }
      };

      if (hub.state === signalR.HubConnectionState.Connected) {
        joinCurrent();
      } else {
        const interval = setInterval(() => {
          if (hub.state === signalR.HubConnectionState.Connected) {
            clearInterval(interval);
            joinCurrent();
          } else if (hub.state === signalR.HubConnectionState.Disconnected) {
            clearInterval(interval);
          }
        }, 100);
      }

      const onReconnected = () => {
        joinCurrent();
      };

      const onClose = () => {
        setIsChatHubConnected(false);
      };

      hub.onreconnected(onReconnected);
      hub.onclose(onClose);
    }

    return () => {
      removeMessageListener(handleIncomingMessage);
    };
  }, [currentUserId]);

  // Join/leave conversation groups when selection changes or hub connects
  useEffect(() => {
    if (!chatHubRef.current || !selectedConversationId || !isChatHubConnected) return;

    // Only join if the connection is actually connected
    if (chatHubRef.current.state === signalR.HubConnectionState.Connected) {
      chatHubRef.current
        .invoke("JoinConversation", selectedConversationId)
        .catch((err) => console.error("Error joining conversation:", err));
    }

    // Leave previous conversation when unmounting or changing
    return () => {
      if (chatHubRef.current && chatHubRef.current.state === signalR.HubConnectionState.Connected) {
        chatHubRef.current
          .invoke("LeaveConversation", selectedConversationId)
          .catch((err) => console.error("Error leaving conversation:", err));
      }
    };
  }, [selectedConversationId, isChatHubConnected]);

  // ---- CALL HANDLER (uses global CallProvider) ----
  const handleStartCall = useCallback(async (callType: CallType) => {
    if (!selectedConversation) {
      alert('Cannot start call: No conversation selected');
      return;
    }

    const recipientId = selectedConversation.recipient.profileId;
    if (!recipientId) {
      alert('Cannot start call: Recipient ID not found');
      return;
    }

    // Use global call context to start the call with recipient username
    await call.startCall(
      selectedConversation.id,
      recipientId,
      callType,
      selectedConversation.recipient.username
    );
  }, [selectedConversation, call]);

  // ------------- 4. Gửi message -------------
  const handleSendMessage = useCallback(
    async (text: string, mediaUrl?: string, isSticker: boolean = false, postId?: string) => {
      if (!selectedConversationId) return;
      const trimmed = text.trim();
      if (!trimmed && !mediaUrl && !postId) return;

      try {
        const sent = (await chatAPI.sendMessage(selectedConversationId, {
          content: trimmed || undefined,
          mediaUrl: mediaUrl || undefined,
          postId: postId,
        })) as MessageResponse;

        // Determine if this is a sticker (GIF URLs or explicitly marked as sticker)
        const isGif = mediaUrl?.toLowerCase().includes('.gif') || isSticker;

        const msg: ChatMessage = {
          backendId: sent.id,
          senderId: sent.senderId,
          senderUsername: sent.username,
          text: sent.content ?? "",
          timestamp: new Date(sent.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          imageUrl: isGif ? undefined : (sent.mediaUrl ?? undefined),
          stickerUrl: isGif ? sent.mediaUrl : undefined,
          readBy: sent.readBy ?? [],
          postPreview: sent.postPreview ?? undefined,
        };

        setMessages((prev) => [...prev, msg]);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversationId
              ? { ...c, messages: [...c.messages, msg] }
              : c
          )
        );

        appendMessageToConversation(selectedConversationId, msg);

        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 50);
      } catch (e) {
        console.error("Error sending message", e);
      }
    },
    [selectedConversationId]
  );

  // Handler specifically for stickers (emojis sent as text, GIFs sent as media)
  const handleSendSticker = useCallback(
    async (sticker: string) => {
      // Check if it's a URL (GIF) or an emoji
      const isUrl = sticker.startsWith('http://') || sticker.startsWith('https://');

      if (isUrl) {
        // Send GIF as media
        await handleSendMessage("", sticker, true);
      } else {
        // Send emoji as text content
        await handleSendMessage(sticker, undefined, false);
      }
    },
    [handleSendMessage]
  );

  // ------------- 5. Map ra UI types -------------
  const uiConversations: UiConversation[] = filteredConversations.map((c) => ({
    key: c.key,
    recipient: c.recipient,
    messages: c.messages.map((m, index) => ({
      id: index,
      senderId: m.senderId,
      sender: m.senderUsername,
      text: m.text ?? "",
      timestamp: m.timestamp,
      imageUrl: m.imageUrl,
      stickerUrl: m.stickerUrl,
      isOwn: m.senderId === currentUserId,
      postPreview: m.postPreview,
    })),
    unreadCount: c.unreadCount,
    lastMessagePreview: c.lastMessagePreview,
    lastMessageAt: c.lastMessageAt,
  }));

  const uiMessages: UiMessage[] = messages.map((m, index) => ({
    id: index,
    senderId: m.senderId,
    sender: m.senderUsername,
    text: m.text ?? "",
    timestamp: m.timestamp,
    imageUrl: m.imageUrl,
    stickerUrl: m.stickerUrl,
    isOwn: m.senderId === currentUserId,
    readBy: m.readBy,
    postPreview: m.postPreview,
  }));

  // Extract all image URLs from the conversation messages
  const conversationImages = useMemo(() => {
    return messages
      .filter((m) => m.imageUrl)
      .map((m) => m.imageUrl)
      .filter((url): url is string => url !== undefined) // Type guard to filter out undefined
      .reverse(); // Show most recent images first
  }, [messages]);

  // ------------- 6. Render UI -------------
  if (!currentUserId) {
    // Lưu ý: đặt sau tất cả hooks, không còn vi phạm Rules of Hooks
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm opacity-70">
          Bạn cần đăng nhập để dùng chat.
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden flex flex-col transition-colors duration-500"
      style={{ color: "var(--text)" }}
    >
      <div
        className="relative z-10 w-full flex-1 flex flex-col overflow-hidden"
        style={{
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text)",
        }}
      >
        <div className="flex gap-0 flex-1 overflow-hidden">
          {/* Sidebar danh sách hội thoại */}
          <aside
            className={`w-full md:w-1/3 lg:w-1/4 flex-col ${
              selectedConversationId ? "hidden md:flex" : "flex"
            }`}
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <div className="p-4 pb-2">
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setChatSearchQuery(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(34, 211, 238, 0.5)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(34, 211, 238, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setChatSearchQuery("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>✕</span>
                  </button>
                )}
              </div>
            </div>
            <div
              ref={chatListContainerRef}
              className="flex-1 overflow-y-auto px-4 pb-4"
              onScroll={(e) => {
                saveChatListScroll(e.currentTarget.scrollTop);
              }}
            >
              <ChatList
                userId={currentUserId}
                onClose={() => {}}
                onSelect={(conversationKey: string) => {
                  const conv = conversations.find((c) => c.key === conversationKey);
                  if (conv) {
                    handleConversationSelect(conv.id);
                  }
                }}
                conversations={uiConversations}
                hasNext={hasNextConversations}
                loadingMore={loadingMoreConversations}
                onLoadMore={handleLoadMoreConversations}
              />
            </div>
          </aside>

          {/* Khu chat */}
          <section
            className={`w-full md:w-2/3 lg:w-3/4 flex-col ${
              !selectedConversationId ? "hidden md:flex" : "flex"
            }`}
          >
            {selectedConversation ? (
              <>
                <ChatHeader
                  recipient={selectedConversation.recipient}
                  onBack={() => setSelectedConversationId(null)}
                  onInfoClick={() => setMediaGalleryOpen(true)}
                  onVoiceCall={() => handleStartCall("audio")}
                  onVideoCall={() => handleStartCall("video")}
                />
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto" onScroll={handleContainerScroll}>
                  {loadingOlderMessages && (
                    <div className="py-2 text-center text-xs opacity-60 flex items-center justify-center gap-1.5">
                      <i className="pi pi-spin pi-spinner text-xs" />
                      <span>Loading older messages...</span>
                    </div>
                  )}
                  <MessageList
                    messages={uiMessages}
                    currentUser={currentUserId}
                    recipientId={selectedConversation.recipient?.profileId}
                    onImageClick={(imageUrl) => {
                      setViewingImageUrl(imageUrl);
                      setImageViewerOpen(true);
                    }}
                  />
                </div>
                <MessageInput
                  onSend={handleSendMessage}
                  onSendImage={() => {}}
                  onSendSticker={handleSendSticker}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p style={{ color: "var(--text-secondary)" }}>
                  {t?.("PickAChat") ??
                    "Select a conversation to start messaging."}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Image Viewer */}
      {imageViewerOpen && (
        <ImageViewer
          imageUrl={viewingImageUrl}
          onClose={() => setImageViewerOpen(false)}
        />
      )}

      {/* Media Gallery */}
      <MediaGallery
        isOpen={mediaGalleryOpen}
        onClose={() => setMediaGalleryOpen(false)}
        images={conversationImages}
      />
    </div>
  );
}