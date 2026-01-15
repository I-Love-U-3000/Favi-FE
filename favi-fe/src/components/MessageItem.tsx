interface Message {
  id: number;
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string;
  readBy?: string[];
}

interface MessageItemProps {
  message: Message;
  isSent: boolean;
  recipientId?: string;
  currentUserId?: string;
  onImageClick?: (imageUrl: string) => void;
}

export default function MessageItem({ message, isSent, recipientId, currentUserId, onImageClick }: MessageItemProps) {
  const isRead = isSent && message.readBy && message.readBy.length > 0 && recipientId && message.readBy.includes(recipientId);

  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[75%] rounded-2xl p-3 transition-all duration-200"
        style={{
          backgroundColor: isSent
            ? "#06b6d4"
            : "var(--bg-primary)",
          border: isSent ? "none" : "1px solid var(--border)",
          color: isSent ? "white" : "var(--text)",
        }}
      >
        {message.text && (
          <p className="break-words leading-relaxed">{message.text}</p>
        )}
        {message.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.imageUrl}
            alt="attachment"
            className="mt-2 max-h-80 rounded-xl object-contain cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onImageClick?.(message.imageUrl!)}
          />
        )}
        {message.stickerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.stickerUrl}
            alt="sticker"
            className="mt-2 h-28 w-28 object-contain rounded-lg"
          />
        )}
        <div
          className={`text-xs mt-2 flex items-center gap-2 ${
            isSent ? "justify-end" : "justify-start"
          }`}
          style={{ color: isSent ? "rgba(255,255,255,0.9)" : "var(--text-secondary)" }}
        >
          <span>{message.timestamp}</span>
          {isSent && (
            <span className="flex items-center" style={{ color: isRead ? "#ffffff" : "rgba(255,255,255,0.5)" }}>
              {isRead ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 7 17l-5-5" />
                  <path d="m22 10-7.5 7.5L13 16" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 7 17l-5-5" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
