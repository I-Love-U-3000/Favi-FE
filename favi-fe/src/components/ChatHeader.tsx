import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";

interface Recipient {
  username: string;
  avatar: string;
  isOnline: boolean;
}

interface ChatHeaderProps {
  recipient: Recipient;
  onBack: () => void;
}

export default function ChatHeader({ recipient, onBack }: ChatHeaderProps) {
  return (
    <div className="p-4 bg-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          icon="pi pi-arrow-left"
          className="p-button-rounded p-button-text text-white"
          onClick={onBack}
          aria-label="Back"
        />
        <Avatar className="h-10 w-10">
          <img
            src={recipient.avatar}
            alt={recipient.username}
            className="rounded-full"
          />
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{recipient.username}</h2>
          <Badge
            value={recipient.isOnline ? "Online" : "Offline"}
            severity={recipient.isOnline ? "success" : "secondary"}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}