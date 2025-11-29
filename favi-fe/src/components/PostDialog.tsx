import { useState, useEffect, useRef } from 'react';
import postAPI from "@/lib/api/postAPI";
import { useAuth } from "@/components/AuthProvider";
import { PrivacyLevel } from "@/types";
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Galleria } from 'primereact/galleria';
import { Chips } from 'primereact/chips';
import LocationIQAutoComplete from './LocationIQAutoComplete';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

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

const InstagramPostDialog: React.FC<InstagramPostDialogProps> = ({ visible, onHide }) => {
  const { requireAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [media, setMedia] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewAspect, setPreviewAspect] = useState<"original" | "square" | "portrait" | "landscape">("original");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.Public);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_TARGET_BYTES = 50 * 1024 * 1024;
  const MAX_DIMENSION = 4000;


  useEffect(() => {
    const urls = media.map((file) => URL.createObjectURL(file));
    setMediaPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [media]);

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      image.src = url;
    });
  };

  const compressIfNeeded = async (file: File): Promise<File> => {
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
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          const next = new File([blob], file.name.replace(/\.[^/.]+$/, '_scaled.jpg'), { type: blob.type || 'image/jpeg' });
          resolve(next);
        }, file.type || 'image/jpeg', 0.9);
      });
    } catch {
      return file;
    }
  };

  const processFiles = async (files: FileList | File[]): Promise<File[]> => {
    const arr = Array.from(files);
    const processed: File[] = [];
    for (const file of arr) {
      processed.push(await compressIfNeeded(file));
    }
    return processed;
  };

  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = await processFiles(files);
      if (newFiles.length > 0) {
        setMedia((prev) => [...prev, ...newFiles]);
        setStep(2);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = await processFiles(files);
      if (newFiles.length > 0) {
        setMedia((prev) => [...prev, ...newFiles]);
        setStep(2);
      }
    }
  };
  const aspectRatio =
    previewAspect === "original"
      ? undefined
      : previewAspect === "square"
      ? '1 / 1'
      : previewAspect === "portrait"
      ? '4 / 5'
      : '16 / 9';


  const handleNext = () => {
    if (media.length > 0) setStep(2);
  };


  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const removeMediaAt = (idx: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const sharePostSafe = async () => {
    if (!requireAuth()) return;
    if (uploading) return;
    const location =
      selectedPlace && selectedPlace.coordinates
        ? {
            name: selectedPlace.placeName,
            fullAddress: selectedPlace.fullAddress,
            latitude: selectedPlace.coordinates[1],
            longitude: selectedPlace.coordinates[0],
          }
        : undefined;
    let created: { id: string } | null = null;
    try {
      setUploading(true);
      created = await postAPI.create({ caption, tags, privacyLevel, location });
      if (media.length > 0) {
        await postAPI.uploadMedia(created.id, media);
      }
      setStep(1);
      setMedia([]);
      setCaption('');
      setTags([]);
      setPrivacyLevel(PrivacyLevel.Public);
      setSelectedPlace(null);
      setPreviewAspect('original');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onHide();
      alert('Bai viet da duoc dang!');
    } catch (e: any) {
      if (created?.id) {
        try { await postAPI.delete(created.id); } catch {}
      }
      alert(e?.error || e?.message || 'Dang bai that bai');
    } finally {
      setUploading(false);
    }
  };

  const handleDiscard = () => {
    setStep(1);
    setMedia([]);
    setCaption('');
    setTags([]);
    setPrivacyLevel(PrivacyLevel.Public);
    setSelectedPlace(null);
    setPreviewAspect('original');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderFooter = () => (
    <div className="!py-2 !px-3 flex justify-end gap-2">
      {step === 1 && (
        <>
          <Button
            label="Discard"
            icon="pi pi-trash"
            onClick={handleDiscard}
            className="p-button-text p-button-danger"
          />
          <Button
            label="Tiep theo"
            icon="pi pi-arrow-right"
            onClick={handleNext}
            disabled={media.length === 0}
            className="p-button-raised p-button-info"
          />
        </>
      )}
      {step === 2 && (
        <>
          <Button
            label="Quay lai"
            icon="pi pi-arrow-left"
            onClick={() => setStep(1)}
            className="p-button-text p-button-secondary"
          />
          <Button
            label="Chia se"
            icon="pi pi-check"
            onClick={sharePostSafe}
            disabled={uploading}
            className="p-button-raised p-button-success"
          />
        </>
      )}
    </div>
  );

  const galleriaItemTemplate = (item: { url?: string; name?: string }) => (
    <img
      src={item.url || ''}
      alt={item.name || ''}
      style={{ maxHeight: '400px', maxWidth: '700px', width: '100%', height: 'auto', objectFit: 'contain' }}
    />
  );

  const galleriaThumbnailTemplate = (item: { url?: string; name?: string }) => (
    <img
      src={item.url || ''}
      alt={item.name || ''}
      style={{ maxWidth: '100px', maxHeight: '100px', width: '100%', height: 'auto', objectFit: 'contain' }}
    />
  );

  return (
    <Dialog
      header="Tao bai dang"
      visible={visible}
      onHide={() => {
        setStep(1);
        setMedia([]);
        setCaption('');
        setTags([]);
        setPrivacyLevel(PrivacyLevel.Public);
        setSelectedPlace(null);
        setPreviewAspect('original');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onHide();
      }}
      style={{ width: '90vw', maxWidth: '1000px', height: '90vh', maxHeight: '800px' }}
      footer={renderFooter()}
      className="rounded-lg sm:w-full sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] share-sheet"
      headerClassName="!py-2 !px-3 text-lg"
      contentClassName="!p-4"
      pt={{
        header: { style: { padding: '0.5rem 1rem', minHeight: '40px' } },
        footer: { style: { padding: '0.25rem 0.75rem', minHeight: '40px' } },
      }}
    >
      {uploading && (
        <div className="w-full bg-gray-200 h-2 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 animate-pulse"
            style={{ width: '100%', transition: 'width 2s linear' }}
          />
        </div>
      )}
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={onFileSelect}
        style={{ display: 'none' }}
        aria-label="Upload images"
        key={step} // Force re-render after step change to reset selection
      />
      {step === 1 && (
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2">
              <Button label="Chon anh" icon="pi pi-plus" onClick={triggerFilePicker} />
              <Button label="Tiep theo" icon="pi pi-arrow-right" onClick={handleNext} disabled={media.length === 0} />
            </div>
            <div className="flex gap-2 text-xs">
              {["original", "square", "portrait", "landscape"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPreviewAspect(k as any)}
                  className={`px-3 py-1 rounded-full border ${previewAspect === k ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {k === 'original' ? 'Original' : k === 'square' ? 'Square' : k === 'portrait' ? 'Portrait' : 'Landscape'}
                </button>
              ))}
            </div>
          </div>
          {media.length === 0 ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center bg-gray-100"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center text-gray-500 text-lg">
                <img
                  className="mb-3"
                  src="https://img.icons8.com/?size=100&id=h8kFdtYHEG6i&format=png&color=000000"
                  width={100}
                  height={100}
                  alt="icon"
                />
                <p className="font-medium">Keo tha hoac chon anh/video</p>
                <div className="mt-3 flex gap-2">
                  <Button label="Chon anh" icon="pi pi-plus" onClick={triggerFilePicker} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="backdrop-blur-md bg-white/30 p-4 rounded-lg w-full">
                <Galleria
                  value={media.map((file, idx) => ({ url: mediaPreviewUrls[idx], name: file.name }))}
                  numVisible={3}
                  circular
                  showItemNavigators
                  item={galleriaItemTemplate}
                  thumbnail={galleriaThumbnailTemplate}
                  style={{ maxHeight: '400px', maxWidth: '700px', width: '100%', ...(aspectRatio ? { aspectRatio, overflow: 'hidden' } : {}) }}
                  className="w-full"
                />
                <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {media.map((f, idx) => (
                    <div key={idx} className="relative group border rounded overflow-hidden">
                      {mediaPreviewUrls[idx] ? (
                        <img src={mediaPreviewUrls[idx]} alt={f.name} className="w-full h-20 object-cover" />
                      ) : (
                        <div className="w-full h-20 bg-gray-200 animate-pulse" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMediaAt(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        title="Xoa anh"
                      >
                        <i className="pi pi-times text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <Button label="Them anh" icon="pi pi-plus" onClick={triggerFilePicker} />
                  <Button label="Xoa tat ca" icon="pi pi-trash" className="p-button-danger p-button-text" onClick={() => setMedia([])} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="p-4 space-y-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Anh da chon</div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {media.map((f, idx) => (
                <div key={idx} className="relative flex-shrink-0 border rounded-lg overflow-hidden w-28 h-28">
                  {mediaPreviewUrls[idx] ? (
                    <img src={mediaPreviewUrls[idx]} alt={f.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 animate-pulse" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMediaAt(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    title="Xoa anh"
                  >
                    <i className="pi pi-times text-xs" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={triggerFilePicker}
                className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:border-gray-500"
              >
                <i className="pi pi-plus text-lg mb-1" />
                Them anh
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Viet caption..."
              className="w-full p-2 border rounded"
              maxLength={2200}
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">{caption.length}/2200</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <Chips
              value={tags}
              onChange={(e) => setTags((e.value || []).filter((tag: string) => tag.trim() !== ''))}
              separator=","
              placeholder="Tags"
              className="w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRIVACY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPrivacyLevel(option.value)}
                  className={`border rounded-lg p-3 text-left transition-colors ${
                    privacyLevel === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vi tri</label>
            <LocationIQAutoComplete
              apiKey={process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || ''}
              onSelect={(place) => setSelectedPlace(place)}
              placeholder="Nhap dia chi..."
              className="mb-2"
            />
            {selectedPlace && (
              <div className="p-2 bg-blue-50 rounded text-sm flex items-center">
                <i className="pi pi-map-marker mr-2" style={{ color: 'var(--primary-color)' }} />
                <div className="flex-1">
                  <div className="font-bold">{selectedPlace.placeName}</div>
                  <div>
                    <strong>Toa do:</strong> {selectedPlace.coordinates.join(', ')}
                  </div>
                  <div>
                    <strong>Dia chi day du:</strong>{' '}
                    <a
                      href={`https://www.google.com/maps?q=${selectedPlace.coordinates[1]},${selectedPlace.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline hover:text-blue-700"
                    >
                      {selectedPlace.fullAddress}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button label="The nguoi" icon="pi pi-user" className="p-button-text" />
            <Button label="Them vi tri" icon="pi pi-map-marker" className="p-button-text" />
            <span className="flex-1" />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default InstagramPostDialog;
