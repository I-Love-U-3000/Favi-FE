'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

import postAPI from '@/lib/api/postAPI';
import { useAuth } from '@/components/AuthProvider';
import { PrivacyLevel, PostResponse } from '@/types';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Chips } from 'primereact/chips';
import { Galleria } from 'primereact/galleria';
import LocationIQAutoComplete from './LocationIQAutoComplete';

interface SelectedPlace {
  placeName: string;
  coordinates: [number, number]; // [lng, lat]
  fullAddress: string;
}

interface InstagramPostDialogProps {
  visible: boolean;
  onHide: () => void;
}

const PRIVACY_OPTIONS = [
  { value: PrivacyLevel.Public, label: 'Public', description: 'Anyone can view' },
  { value: PrivacyLevel.Followers, label: 'Followers', description: 'Only followers can view' },
  { value: PrivacyLevel.Private, label: 'Private', description: 'Only you can view' },
];

type Step = 1 | 2 | 3;
type AspectKey = 'square' | 'portrait' | 'landscape';

const ASPECTS: Record<AspectKey, number> = {
  square: 1 / 1,
  portrait: 4 / 5,
  landscape: 16 / 9,
};

const MAX_TARGET_BYTES = 50 * 1024 * 1024;
const MAX_DIMENSION = 4000;

/** ------------ Image helpers (preview + compress) ------------ */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/** tạo preview cropped (dataURL) từ ảnh gốc + vùng crop */
async function getCroppedPreviewDataUrl(imageSrc: string, cropPixels: Area, quality = 0.92): Promise<string> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropPixels.width));
  canvas.height = Math.max(1, Math.round(cropPixels.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSrc;

  // draw crop area
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

  return canvas.toDataURL('image/jpeg', quality);
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
        0.9
      );
    });
  } catch {
    return file;
  }
}

async function processFiles(files: FileList | File[]): Promise<File[]> {
  const arr = Array.from(files);
  const processed: File[] = [];
  for (const f of arr) processed.push(await compressIfNeeded(f));
  return processed;
}

