"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatList from "@/components/ChatList";
import Dock from "@/components/Dock";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { useTranslations } from "next-intl";

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
}

interface Recipient {
  username: string;
  avatar: string;
  isOnline: boolean;
}

interface Conversation {
  key: string;
  recipient: Recipient;
  messages: Message[];
}

export default function ChatPage() {
  const t = useTranslations("ChatPage"); // optional: dùng nếu đã có messages/keys
  const userId = "markpawson"; // TODO: thay bằng userId thực tế

  // Dùng useMemo để đảm bảo mảng hội thoại ổn định giữa các render
  const conversations = useMemo<Conversation[]>(
    () => [
      {
        key: "markpawson-elenavoyage",
        recipient: {
          username: "elenavoyage",
          avatar: "https://i.pravatar.cc/150?img=2",
          isOnline: true
        },
        messages: [
          { id: 1, sender: "elenavoyage", text: "Hey, loved your post! 😊", timestamp: "10:00 AM" },
          { id: 2, sender: "markpawson", text: "Thanks! 😄", timestamp: "10:05 AM" }
        ]
      },
      {
        key: "markpawson-john_doe",
        recipient: {
          username: "john_doe",
          avatar: "https://i.pravatar.cc/150?img=3",
          isOnline: false
        },
        messages: [
          { id: 1, sender: "john_doe", text: "Are we meeting later?", timestamp: "09:00 AM" },
          { id: 2, sender: "markpawson", text: "Yes, at 3 PM!", timestamp: "09:10 AM" }
        ]
      },
      {
        key: "markpawson-sarah_smith",
        recipient: {
          username: "sarah_smith",
          avatar: "https://i.pravatar.cc/150?img=4",
          isOnline: true
        },
        messages: [{ id: 1, sender: "sarah_smith", text: "Check this out!", timestamp: "08:00 AM" }]
      }
    ],
    []
  );

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (conversations.length > 0) {
      const first = conversations[0];
      setSelectedConversation(first);
      setMessages(first.messages);
    }
  }, [conversations]);

  const handleConversationSelect = useCallback(
    (toId: string) => {
      const conv = conversations.find((c) => c.key === `${userId}-${toId}`);
      if (conv) {
        setSelectedConversation(conv);
        setMessages([...conv.messages]);
      }
    },
    [conversations, userId]
  );

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!selectedConversation) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newMessages = [
        ...messages,
        { id: messages.length + 1, sender: userId, text: trimmed, timestamp }
      ];

      setMessages(newMessages);
      // Nếu muốn đồng bộ lại toàn bộ list conversations (khi sau này lấy từ server),
      // ở đây có thể dispatch cập nhật vào store/global hoặc gọi API.
      setSelectedConversation({ ...selectedConversation, messages: newMessages });
    },
    [messages, selectedConversation, userId]
  );

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
            WebkitTextFillColor: "transparent"
          }}
        >
          Favi
        </h1>
        <p className="mt-2 text-lg md:text-xl font-medium opacity-90" style={{ color: "var(--text-secondary)" }}>
          {t?.("ChatSlogan") ?? "Connect and chat with your friends in real-time."}
        </p>
      </header>

      {/* Khung Chat chính trong Card giống Register */}
      <Card
        className="relative z-10 w-full max-w-6xl rounded-3xl shadow-lg overflow-hidden"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border)",
          color: "var(--text)",
          borderWidth: "1px"
        }}
        title={
          <div className="flex items-center justify-between">
            <div className="text-xl md:text-2xl font-bold tracking-tight">
              {t?.("Chats") ?? "Chats"}
            </div>
            <div className="text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
              {selectedConversation?.recipient
                ? `${t?.("TalkingTo") ?? "Talking to"} @${selectedConversation.recipient.username}`
                : t?.("NoConversation") ?? "No conversation selected"}
            </div>
          </div>
        }
      >
        <div className="flex gap-0">
          {/* Sidebar danh sách hội thoại */}
          <aside
            className="w-full md:w-1/3 lg:w-1/4 p-4 border-r"
            style={{ borderColor: "var(--border)", maxHeight: "70vh" }}
          >
            <ChatList
              userId={userId}
              onClose={() => {}}
              onSelect={handleConversationSelect}
              conversations={conversations}
            />
          </aside>

          {/* Khu chat */}
          <section className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            {selectedConversation ? (
              <>
                <ChatHeader recipient={selectedConversation.recipient} onBack={() => {}} />
                <Divider className="!my-0" />
                <div className="flex-1 overflow-y-auto" style={{ maxHeight: "58vh" }}>
                  <MessageList messages={messages} currentUser={userId} />
                </div>
                <Divider className="!my-0" />
                <div className="p-3">
                  <MessageInput onSend={handleSendMessage} />
                </div>
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
      </Card>
    </div>
  );
}