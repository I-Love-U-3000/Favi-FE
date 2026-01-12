import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";

interface Recipient {
  username: string;
  avatar: string;
  isOnline: boolean;
  lastActiveAt?: string; // 👈 thêm
}

interface ChatHeaderProps {
  recipient: Recipient;
  onBack: () => void;
}

function formatLastActive(lastActiveAt?: string) {
  if (!lastActiveAt) return "";
  const d = new Date(lastActiveAt);

  // Tuỳ bạn: có thể chỉ hiển thị giờ & ngày
  return d.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function ChatHeader({ recipient, onBack }: ChatHeaderProps) {
  return (
    <div className="p-4 bg-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <img
            src={recipient.avatar}
            alt={recipient.username}
            className="rounded-full"
          />
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{recipient.username}</h2>

          <div className="flex items-center gap-2 mt-1">
            <Badge
              value={recipient.isOnline ? "Online" : "Offline"}
              severity={recipient.isOnline ? "success" : "secondary"}
            />
            {!recipient.isOnline && recipient.lastActiveAt && (
              <span className="text-xs text-gray-300">
                Last active: {formatLastActive(recipient.lastActiveAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}