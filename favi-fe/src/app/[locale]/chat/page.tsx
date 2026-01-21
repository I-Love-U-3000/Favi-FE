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

// --------- INTERNAL CHAT TYPES (làm việc với backend) ---------
interface ChatMessage {
  backendId: string; // id từ backend (Guid)
  senderId: string;
  senderUsername: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
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

interface ChatRecipient {
  username: string;
  avatar: string;
  isOnline: boolean;
  lastActiveAt?: string;
  profileId?: string; // Profile ID of the recipient (for read receipts)
}

interface ChatConversation {
  id: string; // conversationId từ backend
  key: string; // key cho UI (ở đây = id luôn)
  recipient: ChatRecipient;
  messages: ChatMessage[];
  unreadCount?: number; // Unread message count
  lastMessagePreview?: string | null; // Last message preview from backend
  lastMessageAt?: string | null; // Last message timestamp from backend
}

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

  // ---- TẤT CẢ HOOK LUÔN Ở TOP-LEVEL (KHÔNG RETURN TRƯỚC NỮA) ----
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string>("");
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);

  // Track which conversations have been loaded (to preserve their unreadCount)
  const loadedConversationsRef = useRef<Set<string>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatHubRef = useRef<signalR.HubConnection | null>(null);

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
      const data = (await chatAPI.getConversations(
        1,
        50
      )) as ConversationSummaryResponse[];

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
      setConversations((prev) =>
        mapped.map((newConv) => {
          const existingConv = prev.find((c) => c.id === newConv.id);
          // If this conversation was loaded before, preserve its local unreadCount
          // The backend might return stale unread counts if markAsRead hasn't been processed yet
          if (existingConv && loadedConversationsRef.current.has(newConv.id)) {
            return {
              ...newConv,
              messages: existingConv.messages,
              unreadCount: existingConv.unreadCount, // Preserve local unread count
            };
          }
          return newConv;
        })
      );

      // Only set initial selection if not preserving
      if (!preserveSelection) {
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

  // Initial fetch
  useEffect(() => {
    fetchConversations(false);
  }, [fetchConversations]);

  // Periodically refresh conversations to update online status (preserve selection)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 1 * 60 * 1000); // Refresh every 1 minute

    return () => clearInterval(interval);
  }, [fetchConversations]);

  // ------------- 2. Hàm load messages cho 1 conversation -------------
  const loadMessages = useCallback(
    async (conversation: ChatConversation) => {
      try {
        const page = (await chatAPI.getMessages(
          conversation.id,
          1,
          50
        )) as MessagePageResponse;

        const apiMessages = page.items as MessageResponse[];

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

        setMessages(mappedMsgs);

        // Mark this conversation as loaded (to preserve its unreadCount during refreshes)
        loadedConversationsRef.current.add(conversation.id);

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

  // Khi `selectedConversationId` thay đổi (do click hoặc do initial select) thì load messages
  useEffect(() => {
    if (!selectedConversationId) return;
    const conv = conversations.find((c) => c.id === selectedConversationId);
    if (!conv) return;
    loadMessages(conv);
  }, [selectedConversationId, loadMessages]);

  // Scroll to bottom when conversation changes or messages are loaded
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      // Use setTimeout to ensure DOM has updated with new messages
      const timeoutId = setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'auto'
          });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedConversationId, messages.length]);

  const handleConversationSelect = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
    },
    []
  );

  // ------------- 3. SignalR: Connect to ChatHub and join conversation -------------
  useEffect(() => {
    if (!currentUserId) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      console.warn("No access token found for SignalR connection");
      return;
    }

    // Build connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL}/hubs/chat`, {
        skipNegotiation: false,
        withCredentials: false,
        accessTokenFactory: () => token || "",
      })
      .withAutomaticReconnect({
        reconnectDelay: [0, 2000, 10000, 30000],
        maxRetries: 5
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Listen for new messages
    connection.on("ReceiveMessage", (message) => {
      console.log("New message received via SignalR:", message);

      if (message.conversationId !== selectedConversationId) return;

      // Determine if incoming message is a sticker (GIF)
      const isGif = message.mediaUrl?.toLowerCase().includes('.gif');

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

      setMessages((prev) => {
        if (prev.some((x) => x.backendId === incoming.backendId)) return prev;
        return [...prev, incoming];
      });

      // update both conversations & selectedConversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? { ...c, messages: [...c.messages, incoming] }
            : c
        )
      );
    });

    // Start connection
    connection
      .start()
      .then(() => {
        console.log("ChatHub connected");
      })
      .catch((error: Error) => {
        console.error("Error connecting to ChatHub:", error);
      });

    chatHubRef.current = connection;

    // Cleanup on unmount
    return () => {
      if (chatHubRef.current) {
        chatHubRef.current.stop().catch(console.error);
        chatHubRef.current = null;
      }
    };
  }, [currentUserId]);

  // Join/leave conversation groups when selection changes
  useEffect(() => {
    if (!chatHubRef.current || !selectedConversationId) return;

    // Join the new conversation
    chatHubRef.current
      .invoke("JoinConversation", selectedConversationId)
      .catch((err) => console.error("Error joining conversation:", err));

    // Leave previous conversation when unmounting or changing
    return () => {
      if (chatHubRef.current) {
        chatHubRef.current
          .invoke("LeaveConversation", selectedConversationId)
          .catch((err) => console.error("Error leaving conversation:", err));
      }
    };
  }, [selectedConversationId]);

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

    // Use global call context to start the call with recipient username, avatar, and display name
    await call.startCall(
      selectedConversation.id,
      recipientId,
      callType,
      selectedConversation.recipient.username,
      selectedConversation.recipient.avatar,
      selectedConversation.recipient.username // Use username as display name (can be changed later)
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
            className="w-full md:w-1/3 lg:w-1/4 flex flex-col"
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>✕</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
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
            />
            </div>
          </aside>

          {/* Khu chat */}
          <section className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            {selectedConversation ? (
              <>
                <ChatHeader
                  recipient={selectedConversation.recipient}
                  onBack={() => {}}
                  onInfoClick={() => setMediaGalleryOpen(true)}
                  onVoiceCall={() => handleStartCall("audio")}
                  onVideoCall={() => handleStartCall("video")}
                />
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
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