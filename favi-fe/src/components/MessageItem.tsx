interface Message {
  id: number;
  sender: string;
  text?: string;
  timestamp: string;
  imageUrl?: string;
  stickerUrl?: string; // gif/sticker
}

interface MessageItemProps {
  message: Message;
  isSent: boolean;
}

export default function MessageItem({ message, isSent }: MessageItemProps) {
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
        <div className="text-xs text-gray-400 mt-1">{message.timestamp}</div>
      </div>
    </div>
  );
}
