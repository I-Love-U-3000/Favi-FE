"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { RadioButton } from "primereact/radiobutton";
import Cropper, { Area } from "react-easy-crop";

import storyAPI from "@/lib/api/storyAPI";
import { useAuth } from "@/components/AuthProvider";
import { PrivacyLevel } from "@/types";

interface StoryDialogProps {
  visible: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

const PRIVACY_OPTIONS = [
  { value: PrivacyLevel.Public, label: "Public", description: "Anyone can view" },
  { value: PrivacyLevel.Followers, label: "Followers", description: "Only followers can view" },
  { value: PrivacyLevel.Private, label: "Private", description: "Only you can view" },
];

// Story aspect ratio (9:16 for stories - typical mobile story format)
const STORY_ASPECT = 9 / 16;

const MAX_TARGET_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_DIMENSION = 4000;

/** ------------ Image helpers ------------ */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await createImage(url);
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= MAX_TARGET_BYTES) return file;

  try {
    const img = await loadImage(file);

    const scaleBySize = Math.sqrt(MAX_TARGET_BYTES / file.size);
    const scaleByDim = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const scale = Math.min(scaleBySize, scaleByDim, 1);

    if (!isFinite(scale) || scale >= 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return await new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const next = new File([blob], file.name.replace(/\.[^/.]+$/, "_scaled.jpg"), {
            type: blob.type || "image/jpeg",
          });
          resolve(next);
        },
        "image/jpeg",
        0.92
      );
    });
  } catch {
    return file;
  }
}

/** ------------ Story crop preview ------------ */
async function getCroppedPreviewDataUrl(imageSrc: string, cropPixels: Area, quality = 0.92): Promise<string> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cropPixels.width));
  canvas.height = Math.max(1, Math.round(cropPixels.height));

  const ctx = canvas.getContext("2d");
  if (!ctx) return imageSrc;

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", quality);
}

type Step = 1 | 2;

