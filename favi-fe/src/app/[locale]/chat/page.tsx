"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatList from "@/components/ChatList";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import { useTranslations } from "next-intl";
import { supabase } from "@/app/supabase-client";
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
}

interface ChatRecipient {
  username: string;
  avatar: string;
  isOnline: boolean;
  lastActiveAt?: string;
}

interface ChatConversation {
  id: string; // conversationId từ backend
  key: string; // key cho UI (ở đây = id luôn)
  recipient: ChatRecipient;
  messages: ChatMessage[];
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
}

interface UiConversation {
  key: string;
  recipient: ChatRecipient;
  messages: UiMessage[];
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

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

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
          },
          messages: [],
        };
      });

      setConversations(mapped);

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

        const mappedMsgs: ChatMessage[] = apiMessages.map((m) => ({
          backendId: m.id,
          senderId: m.senderId,
          senderUsername: m.username,
          text: m.content ?? undefined,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          imageUrl: m.mediaUrl ?? undefined,
        }));

        setMessages(mappedMsgs);

        // sync lại vào conversations để ChatList có preview
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversation.id ? { ...c, messages: mappedMsgs } : c
          )
        );
      } catch (e) {
        console.error("Error loading messages", e);
      }
    },
    []
  );

  // Khi `selectedConversationId` thay đổi (do click hoặc do initial select) thì load messages
  useEffect(() => {
    if (!selectedConversationId) return;
    const conv = conversations.find((c) => c.id === selectedConversationId);
    if (!conv) return;
    loadMessages(conv);
  }, [selectedConversationId, conversations, loadMessages]);

  const handleConversationSelect = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
    },
    []
  );

  // ------------- 3. Supabase Realtime: subscribe theo conversation hiện tại -------------
  useEffect(() => {
    if (!selectedConversationId) return;

    const channel = supabase
      .channel(`conversation:${selectedConversationId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "broadcast",
        { event: "new-message" },
        (payload) => {
          const m = payload.payload as {
            id: string;
            conversationId: string;
            senderId: string;
            username: string;
            content?: string;
            mediaUrl?: string;
            createdAt: string;
          };

          if (m.conversationId !== selectedConversationId) return;

          const incoming: ChatMessage = {
            backendId: m.id,
            senderId: m.senderId,
            senderUsername: m.username,
            text: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            imageUrl: m.mediaUrl,
          };

          setMessages((prev) => {
            if (prev.some((x) => x.backendId === incoming.backendId)) return prev;
            return [...prev, incoming];
          });

          // update cả conversations & selectedConversation preview
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversationId
                ? { ...c, messages: [...c.messages, incoming] }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId]);

  // ------------- 4. Gửi message -------------
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!selectedConversationId) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      try {
        const sent = (await chatAPI.sendMessage(selectedConversationId, {
          content: trimmed,
        })) as MessageResponse;

        const msg: ChatMessage = {
          backendId: sent.id,
          senderId: sent.senderId,
          senderUsername: sent.username,
          text: sent.content ?? "",
          timestamp: new Date(sent.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          imageUrl: sent.mediaUrl ?? undefined,
        };

        setMessages((prev) => [...prev, msg]);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversationId
              ? { ...c, messages: [...c.messages, msg] }
              : c
          )
        );

        // broadcast cho client khác
        supabase
          .channel(`conversation:${selectedConversationId}`)
          .send({
            type: "broadcast",
            event: "new-message",
            payload: {
              id: sent.id,
              conversationId: sent.conversationId,
              senderId: sent.senderId,
              username: sent.username,
              content: sent.content,
              mediaUrl: sent.mediaUrl,
              createdAt: sent.createdAt,
            },
          });
      } catch (e) {
        console.error("Error sending message", e);
      }
    },
    [selectedConversationId]
  );

  // ------------- 5. Map ra UI types -------------
  const uiConversations: UiConversation[] = conversations.map((c) => ({
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
    })),
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
  }));

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
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-6 transition-colors duration-500"
      style={{ color: "var(--text)" }}
    >
      <div
        className="relative z-10 w-full max-w-6xl rounded-3xl shadow-lg overflow-hidden"
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="text-xl md:text-2xl font-bold tracking-tight">
            {t?.("Chats") ?? "Chats"}
          </div>
          <div
            className="text-sm md:text-base"
            style={{ color: "var(--text-secondary)" }}
          >
            {selectedConversation?.recipient
              ? `${t?.("TalkingTo") ?? "Talking to"} @${
                  selectedConversation.recipient.username
                }`
              : t?.("NoConversation") ?? "No conversation selected"}
          </div>
        </div>

        <div className="flex gap-0">
          {/* Sidebar danh sách hội thoại */}
          <aside
            className="w-full md:w-1/3 lg:w-1/4 p-4"
            style={{ borderRight: "1px solid var(--border)" }}
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
            />
          </aside>

          {/* Khu chat */}
          <section className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            {selectedConversation ? (
              <>
                <ChatHeader
                  recipient={selectedConversation.recipient}
                  onBack={() => {}}
                />
                <div className="flex-1 overflow-y-auto" style={{ maxHeight: "58vh" }}>
                  <MessageList messages={uiMessages} currentUser={currentUserId} />
                </div>
                <MessageInput
                  onSend={handleSendMessage}
                  onSendImage={() => {}}
                  onSendSticker={() => {}}
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
    </div>
  );
}