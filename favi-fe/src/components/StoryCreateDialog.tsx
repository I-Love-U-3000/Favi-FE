"use client";

import { useState, useRef, useEffect } from "react";
import storyAPI from "@/lib/api/storyAPI";

interface StoryCreateDialogProps {
  visible: boolean;
  onHide: () => void;
  onStoryCreated: () => void;
}

export default function StoryCreateDialog({
  visible,
  onHide,
  onStoryCreated,
}: StoryCreateDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [privacyLevel, setPrivacyLevel] = useState<number>(0); // 0 = Public
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll and prevent key events when dialog is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onHide();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
      // Reset state when dialog closes
      setSelectedFile(null);
      setPreviewUrl(null);
      setPrivacyLevel(0);
      setError(null);
    }
  }, [visible, onHide]);

  // Create preview URL when file is selected
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/mov", "video/quicktime"];

    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
      setError("Please select an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV)");
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      await storyAPI.create(selectedFile, privacyLevel);
      onStoryCreated();
      onHide();
    } catch (e: any) {
      setError(e?.error || e?.message || "Failed to create story");
    } finally {
      setUploading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onHide}
    >
      <div
        className="relative rounded-2xl w-full max-w-md overflow-hidden glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-white/10 dark:border-white/5">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Create Story
          </h2>
          <button
            onClick={onHide}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <i className="pi pi-times" style={{ color: "var(--text)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-4 space-y-4">
          {/* File preview / upload area */}
          <div
            className="relative aspect-[9/16] rounded-xl overflow-hidden bg-white/5 dark:bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              selectedFile?.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="text-center p-6">
                <i className="pi pi-cloud-upload text-4xl mb-2 opacity-50" style={{ color: "var(--text-secondary)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Click to upload
                </p>
                <p className="text-xs mt-1 opacity-60" style={{ color: "var(--text-secondary)" }}>
                  Image or video
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File info */}
          {selectedFile && (
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <p className="truncate">{selectedFile.name}</p>
              <p className="text-xs opacity-70">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 text-red-500 text-sm flex items-center gap-2">
              <i className="pi pi-exclamation-circle" />
              {error}
            </div>
          )}

          {/* Privacy level selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Privacy
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPrivacyLevel(0)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  privacyLevel === 0
                    ? "bg-sky-500 text-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
                style={{ color: privacyLevel === 0 ? undefined : "var(--text)" }}
              >
                <i className="pi pi-globe mr-1" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setPrivacyLevel(1)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  privacyLevel === 1
                    ? "bg-sky-500 text-white"
                    : "bg-white/5 hover:bg-white/10"
                }`}
                style={{ color: privacyLevel === 1 ? undefined : "var(--text)" }}
              >
                <i className="pi pi-users mr-1" />
                Friends
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onHide}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <i className="pi pi-spin pi-spinner" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="pi pi-send" />
                  Post Story
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
