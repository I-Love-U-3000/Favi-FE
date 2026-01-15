
"use client";

import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";

interface Recipient {
  username: string;
  avatar: string;
  isOnline: boolean;
}

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  imageUrl?: string;
}

interface Conversation {
  key: string;
  recipient: Recipient;
  messages: Message[];
  unreadCount?: number;
  lastMessagePreview?: string | null; // Last message preview from backend
  lastMessageAt?: string | null; // Last message timestamp from backend
}

interface ChatListProps {
  userId: string;
  onClose: () => void;
  onSelect: (toId: string) => void;
  conversations: Conversation[];
}

export default function ChatList({ userId, onClose, onSelect, conversations }: ChatListProps) {
  const getLastMessage = (conv: Conversation) => {
    // Use backend's lastMessagePreview if available (for conversations not yet loaded)
    if (conv.lastMessagePreview) {
      return conv.lastMessagePreview;
    }

    // Fall back to messages array for currently selected conversation
    if (conv.messages.length === 0) {
      return "No messages yet";
    }
    const lastMsg = conv.messages[conv.messages.length - 1];
    return lastMsg.text || (lastMsg.imageUrl ? "[Image]" : "[Media]");
  };

  const itemTemplate = (option: Conversation) => {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group hover:scale-[1.02]"
        onClick={() => onSelect(option.key)}
        suppressHydrationWarning
        style={{
          color: "var(--text)",
          backgroundColor: "transparent",
          border: "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-primary)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }}
      >
        <div className="relative flex-shrink-0">
          <div
            className="rounded-full overflow-hidden"
            style={{
              width: "42px",
              height: "42px",
              border: "2px solid var(--border)",
              transition: "all 0.2s ease",
            }}
          >
            <img
              src={option.recipient.avatar}
              alt={option.recipient.username}
              className="w-full h-full object-cover"
            />
          </div>
          {option.recipient.isOnline && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{
                backgroundColor: "#10b981",
                borderColor: "var(--bg-secondary)",
              }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-base truncate">
              {option.recipient.username}
            </div>
            {(option.unreadCount ?? 0) > 0 && (
              <Badge
                value={option.unreadCount && option.unreadCount > 9 ? "9+" : option.unreadCount}
                severity="danger"
                style={{
                  minWidth: "22px",
                  height: "22px",
                  fontSize: "11px",
                  fontWeight: "600",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
          <div
            className="text-sm truncate mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {getLastMessage(option)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <div key={conv.key}>
          {itemTemplate(conv)}
        </div>
      ))}
    </div>
  );
}