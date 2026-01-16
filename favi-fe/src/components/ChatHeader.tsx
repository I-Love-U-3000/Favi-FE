import { Badge } from "primereact/badge";
import { Phone, Video } from "lucide-react";

interface Recipient {
  username: string;
  avatar: string;
  isOnline: boolean;
  lastActiveAt?: string;
}

interface ChatHeaderProps {
  recipient: Recipient;
  onBack: () => void;
  onInfoClick: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

function formatLastActive(lastActiveAt?: string) {
  if (!lastActiveAt) return "";
  const d = new Date(lastActiveAt);

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Active ${diffMins}m ago`;
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  if (diffDays < 7) return `Active ${diffDays}d ago`;

  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export default function ChatHeader({ recipient, onBack, onInfoClick, onVoiceCall, onVideoCall }: ChatHeaderProps) {
  return (
    <div
      className="px-6 py-4 flex items-center gap-4"
      style={{
        background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="relative flex-shrink-0">
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: "48px",
            height: "48px",
            border: "2px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <img
            src={recipient.avatar}
            alt={recipient.username}
            className="w-full h-full object-cover"
          />
        </div>
        {recipient.isOnline && (
          <div
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: "#10b981",
              borderColor: "var(--bg-secondary)",
            }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2
          className="font-bold text-xl truncate"
          style={{ color: "var(--text)" }}
        >
          {recipient.username}
        </h2>

        <div className="flex items-center gap-2 mt-1">
          {recipient.isOnline ? (
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#10b981" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "#10b981" }}
              >
                Online
              </span>
            </div>
          ) : (
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {recipient.lastActiveAt
                ? formatLastActive(recipient.lastActiveAt)
                : "Offline"}
            </span>
          )}
        </div>
      </div>

      {/* Call buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Voice call button */}
        {onVoiceCall && (
          <button
            onClick={onVoiceCall}
            className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            aria-label="Voice call"
          >
            <Phone className="w-5 h-5" strokeWidth={2} />
          </button>
        )}

        {/* Video call button */}
        {onVideoCall && (
          <button
            onClick={onVideoCall}
            className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            aria-label="Video call"
          >
            <Video className="w-5 h-5" strokeWidth={2} />
          </button>
        )}

        {/* Info button */}
        <button
        onClick={onInfoClick}
        className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
        aria-label="View shared media"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      </div>
    </div>
  );
}