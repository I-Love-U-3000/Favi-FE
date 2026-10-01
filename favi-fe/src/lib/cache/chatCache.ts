"use client";

import * as signalR from "@microsoft/signalr";

export interface ChatMessage {
  backendId: string;
  senderId: string;
  senderUsername: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
  readBy?: string[];
  postPreview?: {
    id: string;
    authorProfileId: string;
    caption?: string | null;
    thumbnailUrl?: string | null;
    mediasCount: number;
    createdAt: string;
  } | null;
}

export interface ChatRecipient {
  username: string;
  avatar: string;
  isOnline: boolean;
  lastActiveAt?: string;
  profileId?: string;
}

export interface ChatConversation {
  id: string;
  key: string;
  recipient: ChatRecipient;
  messages: ChatMessage[];
  unreadCount?: number;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
}

export interface ConversationMessagesCache {
  messages: ChatMessage[];
  messagesPage: number;
  hasMoreMessages: boolean;
  scrollTop?: number;
}

export interface ChatCacheState {
  cachedUserId: string | null | undefined;
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  messagesByConv: Record<string, ConversationMessagesCache>;
  conversationsPage: number;
  hasNextConversations: boolean;
  searchQuery: string;
  loadedConversations: Set<string>;
  isInitialized: boolean;
}

const initialChatState: ChatCacheState = {
  cachedUserId: undefined,
  conversations: [],
  selectedConversationId: null,
  messagesByConv: {},
  conversationsPage: 1,
  hasNextConversations: false,
  searchQuery: "",
  loadedConversations: new Set(),
  isInitialized: false,
};

// Singleton in-memory store for Chat
const chatState: ChatCacheState = {
  ...initialChatState,
  loadedConversations: new Set(),
};

// Global hub connection reference
let activeChatHub: signalR.HubConnection | null = null;
let activeChatHubUserId: string | null = null;
const messageListeners = new Set<(message: any) => void>();

function ensureUserConsistency(userId: string | null | undefined) {
  if (chatState.cachedUserId !== undefined && chatState.cachedUserId !== userId) {
    clearChatCache();
  }
  chatState.cachedUserId = userId;
}

export function getChatCache(userId?: string | null): ChatCacheState {
  ensureUserConsistency(userId);
  return chatState;
}

export function updateChatConversations(
  conversations: ChatConversation[],
  page: number,
  hasNext: boolean,
  userId?: string | null
) {
  ensureUserConsistency(userId);
  chatState.conversations = conversations;
  chatState.conversationsPage = page;
  chatState.hasNextConversations = hasNext;
  chatState.isInitialized = true;
}

export function setSelectedChatConversationId(id: string | null) {
  chatState.selectedConversationId = id;
}

export function setChatSearchQuery(query: string) {
  chatState.searchQuery = query;
}

export function getConversationMessages(
  conversationId: string
): ConversationMessagesCache | undefined {
  return chatState.messagesByConv[conversationId];
}

export function setConversationMessages(
  conversationId: string,
  cache: ConversationMessagesCache
) {
  chatState.messagesByConv[conversationId] = cache;
}

export function appendMessageToConversation(
  conversationId: string,
  message: ChatMessage
) {
  const current = chatState.messagesByConv[conversationId];
  if (current) {
    if (!current.messages.some((m) => m.backendId === message.backendId)) {
      current.messages = [...current.messages, message];
    }
  } else {
    chatState.messagesByConv[conversationId] = {
      messages: [message],
      messagesPage: 1,
      hasMoreMessages: false,
    };
  }

  // Also update preview in conversations list
  chatState.conversations = chatState.conversations.map((c) => {
    if (c.id === conversationId) {
      return {
        ...c,
        lastMessagePreview: message.text || (message.imageUrl ? "[Image]" : "[Attachment]"),
        lastMessageAt: new Date().toISOString(),
        messages: current ? current.messages : [message],
      };
    }
    return c;
  });
}

export function addLoadedChatConversation(conversationId: string) {
  chatState.loadedConversations.add(conversationId);
}

export function saveConversationScrollTop(
  conversationId: string,
  scrollTop: number
) {
  const current = chatState.messagesByConv[conversationId];
  if (current) {
    current.scrollTop = scrollTop;
  }
}

// ---------------- PERSISTENT SIGNALR HUB CONNECTION ----------------
export function getOrCreateChatHubConnection(
  userId: string,
  onMessageReceived?: (msg: any) => void
): signalR.HubConnection | null {
  if (typeof window === "undefined" || !userId) return null;

  if (onMessageReceived) {
    messageListeners.add(onMessageReceived);
  }

  // If existing connection for same user is available and healthy
  if (activeChatHub && activeChatHubUserId === userId) {
    return activeChatHub;
  }

  // If different user, stop old
  if (activeChatHub) {
    activeChatHub.stop().catch(() => {});
    activeChatHub = null;
    activeChatHubUserId = null;
  }

  const token = localStorage.getItem("access_token");
  if (!token) return null;

  activeChatHubUserId = userId;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${process.env.NEXT_PUBLIC_HUB_URL}/chatHub`, {
      skipNegotiation: false,
      withCredentials: false,
      accessTokenFactory: () => token || "",
    })
    .withAutomaticReconnect({
      reconnectDelay: [0, 2000, 10000, 30000],
      maxRetries: 5,
    })
    .configureLogging({
      log: (logLevel, message) => {
        if (
          message.includes("stopped during negotiation") ||
          message.includes("Failed to start the connection") ||
          message.includes("connection was stopped")
        ) {
          return;
        }
        console.log(`[SignalR ${signalR.LogLevel[logLevel]}]`, message);
      },
    })
    .build();

  connection.on("ReceiveMessage", (message) => {
    // Notify all active listeners
    messageListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error("Error in message listener:", err);
      }
    });
  });

  connection
    .start()
    .then(() => {
      console.log("Persistent ChatHub connected");
    })
    .catch((error: Error) => {
      const errorMsg = error?.message || "";
      if (
        errorMsg.includes("stopped") ||
        errorMsg.includes("negotiation") ||
        errorMsg.includes("Failed to start")
      ) {
        return;
      }
      console.error("Error connecting to ChatHub:", error);
    });

  activeChatHub = connection;
  return connection;
}

export function removeMessageListener(listener: (msg: any) => void) {
  messageListeners.delete(listener);
}

// ---------------- CLEAR ----------------
export function clearChatCache() {
  chatState.conversations = [];
  chatState.selectedConversationId = null;
  chatState.messagesByConv = {};
  chatState.conversationsPage = 1;
  chatState.hasNextConversations = false;
  chatState.searchQuery = "";
  chatState.loadedConversations = new Set();
  chatState.isInitialized = false;

  if (activeChatHub) {
    activeChatHub.stop().catch(() => {});
    activeChatHub = null;
    activeChatHubUserId = null;
  }
  messageListeners.clear();
}
