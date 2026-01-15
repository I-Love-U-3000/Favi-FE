"use client";

import { useEffect, useState } from "react";
import ImageViewer from "./ImageViewer";

interface MediaGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
}

export default function MediaGallery({
  isOpen,
  onClose,
  images,
}: MediaGalleryProps) {
  const [viewingImageUrl, setViewingImageUrl] = useState<string>("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  // Prevent body scroll when gallery is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !imageViewerOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, imageViewerOpen]);

  const handleImageClick = (imageUrl: string) => {
    setViewingImageUrl(imageUrl);
    setImageViewerOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            className="font-bold text-xl"
            style={{ color: "var(--text)" }}
          >
            Shared Media ({images.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            aria-label="Close"
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Images grid */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ backgroundColor: "var(--bg)" }}
        >
          {images.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                No shared images yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {images.map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
                  style={{
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => handleImageClick(imageUrl)}
                >
                  <img
                    src={imageUrl}
                    alt={`Shared image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      {imageViewerOpen && (
        <ImageViewer
          imageUrl={viewingImageUrl}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </>
  );
}
