"use client";

import ChatHeader from "@/components/ChatHeader";
import ChatList from "@/components/ChatList";
import Dock from "@/components/Dock";
import MessageInput from "@/components/MessageInput";
import MessageList from "@/components/MessageList";
import { useState, useEffect } from "react";

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

export default function Page() {
  const userId = "markpawson"; // Mock userId; replace with dynamic value if needed
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Mock conversation data
  const conversations: Conversation[] = [
    {
      key: "markpawson-elenavoyage",
      recipient: { username: "elenavoyage", avatar: "https://i.pravatar.cc/150?img=2", isOnline: true },
      messages: [
        { id: 1, sender: "elenavoyage", text: "Hey, loved your post! 😊", timestamp: "10:00 AM" },
        { id: 2, sender: "markpawson", text: "Thanks! 😄", timestamp: "10:05 AM" },
      ],
    },
    {
      key: "markpawson-john_doe",
      recipient: { username: "john_doe", avatar: "https://i.pravatar.cc/150?img=3", isOnline: false },
      messages: [
        { id: 1, sender: "john_doe", text: "Are we meeting later?", timestamp: "09:00 AM" },
        { id: 2, sender: "markpawson", text: "Yes, at 3 PM!", timestamp: "09:10 AM" },
      ],
    },
    {
      key: "markpawson-sarah_smith",
      recipient: { username: "sarah_smith", avatar: "https://i.pravatar.cc/150?img=4", isOnline: true },
      messages: [
        { id: 1, sender: "sarah_smith", text: "Check this out!", timestamp: "08:00 AM" },
      ],
    },
  ];

  useEffect(() => {
    // Set the first conversation as default
    if (conversations.length > 0) {
      setSelectedConversation(conversations[0]);
      setMessages(conversations[0].messages);
    }
  }, []);

  const handleConversationSelect = (toId: string) => {
    const conversation = conversations.find((conv) => conv.key === `${userId}-${toId}`);
    if (conversation) {
      setSelectedConversation(conversation);
      setMessages([...conversation.messages]); // Create a new array to trigger re-render
    }
  };

  const handleSendMessage = (text: string) => {
    if (selectedConversation && text.trim()) {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newMessages = [
        ...messages,
        { id: messages.length + 1, sender: userId, text, timestamp },
      ];
      setMessages(newMessages);
      setSelectedConversation({ ...selectedConversation, messages: newMessages });
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Dock cố định giữa bên trái */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2">
        <Dock />
      </div>

      {/* Content chính */}
      <main className="flex-1 flex flex-col items-center p-6 ml-24">
        <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-xl shadow-xl overflow-hidden flex">
          {/* Conversation List (Left Side) */}
          <div className="w-1/4 bg-gray-700 p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 48px)" }}>
            <h2 className="text-lg font-semibold mb-4">Chats</h2>
            <ChatList
              userId={userId}
              onClose={() => {}}
              onSelect={handleConversationSelect}
              conversations={conversations}
            />
          </div>
          {/* Chat Area (Right Side) */}
          {selectedConversation && (
            <div className="w-3/4 flex flex-col">
              <ChatHeader recipient={selectedConversation.recipient} onBack={() => {}} />
              <MessageList messages={messages} currentUser={userId} />
              <MessageInput onSend={handleSendMessage} />
            </div>
          )}
        </div>
      </main>
      </div>
    

    
  );
}