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

interface EditPostDialogProps {
  visible: boolean;
  onHide: () => void;
  postId: string;
}

const PRIVACY_OPTIONS = [
  { value: PrivacyLevel.Public, label: 'Public', description: 'Anyone can view' },
  { value: PrivacyLevel.Followers, label: 'Followers', description: 'Only followers can view' },
  { value: PrivacyLevel.Private, label: 'Private', description: 'Only you can view' },
];

type Step = 2 | 3;
type AspectKey = 'square' | 'portrait' | 'landscape';

const ASPECTS: Record<AspectKey, number> = {
  square: 1 / 1,
  portrait: 4 / 5,
  landscape: 16 / 9,
};

const MAX_TARGET_BYTES = 50 * 1024 * 1024;
const MAX_DIMENSION = 4000;

/** ------------ Image helpers ------------ */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

async function getCroppedPreviewDataUrl(imageSrc: string, cropPixels: Area, quality = 0.92): Promise<string> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropPixels.width));
  canvas.height = Math.max(1, Math.round(cropPixels.height));

  const ctx = canvas.getContext('2d');
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

async function urlToFile(url: string, filename: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

/** ------------ Component ------------ */
const EditPostDialog: React.FC<EditPostDialogProps> = ({ visible, onHide, postId }) => {
  const { requireAuth } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(3);

  // Existing media from post (URLs and converted to Files)
  const [existingMedia, setExistingMedia] = useState<File[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);

  // New media being added
  const [newMedia, setNewMedia] = useState<File[]>([]);
  const [newMediaPreviewUrls, setNewMediaPreviewUrls] = useState<string[]>([]);

  // Combined media for editing
  const [allMedia, setAllMedia] = useState<File[]>([]);
  const [allMediaPreviewUrls, setAllMediaPreviewUrls] = useState<string[]>([]);

  // Track which media are from existing vs new
  const [mediaIsExisting, setMediaIsExisting] = useState<boolean[]>([]);

  // Crop states
  const [activeIndex, setActiveIndex] = useState(0);
  const [aspectKey, setAspectKey] = useState<AspectKey>('square');
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

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

  // Load post data
  useEffect(() => {
    if (!visible || !postId) return;

    const loadPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const post = await postAPI.getById(postId);

        // Load existing media files
        const mediaUrls = post.medias?.map(m => m.url) || [];
        const files: File[] = await Promise.all(
          mediaUrls.map((url, idx) => urlToFile(url, `image_${idx}.jpg`))
        );

        setExistingMedia(files);
        setExistingMediaUrls(mediaUrls);
        setAllMedia(files);
        setAllMediaPreviewUrls(mediaUrls);
        setMediaIsExisting(mediaUrls.map(() => true));

        setCaption(post.caption || '');
        setTags(post.tags?.map(t => t.name) || []);
        setPrivacyLevel(post.privacyLevel ?? PrivacyLevel.Public);

        if (post.location) {
          setSelectedPlace({
            placeName: post.location.name || '',
            coordinates: [
              post.location.longitude || 0,
              post.location.latitude || 0,
            ],
            fullAddress: post.location.fullAddress || '',
          });
        }

        setLoading(false);
      } catch (e: any) {
        setError(e?.error || e?.message || 'Failed to load post');
        setLoading(false);
      }
    };

    loadPost();
  }, [visible, postId]);

  // Build object URLs for new media
  useEffect(() => {
    const urls = newMedia.map((file) => URL.createObjectURL(file));
    setNewMediaPreviewUrls(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [newMedia]);

  // Update combined media when new media is added
  useEffect(() => {
    const combined = [...existingMedia, ...newMedia];
    const combinedUrls = [...existingMediaUrls, ...newMediaPreviewUrls];
    const combinedIsExisting = [...existingMediaUrls.map(() => true), ...newMedia.map(() => false)];

    setAllMedia(combined);
    setAllMediaPreviewUrls(combinedUrls);
    setMediaIsExisting(combinedIsExisting);
  }, [existingMedia, existingMediaUrls, newMedia, newMediaPreviewUrls]);

  const resetAll = useCallback(() => {
    setStep(3);
    setExistingMedia([]);
    setExistingMediaUrls([]);
    setNewMedia([]);
    setNewMediaPreviewUrls([]);
    setAllMedia([]);
    setAllMediaPreviewUrls([]);
    setMediaIsExisting([]);
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
    setLoading(false);
    setError(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const triggerFilePicker = () => fileInputRef.current?.click();

  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const processed = await processFiles(files);
    if (processed.length === 0) return;

    setNewMedia((prev) => [...prev, ...processed]);
  };

  const removeMediaAt = (idx: number) => {
    const isExisting = mediaIsExisting[idx];

    if (isExisting) {
      // Remove from existing media
      const existingIdx = idx;
      setExistingMedia((prev) => prev.filter((_, i) => i !== existingIdx));
      setExistingMediaUrls((prev) => prev.filter((_, i) => i !== existingIdx));
    } else {
      // Remove from new media (adjust index)
      const newIdx = idx - existingMedia.length;
      setNewMedia((prev) => prev.filter((_, i) => i !== newIdx));
    }

    // Cleanup crop data
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

    setActiveIndex((cur) => {
      const nextCount = allMedia.length - 1;
      if (nextCount <= 0) return 0;
      return Math.min(cur, nextCount - 1);
    });
  };

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCropPixelsByIndex((prev) => ({ ...prev, [activeIndex]: areaPixels }));
  }, [activeIndex]);

  const applyCropForCurrent = useCallback(async () => {
    const src = allMediaPreviewUrls[activeIndex];
    const pixels = cropPixelsByIndex[activeIndex];
    if (!src || !pixels) return;

    const dataUrl = await getCroppedPreviewDataUrl(src, pixels);
    setCroppedPreviewByIndex((prev) => ({ ...prev, [activeIndex]: dataUrl }));
  }, [activeIndex, cropPixelsByIndex, allMediaPreviewUrls]);

  const displayUrls = useMemo(() => {
    return allMedia.map((_, idx) => croppedPreviewByIndex[idx] || allMediaPreviewUrls[idx] || '');
  }, [allMedia, allMediaPreviewUrls, croppedPreviewByIndex]);

  const openLightboxOriginal = (idx: number) => {
    setLightboxActiveIndex(idx);
    setLightboxActive(true);
  };

  const closeLightbox = () => setLightboxActive(false);

  const updatePostSafe = async () => {
    if (!requireAuth()) return;
    if (uploading) return;

    const cleanedTags = (tags || []).map((t) => t.trim()).filter(Boolean);
    const trimmedCaption = caption.trim();

    if (!trimmedCaption && cleanedTags.length === 0 && allMedia.length === 0) {
      alert('Bài viết cần có caption, tag hoặc ít nhất 1 ảnh.');
      return;
    }

    try {
      setUploading(true);

      // Update caption (currently only supported field)
      await postAPI.update(postId, { caption: trimmedCaption || null });

      // Upload new media files
      if (newMedia.length > 0) {
        await postAPI.uploadMedia(postId, newMedia);
      }

      resetAll();
      onHide();
      alert('Bài viết đã được cập nhật!');

      // Refresh the page to show updated content
      window.location.reload();
    } catch (e: any) {
      alert(e?.error || e?.message || 'Cập nhật bài viết thất bại');
    } finally {
      setUploading(false);
    }
  };

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
        <button
          type="button"
          className="px-2 py-1 rounded hover:bg-black/5"
          onClick={() => {
            resetAll();
            onHide();
          }}
        >
          ✕
        </button>
        <span className="font-semibold">Chỉnh sửa bài viết</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          label={uploading ? 'Đang lưu...' : 'Lưu'}
          className="p-button-text"
          onClick={updatePostSafe}
          disabled={uploading}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <Dialog
        visible={visible}
        onHide={onHide}
        style={{ width: '95vw', maxWidth: '980px', height: '90vh' }}
        className="rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-sm opacity-70">Đang tải...</div>
        </div>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog
        visible={visible}
        onHide={onHide}
        style={{ width: '95vw', maxWidth: '980px' }}
        className="rounded-xl overflow-hidden"
      >
        <div className="p-6">
          <div className="text-red-500 text-sm mb-4">{error}</div>
          <Button label="Đóng" onClick={onHide} />
        </div>
      </Dialog>
    );
  }

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

      {/* Details step */}
      {step === 3 && (
        <div className="h-[calc(90vh-60px)] grid grid-cols-1 lg:grid-cols-[1fr_360px]">
          {/* Left preview */}
          <div className="bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-[520px]">
              {allMedia.length > 0 ? (
                <Galleria
                  value={allMedia.map((f, idx) => ({ url: displayUrls[idx], name: f.name }))}
                  numVisible={5}
                  circular
                  showItemNavigators
                  showThumbnails
                  activeIndex={activeIndex}
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
              ) : (
                <div className="w-full flex items-center justify-center text-white/60" style={{ aspectRatio: '1/1' }}>
                  Chưa có ảnh nào
                </div>
              )}

              <div className="mt-3 flex gap-2 justify-end flex-wrap">
                <Button label="Chỉnh crop" className="p-button-outlined" onClick={() => setStep(2)} disabled={allMedia.length === 0} />
                <Button label="Thêm ảnh" icon="pi pi-plus" onClick={triggerFilePicker} />
              </div>

              {/* Media management */}
              {allMedia.length > 0 && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-sm font-semibold mb-2">Quản lý ảnh ({allMedia.length})</div>
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {allMedia.map((f, idx) => (
                      <div key={idx} className="relative group">
                        <button
                          type="button"
                          className="w-full aspect-square rounded-lg overflow-hidden border-2"
                          style={{ borderColor: idx === activeIndex ? 'var(--primary)' : 'transparent' }}
                          onClick={() => setActiveIndex(idx)}
                        >
                          <img src={allMediaPreviewUrls[idx]} alt={f.name} className="w-full h-full object-cover" />
                        </button>
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                          onClick={() => removeMediaAt(idx)}
                        >
                          ✕
                        </button>
                        {mediaIsExisting[idx] && (
                          <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-[10px] px-1 rounded">
                            Cũ
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                      backgroundColor: privacyLevel === opt.value ? 'rgba(59,130,246,0.1)' : 'transparent',
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
                  style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
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
                label={uploading ? 'Đang lưu...' : 'Lưu thay đổi'}
                onClick={updatePostSafe}
                disabled={uploading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Crop step */}
      {step === 2 && (
        <div className="h-[calc(90vh-60px)] grid grid-cols-1 lg:grid-cols-[1fr_280px]">
          <div className="relative bg-black flex items-center justify-center">
            <div
              className="relative w-full max-w-[640px] mx-auto"
              style={{
                aspectRatio: ASPECTS[aspectKey],
                height: 'min(70vh, 520px)',
              }}
            >
              {allMediaPreviewUrls[activeIndex] && (
                <Cropper
                  image={allMediaPreviewUrls[activeIndex]}
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

            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60">
              <div className="flex items-center gap-2 overflow-x-auto">
                {allMedia.map((f, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={async () => {
                      await applyCropForCurrent();
                      setActiveIndex(idx);
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border ${idx === activeIndex ? 'border-white' : 'border-transparent'}`}
                    title={f.name}
                  >
                    <img src={allMediaPreviewUrls[idx]} alt={f.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

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
                      backgroundColor: aspectKey === k ? 'rgba(59,130,246,0.1)' : 'transparent',
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
                disabled={allMedia.length === 0}
              />
              <Button
                label="Hoàn tất"
                className="w-full"
                onClick={async () => {
                  await applyCropForCurrent();
                  setStep(3);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxActive && (
        <Galleria
          value={allMedia.map((file, idx) => ({ url: allMediaPreviewUrls[idx], name: file.name }))}
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

export default EditPostDialog;