/** ------------ Component ------------ */
const InstagramPostDialog: React.FC<InstagramPostDialogProps> = ({ visible, onHide }) => {
  const { requireAuth } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [media, setMedia] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);

  // Crop states
  const [activeIndex, setActiveIndex] = useState(0);
  const [aspectKey, setAspectKey] = useState<AspectKey>('square');
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // per-image cropPixels + croppedPreviewDataUrl
  const [cropPixelsByIndex, setCropPixelsByIndex] = useState<Record<number, Area>>({});
  const [croppedPreviewByIndex, setCroppedPreviewByIndex] = useState<Record<number, string>>({});

  // Post meta
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.Public);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);

  // UI states
  const [uploading, setUploading] = useState(false);
  const [lightboxActive, setLightboxActive] = useState(false);
  const [lightboxActiveIndex, setLightboxActiveIndex] = useState(0);

  // Build object URLs
  useEffect(() => {
    const urls = media.map((file) => URL.createObjectURL(file));
    setMediaPreviewUrls(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [media]);

  const resetAll = useCallback(() => {
    setStep(1);
    setMedia([]);
    setMediaPreviewUrls([]);
    setActiveIndex(0);

    setAspectKey('square');
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    setCropPixelsByIndex({});
    setCroppedPreviewByIndex({});

    setCaption('');
    setTags([]);
    setPrivacyLevel(PrivacyLevel.Public);
    setSelectedPlace(null);

    setLightboxActive(false);
    setLightboxActiveIndex(0);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const triggerFilePicker = () => fileInputRef.current?.click();

  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = await processFiles(files);
    if (newFiles.length === 0) return;

    setMedia((prev) => [...prev, ...newFiles]);
    // chuyển luôn sang crop step kiểu IG
    setStep(2);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newFiles = await processFiles(files);
    if (newFiles.length === 0) return;

    setMedia((prev) => [...prev, ...newFiles]);
    setStep(2);
  };

  const removeMediaAt = (idx: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== idx));

    // cleanup crop data
    setCropPixelsByIndex((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    setCroppedPreviewByIndex((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });

    // adjust active index safely
    setActiveIndex((cur) => {
      const nextCount = media.length - 1;
      if (nextCount <= 0) return 0;
      return Math.min(cur, nextCount - 1);
    });
  };

  // crop callbacks
  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCropPixelsByIndex((prev) => ({ ...prev, [activeIndex]: areaPixels }));
  }, [activeIndex]);

  // apply crop -> generate preview (dataURL) for current image
  const applyCropForCurrent = useCallback(async () => {
    const src = mediaPreviewUrls[activeIndex];
    const pixels = cropPixelsByIndex[activeIndex];
    if (!src || !pixels) return;

    const dataUrl = await getCroppedPreviewDataUrl(src, pixels);
    setCroppedPreviewByIndex((prev) => ({ ...prev, [activeIndex]: dataUrl }));
  }, [activeIndex, cropPixelsByIndex, mediaPreviewUrls]);

  // Lightbox should show ORIGINAL (đúng yêu cầu “nhấn vào xem kích thước gốc”)
  const openLightboxOriginal = (idx: number) => {
    setLightboxActiveIndex(idx);
    setLightboxActive(true);
  };

  const closeLightbox = () => setLightboxActive(false);

  // In details step, show CROPPED preview if exists, else original
  const displayUrls = useMemo(() => {
    return media.map((_, idx) => croppedPreviewByIndex[idx] || mediaPreviewUrls[idx] || '');
  }, [media, mediaPreviewUrls, croppedPreviewByIndex]);

  const goNextFromCrop = async () => {
    // đảm bảo preview của ảnh hiện tại đã có (để UI thấy “đã crop”)
    await applyCropForCurrent();
    setStep(3);
  };

  const goBackFromCrop = () => setStep(1);
  const goBackFromDetails = () => setStep(2);

  const sharePostSafe = async () => {
    if (!requireAuth()) return;
    if (uploading) return;

    const cleanedTags = (tags || []).map((t) => t.trim()).filter(Boolean);
    const trimmedCaption = caption.trim();

    if (!trimmedCaption && cleanedTags.length === 0) {
      alert('Bài viết cần có caption hoặc ít nhất 1 tag.');
      return;
    }

    const location =
      selectedPlace && selectedPlace.coordinates
        ? {
            name: selectedPlace.placeName,
            fullAddress: selectedPlace.fullAddress,
            latitude: selectedPlace.coordinates[1],
            longitude: selectedPlace.coordinates[0],
          }
        : undefined;

    let created: PostResponse | null = null;

    try {
      setUploading(true);

      const form = new FormData();
      form.append('Caption', trimmedCaption);
      cleanedTags.forEach((tag) => form.append('Tags', tag));
      form.append('PrivacyLevel', String(privacyLevel));

      if (location) {
        form.append('Location.Name', location.name);
        if (location.fullAddress) form.append('Location.FullAddress', location.fullAddress);
        if (location.latitude != null) form.append('Location.Latitude', String(location.latitude));
        if (location.longitude != null) form.append('Location.Longitude', String(location.longitude));
      }

      // ✅ gửi ảnh gốc
      media.forEach((file) => form.append('mediaFiles', file));

      // (Tuỳ chọn) nếu sau này bạn muốn backend lưu “crop meta” để render feed giống IG:
      // form.append('CropMeta', JSON.stringify({ aspectKey, cropPixelsByIndex }))
      // -> backend dùng meta để generate thumbnail / store for client crop.
      // Hiện tại bạn muốn chỉ FE preview, thì không cần.

      created = await postAPI.create(form);

      resetAll();
      onHide();
      alert('Bài viết đã được đăng!');
    } catch (e: any) {
      if (created?.id) {
        try { await postAPI.delete(created.id); } catch {}
      }
      alert(e?.error || e?.message || 'Đăng bài thất bại');
    } finally {
      setUploading(false);
    }
  };

  /** ------------ UI templates ------------ */
  const lightboxItemTemplate = (item: { url?: string; name?: string }) => (
    <img
      src={item.url || ''}
      alt={item.name || ''}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );

  const lightboxThumbnailTemplate = (item: { url?: string; name?: string }) => (
    <img
      src={item.url || ''}
      alt={item.name || ''}
      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
    />
  );

  const HeaderBar = () => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {step === 1 ? (
          <span className="font-semibold">Tạo bài đăng</span>
        ) : step === 2 ? (
          <button
            type="button"
            className="px-2 py-1 rounded hover:bg-black/5"
            onClick={goBackFromCrop}
          >
            ←
          </button>
        ) : (
          <button
            type="button"
            className="px-2 py-1 rounded hover:bg-black/5"
            onClick={goBackFromDetails}
          >
            ←
          </button>
        )}
        <span className="font-semibold">
          {step === 1 ? '' : step === 2 ? 'Crop' : 'Chi tiết'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {step === 2 && (
          <>
            <div className="hidden sm:flex gap-1">
              {(['square', 'portrait', 'landscape'] as AspectKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAspectKey(k)}
                  className="px-3 py-1 rounded-full border text-sm"
                  style={{
                    borderColor: aspectKey === k ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: aspectKey === k
                      ? (('var(--primary-color)' as any)?.replace?.(')', ', 0.1)') || 'rgba(59,130,246,0.1)')
                      : 'transparent',
                  }}
                >
                  {k === 'square' ? '1:1' : k === 'portrait' ? '4:5' : '16:9'}
                </button>
              ))}
            </div>

            <Button
              label="Tiếp"
              className="p-button-text"
              onClick={goNextFromCrop}
              disabled={media.length === 0}
            />
          </>
        )}

        {step === 3 && (
          <Button
            label={uploading ? 'Đang đăng...' : 'Chia sẻ'}
            className="p-button-text"
            onClick={sharePostSafe}
            disabled={uploading}
          />
        )}

        {step === 1 && (
          <Button
            label="Tiếp"
            className="p-button-text"
            onClick={() => media.length > 0 ? setStep(2) : null}
            disabled={media.length === 0}
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
      style={{ width: '95vw', maxWidth: '980px', height: '90vh', maxHeight: '820px' }}
      className="rounded-xl overflow-hidden"
      contentClassName="!p-0"
      headerClassName="!py-2 !px-3 border-b"
    >
      {/* progress bar */}
      {uploading && (
        <div className="w-full h-1 relative overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
          <div className="absolute top-0 left-0 h-full animate-pulse" style={{ width: '100%', backgroundColor: 'var(--primary)' }} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileSelect}
        style={{ display: 'none' }}
      />

      {/* STEP 1: pick media */}
      {step === 1 && (
        <div className="h-[calc(90vh-60px)] flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6">
            {media.length === 0 ? (
              <div
                className="w-full max-w-xl border-2 border-dashed rounded-xl h-[420px] flex items-center justify-center"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary, #fff)' }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="text-center space-y-3" style={{ color: 'var(--text-secondary)' }}>
                  <div className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                    Kéo thả ảnh vào đây
                  </div>
                  <div className="text-sm">Hoặc chọn từ máy</div>
                  <Button label="Chọn ảnh" icon="pi pi-plus" onClick={triggerFilePicker} />
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl">
                <div className="grid grid-cols-3 gap-2">
                  {media.map((f, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="relative group border rounded-lg overflow-hidden"
                      onClick={() => {
                        setActiveIndex(idx);
                        setStep(2);
                      }}
                    >
                      <img src={mediaPreviewUrls[idx]} alt={f.name} className="w-full h-32 object-cover" />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">Edit</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <Button label="Thêm ảnh" icon="pi pi-plus" onClick={triggerFilePicker} />
                  <Button label="Bỏ hết" icon="pi pi-trash" className="p-button-danger p-button-text" onClick={() => setMedia([])} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: crop */}
      {step === 2 && (
        <div className="h-[calc(90vh-60px)] grid grid-cols-1 lg:grid-cols-[1fr_280px]">
          {/* left: crop area */}
          <div className="relative bg-black flex items-center justify-center">
            {/* fixed “IG-like” crop frame */}
            <div
              className="relative w-full max-w-[640px] mx-auto"
              style={{
                aspectRatio: ASPECTS[aspectKey],
                height: 'min(70vh, 520px)',
              }}
            >
              {mediaPreviewUrls[activeIndex] && (
                <Cropper
                  image={mediaPreviewUrls[activeIndex]}
                  crop={crop}
                  zoom={zoom}
                  aspect={ASPECTS[aspectKey]}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid={false}
                  objectFit="contain"
                />
              )}
            </div>

            {/* bottom thumbnails strip */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60">
              <div className="flex items-center gap-2 overflow-x-auto">
                {media.map((f, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={async () => {
                      // lưu crop preview cho ảnh hiện tại trước khi chuyển
                      await applyCropForCurrent();
                      setActiveIndex(idx);
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border ${idx === activeIndex ? 'border-white' : 'border-transparent'}`}
                    title={f.name}
                  >
                    <img src={mediaPreviewUrls[idx]} alt={f.name} className="w-full h-full object-cover" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={triggerFilePicker}
                  className="w-16 h-16 rounded-lg border border-dashed border-white/40 text-white flex items-center justify-center flex-shrink-0"
                  title="Thêm ảnh"
                >
                  +
                </button>
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
              <div className="text-sm font-semibold">Tỷ lệ</div>
              <div className="flex gap-2 flex-wrap">
                {(['square', 'portrait', 'landscape'] as AspectKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAspectKey(k)}
                    className="px-3 py-1 rounded-full border text-sm"
                    style={{
                      borderColor: aspectKey === k ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: aspectKey === k
                        ? (('var(--primary-color)' as any)?.replace?.(')', ', 0.1)') || 'rgba(59,130,246,0.1)')
                        : 'transparent',
                    }}
                  >
                    {k === 'square' ? '1:1' : k === 'portrait' ? '4:5' : '16:9'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                label="Xoá ảnh này"
                icon="pi pi-trash"
                className="p-button-text p-button-danger w-full"
                onClick={() => removeMediaAt(activeIndex)}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: details */}
      {step === 3 && (
        <div className="h-[calc(90vh-60px)] grid grid-cols-1 lg:grid-cols-[1fr_360px]">
          {/* Left preview like IG */}
          <div className="bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-[520px]">
              <Galleria
                value={media.map((f, idx) => ({ url: displayUrls[idx], name: f.name }))}
                numVisible={5}
                circular
                showItemNavigators
                showThumbnails
                item={(item) => (
                  <div className="w-full flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                    <img
                      src={item.url || ''}
                      alt={item.name || ''}
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => openLightboxOriginal(displayUrls.indexOf(item.url || '') >= 0 ? displayUrls.indexOf(item.url || '') : 0)}
                    />
                  </div>
                )}
                thumbnail={(item) => (
                  <img
                    src={item.url || ''}
                    alt={item.name || ''}
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                )}
                style={{ width: '100%' }}
              />

              <div className="mt-3 flex gap-2 justify-end">
                <Button label="Chỉnh crop" className="p-button-outlined" onClick={() => setStep(2)} />
                <Button label="Thêm ảnh" icon="pi pi-plus" onClick={triggerFilePicker} />
              </div>
            </div>
          </div>

          {/* Right meta form */}
          <div className="border-l p-4 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-sm font-semibold mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viết caption..."
                className="w-full p-3 border rounded-lg"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--text)',
                }}
                maxLength={2200}
                rows={4}
              />
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {caption.length}/2200
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Tags</label>
              <Chips
                value={tags}
                onChange={(e) => setTags((e.value || []).filter((t: string) => t.trim() !== ''))}
                separator=","
                placeholder="Nhập tag, bấm Enter hoặc dấu ,"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Privacy</label>
              <div className="grid grid-cols-1 gap-2">
                {PRIVACY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrivacyLevel(opt.value)}
                    className="border rounded-lg p-3 text-left transition-colors"
                    style={{
                      borderColor: privacyLevel === opt.value ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: privacyLevel === opt.value
                        ? (('var(--primary-color)' as any)?.replace?.(')', ', 0.1)') || 'rgba(59,130,246,0.1)')
                        : 'transparent',
                    }}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Vị trí</label>
              <LocationIQAutoComplete
                apiKey={process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || ''}
                onSelect={(place) => setSelectedPlace(place)}
                placeholder="Nhập địa chỉ..."
                className="mb-2"
              />
              {selectedPlace && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: (('var(--primary-color)' as any)?.replace?.(')', ', 0.1)') || 'rgba(59,130,246,0.1)') }}
                >
                  <div className="font-semibold">{selectedPlace.placeName}</div>
                  <div className="mt-1">
                    <span className="font-semibold">Tọa độ:</span> {selectedPlace.coordinates.join(', ')}
                  </div>
                  <div className="mt-1">
                    <a
                      href={`https://www.google.com/maps?q=${selectedPlace.coordinates[1]},${selectedPlace.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      {selectedPlace.fullAddress}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                label="Huỷ"
                className="p-button-text"
                onClick={() => {
                  resetAll();
                  onHide();
                }}
              />
              <span className="flex-1" />
              <Button
                label={uploading ? 'Đang đăng...' : 'Chia sẻ'}
                onClick={sharePostSafe}
                disabled={uploading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lightbox: ALWAYS ORIGINAL */}
      {lightboxActive && (
        <Galleria
          value={media.map((file, idx) => ({ url: mediaPreviewUrls[idx], name: file.name }))}
          activeIndex={lightboxActiveIndex}
          fullScreen
          showItemNavigators
          showThumbnails
          item={lightboxItemTemplate}
          thumbnail={lightboxThumbnailTemplate}
          onHide={closeLightbox}
          style={{ background: 'rgba(0,0,0,0.9)' }}
        />
      )}
    </Dialog>
  );
};

export default InstagramPostDialog;