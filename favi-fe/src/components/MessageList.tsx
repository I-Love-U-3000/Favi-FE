"use client";

import MessageItem from "./MessageItem";

interface Message {
  id: number;
  senderId: string;       // <-- thêm
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
  readBy?: string[]; // Array of profile IDs who have read this message
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  recipientId?: string; // Recipient's profile ID (for DM read receipts)
  onImageClick?: (imageUrl: string) => void;
}

export default function MessageList({ messages, currentUser, recipientId, onImageClick }: MessageListProps) {
  return (
    <div
      style={{
        overflowX: "hidden",
        backgroundColor: "var(--bg-secondary)",
      }}
      className="flex-grow"
    >
      <div className="p-6 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p
              className="text-sm text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isSent={message.senderId === currentUser}
              recipientId={recipientId}
              currentUserId={currentUser}
              onImageClick={onImageClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
