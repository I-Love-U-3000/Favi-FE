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
    <div className="p-3 flex items-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
      <label className="p-2 rounded-lg cursor-pointer" title="Send image" style={{ border: '1px solid var(--border)' }}>
        <i className="pi pi-image" />
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
        <Button icon="pi pi-smile" className="p-button-text" onClick={() => setPickerOpen((v) => !v)} aria-label="Sticker/GIF" />
        {pickerOpen && (
          <div className="absolute bottom-10 left-0 z-20 rounded-xl p-2 grid grid-cols-5 gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            {['https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif','https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif','https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif','https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif','https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif'].map((u)=> (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="gif" className="h-12 w-12 object-cover rounded cursor-pointer" onClick={()=>handlePick(u)} />
            ))}
          </div>
        )}
      </div>
      <InputText
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
      />
      <Button
        icon="pi pi-send"
        className="p-button-sm p-button-info"
        onClick={handleSubmit}
        disabled={!message.trim()}
        aria-label="Send"
      />
    </div>
  );
}
