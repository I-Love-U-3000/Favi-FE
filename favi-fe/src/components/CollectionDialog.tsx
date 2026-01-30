"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { RadioButton } from "primereact/radiobutton";
import { useTranslations } from "next-intl";

import collectionAPI from "@/lib/api/collectionAPI";
import { useAuth } from "@/components/AuthProvider";
import { PrivacyLevel, CollectionResponse } from "@/types";

/* ==================== Image compression helpers ==================== */
const MAX_TARGET_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_DIMENSION = 4000;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= MAX_TARGET_BYTES) return file;

  try {
    const img = await loadImage(file);

    // Scale down if too large
    const scaleBySize = Math.sqrt(MAX_TARGET_BYTES / file.size);
    const scaleByDim = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const scale = Math.min(scaleBySize, scaleByDim, 1);

    if (!isFinite(scale) || scale >= 1) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return await new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const next = new File([blob], file.name.replace(/\.[^/.]+$/, '_scaled.jpg'), {
            type: blob.type || 'image/jpeg',
          });
          resolve(next);
        },
        'image/jpeg',
        0.92
      );
    });
  } catch (e) {
    console.error('Image compression failed:', e);
    return file;
  }
}

interface CollectionDialogProps {
  visible: boolean;
  onHide: () => void;
  collection?: CollectionResponse | null;
  onSuccess?: () => void;
}

const PRIVACY_OPTIONS = [
  { value: PrivacyLevel.Public, labelKey: "Public", descriptionKey: "PublicDescription" },
  { value: PrivacyLevel.Followers, labelKey: "Followers", descriptionKey: "FollowersDescription" },
  { value: PrivacyLevel.Private, labelKey: "Private", descriptionKey: "PrivateDescription" },
];

const DEFAULT_COVER_IMAGE = "https://via.placeholder.com/800x400/6366f1/ffffff?text=Collection+Cover";

export default function CollectionDialog({
  visible,
  onHide,
  collection,
  onSuccess,
}: CollectionDialogProps) {
  const { user } = useAuth();
  const t = useTranslations("CollectionDialog");
  const isEditMode = !!collection;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState(PrivacyLevel.Public);
  const [coverImageUrl, setCoverImageUrl] = useState(DEFAULT_COVER_IMAGE);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      if (collection) {
        setTitle(collection.title || "");
        setDescription(collection.description || "");
        setPrivacyLevel(collection.privacyLevel ?? PrivacyLevel.Public);
        setCoverImageUrl(collection.coverImageUrl || DEFAULT_COVER_IMAGE);
        setCoverImageFile(null);
      } else {
        setTitle("");
        setDescription("");
        setPrivacyLevel(PrivacyLevel.Public);
        setCoverImageUrl(DEFAULT_COVER_IMAGE);
        setCoverImageFile(null);
      }
    }
  }, [visible, collection]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPrivacyLevel(PrivacyLevel.Public);
    setCoverImageUrl(DEFAULT_COVER_IMAGE);
    setCoverImageFile(null);
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleHide = () => {
    reset();
    onHide();
  };

  const save = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    if (!user?.id) {
      alert("User not authenticated");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        privacyLevel,
        coverImage: coverImageFile,
      };

      if (isEditMode && collection) {
        await collectionAPI.update(collection.id, payload);
        alert("Collection updated successfully!");
      } else {
        await collectionAPI.create(payload);
        alert("Collection created successfully!");
      }

      reset();
      onSuccess?.();
      onHide();
    } catch (error: any) {
      console.error("Error saving collection:", error);
      alert(error?.error || error?.message || "Failed to save collection");
    } finally {
      setLoading(false);
    }
  };

  const pickFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Validate file type
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      // Compress image if needed (same algorithm as post upload)
      const processedFile = await compressIfNeeded(f);

      // Show compression info if file was compressed
      if (processedFile.size < f.size) {
        const originalMB = (f.size / (1024 * 1024)).toFixed(2);
        const compressedMB = (processedFile.size / (1024 * 1024)).toFixed(2);
        console.log(`Image compressed: ${originalMB}MB → ${compressedMB}MB`);
      }

      setCoverImageFile(processedFile);
      const url = URL.createObjectURL(processedFile);
      setCoverImageUrl(url);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try another file.");
    }
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImageUrl(DEFAULT_COVER_IMAGE);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog
      header={isEditMode ? t("EditTitle") : t("CreateTitle")}
      visible={visible}
      onHide={handleHide}
      style={{ width: 640, maxWidth: "95vw" }}
      className="rounded-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button label={t("Cancel")} className="p-button-text" onClick={handleHide} disabled={loading} />
          <Button label={loading ? t("Saving") : isEditMode ? t("Update") : t("Create")} onClick={save} disabled={loading || !title.trim()} />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Cover Image Preview */}
        <div>
          <div className="text-sm mb-2 font-semibold">{t("CoverImage")}</div>
          <div className="relative">
            <div
              className="w-full h-32 rounded-lg bg-cover bg-center flex items-center justify-center"
              style={{
                backgroundImage: `url(${coverImageUrl})`,
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              {coverImageUrl === DEFAULT_COVER_IMAGE && (
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("NoCoverImage")}</span>
              )}
            </div>
            {coverImageFile && (
              <button
                type="button"
                onClick={removeCoverImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Remove cover image"
              >
                <i className="pi pi-times text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <div className="text-sm mb-2 font-semibold">{t("UploadCoverImage")}</div>
          <div className="flex gap-2">
            <Button label={t("ChooseFile")} icon="pi pi-image" onClick={pickFile} outlined />
            {coverImageFile && (
              <span className="text-sm flex items-center" style={{ color: "var(--text-secondary)" }}>
                {coverImageFile.name}
              </span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>

        {/* Title */}
        <div>
          <div className="text-sm mb-2 font-semibold">
            {t("Title")} <span className="text-red-500">*</span>
          </div>
          <InputText
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
            placeholder="e.g. Minimalist Interiors"
            maxLength={100}
          />
          <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            {title.length}/100
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="text-sm mb-2 font-semibold">{t("Description")}</div>
          <InputTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full"
            placeholder="Describe your collection..."
            maxLength={500}
          />
          <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            {description.length}/500
          </div>
        </div>

        {/* Privacy Level */}
        <div>
          <div className="text-sm mb-2 font-semibold">{t("Privacy")}</div>
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
                    <div className="font-semibold">{t(opt.labelKey)}</div>
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {t(opt.descriptionKey)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

