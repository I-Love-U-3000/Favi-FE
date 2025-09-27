interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
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
        <p className="break-words">{message.text}</p>
        <div className="text-xs text-gray-400 mt-1">{message.timestamp}</div>
      </div>
    </div>
  );
}