import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useState } from "react";

interface MessageInputProps {
  onSend: (text: string) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState<string>("");

  const handleSubmit = () => {
    onSend(message);
    setMessage("");
  };

  return (
    <div className="p-4 bg-gray-800 flex items-center gap-2">
      <InputText
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 p-inputtext-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        style={{
          borderRadius: "0.375rem",
        }}
      />
      <Button
        icon="pi pi-send"
        className="p-button-sm p-button-info hover:bg-blue-600 transition-colors"
        onClick={handleSubmit}
        disabled={!message.trim()}
        aria-label="Send"
      />
    </div>
  );
}