import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useState } from "react";

interface MessageInputProps {
  onSend: (text: string) => void;
  onSendImage?: (url: string) => void;
  onSendSticker?: (url: string) => void;
}

export default function MessageInput({ onSend, onSendImage, onSendSticker }: MessageInputProps) {
  const [message, setMessage] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSubmit = () => {
    onSend(message);
    setMessage("");
  };

  const handlePick = (url: string) => {
    onSendSticker?.(url);
    setPickerOpen(false);
  };

  return (
    <div
      className="p-4 flex items-end gap-3"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex gap-2">
        <label
          className="p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          title="Send image"
          style={{
            border: "1px solid var(--border)",
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>📷</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = URL.createObjectURL(f);
              onSendImage?.(url);
            }}
          />
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="Sticker/GIF"
            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text)",
              backgroundColor: "var(--bg-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>😊</span>
          </button>
          {pickerOpen && (
            <div
              className="absolute bottom-14 left-0 z-20 rounded-xl p-3 grid grid-cols-5 gap-2 shadow-lg"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {[
                "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
                "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
                "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
                "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif",
                "https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif",
              ].map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={u}
                  src={u}
                  alt="gif"
                  className="h-14 w-14 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform duration-200"
                  onClick={() => handlePick(u)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <InputText
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full py-3 px-4 rounded-xl"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && message.trim()) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!message.trim()}
        aria-label="Send"
        className="p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #10b981 100%)",
          color: "white",
          border: "none",
          boxShadow: message.trim()
            ? "0 4px 12px rgba(6, 182, 212, 0.3)"
            : "none",
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>➤</span>
      </button>
    </div>
  );
}
