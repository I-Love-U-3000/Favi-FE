interface Message {
  id: number;
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string; // gif/sticker
  readBy?: string[]; // Array of profile IDs who have read this message
}

interface MessageItemProps {
  message: Message;
  isSent: boolean;
  recipientId?: string; // The recipient's profile ID (for DMs)
  currentUserId?: string; // Current user's ID
}

export default function MessageItem({ message, isSent, recipientId, currentUserId }: MessageItemProps) {
  // Determine if message has been read
  const isRead = isSent && message.readBy && message.readBy.length > 0 && recipientId && message.readBy.includes(recipientId);

  return (
    <div
      className={`flex ${isSent ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[70%] p-3 rounded-lg ${
          isSent
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-700 text-white hover:bg-gray-600"
        } transition-colors`}
      >
        {message.text && <p className="break-words">{message.text}</p>}
        {message.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.imageUrl} alt="attachment" className="mt-1 max-h-64 rounded-lg object-contain" />
        )}
        {message.stickerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.stickerUrl} alt="sticker" className="mt-1 h-24 w-24 object-contain" />
        )}
        <div className={`text-xs text-gray-400 mt-1 flex items-center gap-1 ${isSent ? "justify-end" : "justify-start"}`}>
          <span>{message.timestamp}</span>
          {isSent && (
            <span className={isRead ? "text-blue-200" : "text-gray-400"}>
              {isRead ? (
                // Double checkmark for read (blue)
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 7 17l-5-5" />
                  <path d="m22 10-7.5 7.5L13 16" />
                </svg>
              ) : (
                // Single checkmark for sent (gray)
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
