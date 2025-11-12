import { ScrollPanel } from "primereact/scrollpanel";
import MessageItem from "./MessageItem";

interface Message {
  id: number;
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
}

export default function MessageList({ messages, currentUser }: MessageListProps) {
  return (
    <ScrollPanel style={{ height: "calc(100vh - 220px)" }} className="flex-grow">
      <div className="p-4 flex flex-col gap-3">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isSent={message.sender === currentUser}
          />
        ))}
      </div>
    </ScrollPanel>
  );
}
