import { useState, useCallback, useEffect, useRef } from 'react';
import postAPI from "@/lib/api/postAPI";
import { useAuth } from "@/components/AuthProvider";
import { PrivacyLevel } from "@/types";
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Galleria } from 'primereact/galleria';
import { Chips } from 'primereact/chips';
import CropImage from './CropImage';
import LocationIQAutoComplete from './LocationIQAutoComplete'; // Import component mới
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'react-easy-crop/react-easy-crop.css';

// Define CroppedAreaPixels interface inline
interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [cropAreas, setCropAreas] = useState<(CroppedAreaPixels | null)[]>([]);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aspect, setAspect] = useState<number>(1);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null); // State mới cho vị trí
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.Public);
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for file input
  const stagedBeforeCropRef = useRef<File[] | null>(null); // hold existing media when appending
  const returnToStepRef = useRef<number | null>(null); // remember step to return after append crop
  const MIN_SIZE = 320;

  useEffect(() => {
    if (!cropMode || !selectedFiles[currentIndex]) {
      setCurrentPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFiles[currentIndex]);
    setCurrentPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [cropMode, selectedFiles, currentIndex]);

  useEffect(() => {
    const urls = media.map((file) => URL.createObjectURL(file));
    setMediaPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [media]);

  const validateAndFilterFiles = async (files: FileList | File[]): Promise<File[]> => {
    const arr = Array.from(files);
    const validationPromises = arr.map(
      (file: File) =>
        new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img.width >= MIN_SIZE && img.height >= MIN_SIZE);
          img.onerror = () => resolve(false);
          img.src = URL.createObjectURL(file);
        })
    );
    const results = await Promise.all(validationPromises);
    return arr.filter((_, index) => results[index]);
  };

  const startAppendFlow = (newFiles: File[], returnToStep?: number) => {
    stagedBeforeCropRef.current = media.slice();
    returnToStepRef.current = returnToStep ?? null;
    setSelectedFiles(newFiles);
    setCropAreas(new Array(newFiles.length).fill(null));
    setCurrentIndex(0);
    setCropMode(true);
    if (step !== 1) setStep(1);
  };

  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = await validateAndFilterFiles(files);
      if (newFiles.length > 0) {
        if (media.length > 0 && !cropMode) {
          startAppendFlow(newFiles, step);
        } else {
          setSelectedFiles(newFiles);
          setCropAreas(new Array(newFiles.length).fill(null));
          setCurrentIndex(0);
          setCropMode(true);
          stagedBeforeCropRef.current = null;
          returnToStepRef.current = null;
        }
      } else {
        alert('Vui lòng chọn ảnh có kích thước tối thiểu 320x320 pixel!');
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
      const newFiles = await validateAndFilterFiles(files);
      if (newFiles.length > 0) {
        if (media.length > 0 && !cropMode) {
          startAppendFlow(newFiles, step);
        } else {
          setSelectedFiles(newFiles);
          setCropAreas(new Array(newFiles.length).fill(null));
          setCurrentIndex(0);
          setCropMode(true);
          stagedBeforeCropRef.current = null;
          returnToStepRef.current = null;
        }
      } else {
        alert('Vui lòng chọn ảnh có kích thước tối thiểu 320x320 pixel!');
      }
    }
  };

  const updateCropArea = useCallback((area: CroppedAreaPixels | null) => {
    setCropAreas(prev => {
      const next = [...prev];
      next[currentIndex] = area;
      return next;
    });
  }, [currentIndex]);

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

  const cropFileWithArea = async (file: File, area: CroppedAreaPixels | null) => {
    if (!area) return file;
    const image = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    const sx = area.x;
    const sy = area.y;
    const sw = area.width;
    const sh = area.height;

    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return await new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const nextFile = new File([blob], file.name.replace(/\.[^/.]+$/, `_cropped.jpg`), { type: file.type || 'image/jpeg' });
        resolve(nextFile);
      }, file.type || 'image/jpeg', 0.92);
    });
  };

  const finalizeCropping = useCallback(async () => {
    if (selectedFiles.length === 0) return false;
    const processed: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const area = cropAreas[i] ?? null;
      const cropped = await cropFileWithArea(file, area);
      processed.push(cropped);
    }
    const combined =
      stagedBeforeCropRef.current && stagedBeforeCropRef.current.length > 0
        ? [...(stagedBeforeCropRef.current || []), ...processed]
        : processed;
    setMedia(combined);
    setCropMode(false);
    setSelectedFiles([]);
    setCropAreas([]);
    setCurrentIndex(0);
    stagedBeforeCropRef.current = null;
    const returnStep = returnToStepRef.current ?? 2;
    setStep(returnStep);
    returnToStepRef.current = null;
    return true;
  }, [selectedFiles, cropAreas]);

  const handleNext = async () => {
    if (cropMode && selectedFiles.length > 0) {
      await finalizeCropping();
      return;
    }
    if (media.length > 0) setStep(2);
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const removeMediaAt = (idx: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  // Actual API-backed share
  const sharePost = async () => {
    if (!requireAuth()) return;
    if (uploading) return;
    try {
      setUploading(true);
      const created = await postAPI.create({ caption, tags, privacyLevel });
      if (media.length > 0) {
        await postAPI.uploadMedia(created.id, media);
      }
      setStep(1);
      setMedia([]);
      setCaption('');
      setTags([]);
      setPrivacyLevel(PrivacyLevel.Public);
      setSelectedFiles([]);
      setCurrentPreviewUrl(null);
      setCropMode(false);
      setCropAreas([]);
      setSelectedPlace(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onHide();
      alert('Bài viết đã được đăng!');
    } catch (e: any) {
      alert(e?.error || e?.message || 'Đăng bài thất bại');
    } finally {
      setUploading(false);
    }
  };

  // Safer flow: create then upload, rollback on failure
  const sharePostSafe = async () => {
    if (!requireAuth()) return;
    if (uploading) return;
    let created: { id: string } | null = null;
    try {
      setUploading(true);
      created = await postAPI.create({ caption, tags, privacyLevel });
      if (media.length > 0) {
        await postAPI.uploadMedia(created.id, media);
      }
      setStep(1);
      setMedia([]);
      setCaption('');
      setTags([]);
      setPrivacyLevel(PrivacyLevel.Public);
      setSelectedFiles([]);
      setCurrentPreviewUrl(null);
      setCropMode(false);
      setCropAreas([]);
      setSelectedPlace(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleShare = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setStep(1);
      setMedia([]);
      setCaption('');
      setTags([]);
      setPrivacyLevel(PrivacyLevel.Public);
      setSelectedFiles([]);
      setCurrentPreviewUrl(null);
      setCropMode(false);
      setCropAreas([]);
      setSelectedPlace(null); // Reset selected place
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
      onHide();
      alert('Bài đăng đã được chia sẻ!');
    }, 2000);
  };

  const handleDiscard = () => {
    setStep(1);
    setMedia([]);
    setSelectedFiles([]);
    setCurrentIndex(0);
    setCurrentPreviewUrl(null);
    setCropMode(false);
    setCropAreas([]);
    setCaption('');
    setTags([]);
    setPrivacyLevel(PrivacyLevel.Public);
    setSelectedPlace(null); // Reset selected place
    setAspect(1); // Reset aspect ratio
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
    stagedBeforeCropRef.current = null;
    returnToStepRef.current = null;
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
            label="Tiếp theo"
            icon="pi pi-arrow-right"
            onClick={handleNext}
            disabled={!cropMode && media.length === 0}
            className="p-button-raised p-button-info"
          />
        </>
      )}
      {step === 2 && (
        <>
          <Button
            label="Quay lại"
            icon="pi pi-arrow-left"
            onClick={() => setStep(1)}
            className="p-button-text p-button-secondary"
          />
          <Button
            label="Chia sẻ"
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
      header="Tạo bài đăng"
      visible={visible}
      onHide={() => {
        setStep(1);
        setMedia([]);
        setSelectedFiles([]);
        setCurrentIndex(0);
        setCropMode(false);
        setCropAreas([]);
        setCurrentPreviewUrl(null);
        setCaption('');
        setTags([]);
        setPrivacyLevel(PrivacyLevel.Public);
        setSelectedPlace(null); // Reset selected place
        setAspect(1); // Reset aspect ratio
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
        stagedBeforeCropRef.current = null;
        returnToStepRef.current = null;
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
        <div className="p-4">
          <div className="flex justify-between mb-4" />
          {cropMode && selectedFiles.length > 0 && currentPreviewUrl && (
            <div className="space-y-4">
              <CropImage
                key={currentIndex}
                imageSrc={currentPreviewUrl}
                onCropComplete={() => {}}
                aspect={aspect}
                setAspect={setAspect}
                hideExportButton
                onAreaChange={updateCropArea}
              />
              {selectedFiles.length > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <Button
                    label="Ảnh trước"
                    icon="pi pi-chevron-left"
                    className="p-button-text"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                  />
                  <span>
                    Ảnh {currentIndex + 1}/{selectedFiles.length}
                  </span>
                  <Button
                    label="Ảnh tiếp"
                    iconPos="right"
                    icon="pi pi-chevron-right"
                    className="p-button-text"
                    disabled={currentIndex === selectedFiles.length - 1}
                    onClick={() => setCurrentIndex((idx) => Math.min(selectedFiles.length - 1, idx + 1))}
                  />
                </div>
              )}
            </div>
          )}
          {!cropMode && media.length === 0 && (
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
                <p className="font-medium">Kéo thả hoặc chọn ảnh/video</p>
                <div className="mt-3 flex gap-2">
                  <Button label="Chọn ảnh" icon="pi pi-plus" onClick={triggerFilePicker} />
                </div>
              </div>
            </div>
          )}
          {!cropMode && media.length > 0 && (
            <div className="flex justify-center">
              <div className="backdrop-blur-md bg-white/30 p-4 rounded-lg">
                <Galleria
                  value={media.map((file, idx) => ({ url: mediaPreviewUrls[idx], name: file.name }))}
                  numVisible={3}
                  circular
                  showItemNavigators
                  item={galleriaItemTemplate}
                  thumbnail={galleriaThumbnailTemplate}
                  style={{ maxHeight: '400px', maxWidth: '700px' }}
                  className="w-full"
                />
                {/* Thumbnails with remove buttons */}
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
                        title="Xóa ảnh"
                      >
                        <i className="pi pi-times text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <Button label="Thêm ảnh" icon="pi pi-plus" onClick={triggerFilePicker} />
                  <Button label="Xóa tất cả" icon="pi pi-trash" className="p-button-danger p-button-text" onClick={() => setMedia([])} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="p-4 space-y-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Ảnh đã chọn</div>
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
                    title="Xóa ảnh"
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
                Thêm ảnh
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Viết caption..."
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
              placeholder="Nhap tags (dung dau phay de tach)"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
            <LocationIQAutoComplete
              apiKey={process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || ''}
              onSelect={(place) => setSelectedPlace(place)}
              placeholder="Tìm kiếm địa chỉ..."
              className="mb-2"
            />
            {selectedPlace && (
              <div className="p-2 bg-blue-50 rounded text-sm flex items-center">
                <i className="pi pi-map-marker mr-2" style={{ color: 'var(--primary-color)' }} />
                <div className="flex-1">
                  <div className="font-bold">{selectedPlace.placeName}</div>
                  <div>
                    <strong>Tọa độ:</strong> {selectedPlace.coordinates.join(', ')}
                  </div>
                  <div>
                    <strong>Địa chỉ đầy đủ:</strong>{' '}
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
            <Button label="Thẻ người" icon="pi pi-user" className="p-button-text" />
            <Button label="Thêm vị trí" icon="pi pi-map-marker" className="p-button-text" />
            <span className="flex-1" />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default InstagramPostDialog;