export default function StoryDialog({
  visible,
  onHide,
  onSuccess,
}: StoryDialogProps) {
  const { requireAuth } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>("");

  // Crop states
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string>("");

  // Privacy
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.Public);

  // UI states
  const [uploading, setUploading] = useState(false);

  // Build preview URL when file changes
  useEffect(() => {
    if (mediaFile) {
      const url = URL.createObjectURL(mediaFile);
      setMediaPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setMediaPreviewUrl("");
      setCroppedPreviewUrl("");
    }
  }, [mediaFile]);

  const resetAll = useCallback(() => {
    setStep(1);
    setMediaFile(null);
    setMediaPreviewUrl("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(null);
    setCroppedPreviewUrl("");
    setPrivacyLevel(PrivacyLevel.Public);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const triggerFilePicker = () => fileInputRef.current?.click();

  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      const processedFile = await compressIfNeeded(file);
      setMediaFile(processedFile);
      setStep(2);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try another file.");
    }
  };

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCropPixels(areaPixels);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!mediaPreviewUrl || !cropPixels) return;
    const dataUrl = await getCroppedPreviewDataUrl(mediaPreviewUrl, cropPixels);
    setCroppedPreviewUrl(dataUrl);
  }, [mediaPreviewUrl, cropPixels]);

  const goBackFromCrop = () => {
    setStep(1);
  };

  const shareStorySafe = async () => {
    if (!requireAuth()) return;
    if (!mediaFile) return;
    if (uploading) return;

    try {
      setUploading(true);

      // Apply crop to get preview before uploading
      await applyCrop();

      // Create story with original file (backend handles storage)
      await storyAPI.create(mediaFile, privacyLevel);

      alert("Story created successfully!");
      resetAll();
      onSuccess?.();
      onHide();
    } catch (e: any) {
      console.error("Error creating story:", e);
      alert(e?.error || e?.message || "Failed to create story");
    } finally {
      setUploading(false);
    }
  };

  const HeaderBar = () => (
    <div className="flex items-center justify-between w-full">
      <style>{`.story-back-btn:hover { background-color: var(--bg) !important; }`}</style>
      <div className="flex items-center gap-2">
        {step === 2 && (
          <button
            type="button"
            className="px-2 py-1 rounded story-back-btn transition-colors"
            style={{ color: 'var(--text)' }}
            onClick={goBackFromCrop}
          >
            ←
          </button>
        )}
        <span className="font-semibold" style={{ color: 'var(--text)' }}>
          {step === 1 ? "Create Story" : "Crop & Edit"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {step === 2 && (
          <Button
            label={uploading ? "Sharing..." : "Share Story"}
            className="p-button-text"
            onClick={shareStorySafe}
            disabled={uploading || !mediaFile}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={() => {
        resetAll();
        onHide();
      }}
      header={<HeaderBar />}
      style={{ width: "95vw", maxWidth: "600px", height: "85vh", maxHeight: "700px" }}
      className="rounded-xl overflow-hidden"
      contentClassName="!p-0"
      headerClassName="!py-2 !px-3 border-b"
    >
      {/* Progress bar */}
      {uploading && (
        <div className="w-full h-1 relative overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
          <div className="absolute top-0 left-0 h-full animate-pulse" style={{ width: "100%", backgroundColor: "var(--primary)" }} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        style={{ display: "none" }}
      />

      {/* STEP 1: pick media */}
      {step === 1 && (
        <div className="h-[calc(85vh-60px)] flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6">
            {!mediaFile ? (
              <div
                className="w-full max-w-xl border-2 border-dashed rounded-xl h-[420px] flex items-center justify-center"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary, #fff)" }}
              >
                <div className="text-center space-y-3" style={{ color: "var(--text-secondary)" }}>
                  <div className="text-xl font-semibold" style={{ color: "var(--text)" }}>
                    Share a moment
                  </div>
                  <div className="text-sm">Add a photo to your story</div>
                  <Button label="Choose Photo" icon="pi pi-plus" onClick={triggerFilePicker} />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl">
                <div className="flex justify-center">
                  <img
                    src={mediaPreviewUrl}
                    alt="Preview"
                    className="max-h-[400px] object-contain rounded-lg"
                  />
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <Button label="Change Photo" icon="pi pi-refresh" onClick={triggerFilePicker} />
                  <Button label="Continue" onClick={() => setStep(2)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: crop and details */}
      {step === 2 && (
        <div className="h-[calc(85vh-60px)] grid grid-cols-1 lg:grid-cols-[1fr_300px]">
          {/* left: crop area */}
          <div className="relative bg-black flex items-center justify-center">
            <div
              className="relative w-full max-w-[360px]"
              style={{
                aspectRatio: STORY_ASPECT,
                height: "min(75vh, 580px)",
              }}
            >
              {mediaPreviewUrl && (
                <Cropper
                  image={mediaPreviewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={STORY_ASPECT}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid={false}
                  objectFit="contain"
                />
              )}
            </div>

            {/* Privacy overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-white text-sm font-semibold mb-2">Privacy</div>
              <div className="flex gap-2 flex-wrap">
                {PRIVACY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrivacyLevel(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      privacyLevel === opt.value
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white border-white/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* right: controls */}
          <div className="border-l p-4 space-y-4">
            <div>
              <div className="text-sm font-semibold mb-2">Zoom</div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold mb-2">Privacy</div>
              <div className="grid grid-cols-1 gap-2">
                {PRIVACY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrivacyLevel(opt.value)}
                    className="border rounded-lg p-3 text-left transition-colors"
                    style={{
                      borderColor: privacyLevel === opt.value ? "var(--primary)" : "var(--border)",
                      backgroundColor:
                        privacyLevel === opt.value
                          ? ("var(--primary-color)" as any)?.replace?.(")", ", 0.1)") || "rgba(59,130,246,0.1)"
                          : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <RadioButton
                        value={opt.value}
                        name="privacyLevel"
                        checked={privacyLevel === opt.value}
                        onChange={() => setPrivacyLevel(opt.value)}
                      />
                      <div>
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {opt.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                label="Remove Photo"
                icon="pi pi-trash"
                className="p-button-text p-button-danger w-full"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreviewUrl("");
                  setStep(1);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
