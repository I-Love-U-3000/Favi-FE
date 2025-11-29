"use client";

import { useState, useEffect, useCallback } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatList from "@/components/ChatList";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import { useTranslations } from "next-intl";
import { supabase } from "@/app/supabase-client";
import chatAPI from "@/lib/api/chatAPI";
import type { ConversationSummaryResponse, MessageResponse } from "@/types";

// --------- INTERNAL CHAT TYPES (làm việc với backend) ---------
interface ChatMessage {
  backendId: string;          // id từ backend (Guid)
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
}

interface ChatConversation {
  id: string;                 // conversationId từ backend
  key: string;                // key cho UI (ở đây = id luôn)
  recipient: ChatRecipient;
  messages: ChatMessage[];
}

// --------- UI TYPES cho ChatList / MessageList ---------
interface UiMessage {
  id: number;                 // UI-only id (number)
  sender: string;
  text: string;               // luôn string, không undefined
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
}

interface UiConversation {
  key: string;
  recipient: ChatRecipient;
  messages: UiMessage[];
}

export default function ChatPage() {
  const t = useTranslations("ChatPage");
  const currentUserId = "TODO-current-profile-id"; // TODO: lấy từ auth (supabase / jwt)

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // ------------- 1. Load danh sách conversations từ backend -------------
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = (await chatAPI.getConversations(
          1,
          50
        )) as ConversationSummaryResponse[];

        const mapped: ChatConversation[] = data.map((c) => {
          const other =
            c.members.find((m) => m.profileId !== currentUserId) ?? c.members[0];

          return {
            id: c.id,
            key: c.id, // có thể sau này đổi nếu muốn
            recipient: {
              username: other?.username ?? "unknown",
              avatar: other?.avatarUrl ?? "/default-avatar.png",
              isOnline: false,
            },
            messages: [],
          };
        });

        setConversations(mapped);

        if (mapped.length > 0) {
          // auto mở hội thoại đầu tiên
          handleConversationSelect(mapped[0].id, mapped[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------- 2. Load message khi chọn conversation -------------
  const handleConversationSelect = useCallback(
    async (conversationId: string, convFromList?: ChatConversation) => {
      try {
        const page = await chatAPI.getMessages(conversationId, 1, 50);
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

        const conv =
          convFromList ?? conversations.find((c) => c.id === conversationId) ?? null;
        if (!conv) return;

        const updatedConv: ChatConversation = { ...conv, messages: mappedMsgs };
        setSelectedConversation(updatedConv);
        setMessages(mappedMsgs);
      } catch (e) {
        console.error(e);
      }
    },
    [conversations]
  );

  // ------------- 3. Supabase Realtime: subscribe theo conversation hiện tại -------------
  useEffect(() => {
    if (!selectedConversation) return;

    const conversationId = selectedConversation.id;

    const channel = supabase
      .channel(`conversation:${conversationId}`, {
        config: {
          broadcast: { self: true }, // cho phép tự nhận lại event của mình nếu muốn
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

          // chỉ append nếu đúng conversation đang mở
          if (m.conversationId !== conversationId) return;

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // ------------- 4. Gửi message: gọi backend + broadcast Supabase -------------
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!selectedConversation) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      try {
        // 1) Gửi lên backend để lưu DB
        const sent = (await chatAPI.sendMessage(selectedConversation.id, {
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

        // 2) Append local cho responsive
        setMessages((prev) => [...prev, msg]);

        // 3) Broadcast qua Supabase để các client khác nhận
        supabase.channel(`conversation:${selectedConversation.id}`).send({
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
        console.error(e);
      }
    },
    [selectedConversation]
  );

  // --------- 5. Map sang type UI cho ChatList / MessageList ---------
  const uiConversations: UiConversation[] = conversations.map((c) => ({
    key: c.key,
    recipient: c.recipient,
    messages: c.messages.map((m, index) => ({
      id: index, // UI id (number), không dùng backendId
      sender: m.senderUsername,
      text: m.text ?? "",              // luôn string, không undefined
      timestamp: m.timestamp,
      imageUrl: m.imageUrl,
      stickerUrl: m.stickerUrl,
    })),
  }));

  const uiMessages: UiMessage[] = messages.map((m, index) => ({
    id: index, // UI id (number)
    sender: m.senderUsername,
    text: m.text ?? "",
    timestamp: m.timestamp,
    imageUrl: m.imageUrl,
    stickerUrl: m.stickerUrl,
  }));

  // ------------- 6. Render UI -------------
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-6 transition-colors duration-500"
      style={{ color: "var(--text)" }}
    >
      <header className="mb-8 text-center select-none relative z-10">
        <h1
          className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none"
          style={{
            background: "linear-gradient(to right, var(--primary), var(--accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Favi
        </h1>
      </header>

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
              // ChatList vẫn xài key để chọn conversation, nên mình truyền key (ở đây = id)
              onSelect={(conversationKey: string) => {
                const conv = conversations.find((c) => c.key === conversationKey);
                if (conv) {
                  handleConversationSelect(conv.id, conv);
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
                  {t?.("PickAChat") ?? "Select a conversation to start messaging."}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}