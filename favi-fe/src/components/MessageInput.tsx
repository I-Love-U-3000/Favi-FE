import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useState, useRef, useEffect } from "react";

interface MessageInputProps {
  onSend: (text: string, mediaUrl?: string) => void;
  onSendImage?: (url: string) => void;
  onSendSticker?: (url: string) => void;
}

export default function MessageInput({ onSend, onSendImage, onSendSticker }: MessageInputProps) {
  const [message, setMessage] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log when selectedImage changes
  useEffect(() => {
    console.log('selectedImage state changed:', selectedImage ? {
      fileName: selectedImage.file.name,
      fileSize: selectedImage.file.size,
      previewUrl: selectedImage.previewUrl
    } : null);
  }, [selectedImage]);

  const handleSubmit = async () => {
    if (selectedImage) {
      setIsUploading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/upload-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: (() => {
            const formData = new FormData();
            formData.append('file', selectedImage.file);
            return formData;
          })(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(errorData.message || 'Failed to upload image');
        }

        const data = await response.json();
        const mediaUrl = data.url || data.Url;

        onSend(message, mediaUrl);
        setMessage("");
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsUploading(false);
      }
    } else {
      const trimmed = message.trim();
      if (trimmed) {
        onSend(trimmed);
        setMessage("");
      }
    }
  };

  const handlePick = (url: string) => {
    onSendSticker?.(url);
    setPickerOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('handleImageSelect called', { file, fileName: file?.name, fileType: file?.type, fileSize: file?.size });

    if (!file) {
      console.log('No file selected');
      return;
    }

    // More lenient image type check - also check file extension
    const isImageMimeType = file.type.startsWith('image/');
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isImageMimeType && !hasImageExtension) {
      console.error('Not an image file', { type: file.type, name: file.name });
      alert('Please select an image file');
      // Reset input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('File too large', { size: file.size, maxSize });
      alert('File size must be less than 10MB');
      // Reset input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    console.log('Creating object URL for file');
    const previewUrl = URL.createObjectURL(file);
    console.log('Setting selected image state', { file: file.name, previewUrl });
    setSelectedImage({ file, previewUrl });
  };

  const removeImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Image Preview */}
      {selectedImage && (
        <div className="mb-3 flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border)" }}>
          <img
            src={selectedImage.previewUrl}
            alt="Preview"
            className="h-20 w-20 object-cover rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: "var(--text)" }}>
              {selectedImage.file.name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={removeImage}
            disabled={isUploading}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <span style={{ fontSize: "1.2rem" }}>✕</span>
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex gap-2">
          <label
            className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={handleImageSelect}
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
              if (e.key === "Enter" && !e.shiftKey && (message.trim() || selectedImage)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!message.trim() && !selectedImage}
          aria-label="Send"
          className="p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #10b981 100%)",
            color: "white",
            border: "none",
            boxShadow: (message.trim() || selectedImage)
              ? "0 4px 12px rgba(6, 182, 212, 0.3)"
              : "none",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>{isUploading ? "⏳" : "➤"}</span>
        </button>
      </div>
    </div>
  );
}
