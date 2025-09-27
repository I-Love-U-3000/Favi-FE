
"use client";

import { ListBox } from "primereact/listbox";
import { Avatar } from "primereact/avatar";

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
    return conv.messages.length > 0
      ? conv.messages[conv.messages.length - 1].text
      : "No messages yet";
  };

  const itemTemplate = (option: Conversation) => {
    const [, toId] = option.key.split("-");
    return (
      <div
        className="flex items-center gap-2 p-2 hover:bg-gray-600 rounded transition-colors cursor-pointer"
        onClick={() => onSelect(toId)}
        suppressHydrationWarning
      >
        <Avatar className="h-8 w-8">
          <img src={option.recipient.avatar} alt={option.recipient.username} className="rounded-full" />
        </Avatar>
        <div>
          <div className="font-semibold">{option.recipient.username}</div>
          <div className="text-xs text-gray-400">{getLastMessage(option)}</div>
        </div>
      </div>
    );
  };

  const onConversationSelect = (e: { value: Conversation }) => {
    const [, toId] = e.value.key.split("-");
    onSelect(toId);
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
      style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}
    />
  );
}