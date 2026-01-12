
"use client";

import { ListBox } from "primereact/listbox";
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
}

interface Conversation {
  key: string;
  recipient: Recipient;
  messages: Message[];
  unreadCount?: number; // Add unread count
}

interface ChatListProps {
  userId: string;
  onClose: () => void;
  onSelect: (toId: string) => void;
  conversations: Conversation[];
}

export default function ChatList({ userId, onClose, onSelect, conversations }: ChatListProps) {
  // Derive lastMessage from the latest message in messages
  const getLastMessage = (conv: Conversation) => {
    if (conv.messages.length === 0) {
      return "No messages yet";
    }
    const lastMsg = conv.messages[conv.messages.length - 1];
    return lastMsg.text || (lastMsg.imageUrl ? "[Image]" : "[Media]");
  };

  const itemTemplate = (option: Conversation) => {
    return (
      <div
        className="flex items-center gap-2 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
        onClick={() => onSelect(option.key)}
        suppressHydrationWarning
        style={{ color: "var(--text)" }}
      >
        <div className="relative">
          <Avatar className="h-8 w-8">
            <img src={option.recipient.avatar} alt={option.recipient.username} className="rounded-full" />
          </Avatar>
          {(option.unreadCount ?? 0) > 0 && (
            <Badge
              value={option.unreadCount && option.unreadCount > 9 ? "9+" : option.unreadCount}
              severity="danger"
              className="absolute -top-1 -right-1"
              style={{ minWidth: "18px", height: "18px", fontSize: "10px" }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{option.recipient.username}</div>
          <div className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{getLastMessage(option)}</div>
        </div>
      </div>
    );
  };

  const onConversationSelect = (e: { value: Conversation }) => {
    onSelect(e.value.key);
    onClose();
  };

  return (
    <ListBox
      value={null}
      options={conversations}
      onChange={onConversationSelect}
      itemTemplate={itemTemplate}
      optionLabel="key"
      className="w-full"
      style={{
        maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text)",
        border: "none"
      }}
    />
  );
}