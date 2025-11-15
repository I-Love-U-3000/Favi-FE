import { useState, useCallback, useEffect, useRef } from 'react';
import postAPI from "@/lib/api/postAPI";
import { useAuth } from "@/components/AuthProvider";
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

const InstagramPostDialog: React.FC<InstagramPostDialogProps> = ({ visible, onHide }) => {
  const { requireAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [media, setMedia] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [croppedImages, setCroppedImages] = useState<(Blob | null)[]>([]);
  const [aspect, setAspect] = useState<number>(1);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null); // State mới cho vị trí
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for file input
  const fileIntentRef = useRef<"replace" | "append">("replace");
  const stagedBeforeCropRef = useRef<File[] | null>(null); // hold existing media when appending
  const returnToStepRef = useRef<number | null>(null); // remember step to return after append crop
  const MIN_SIZE = 320;

  useEffect(() => {
    const urls = media.map((file) => URL.createObjectURL(file));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [media]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

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
    setCroppedImages(new Array(newFiles.length).fill(null));
    setCurrentIndex(0);
    setCropMode(true);
    if (step !== 1) setStep(1);
  };

  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = await validateAndFilterFiles(files);
      if (newFiles.length > 0) {
        if (fileIntentRef.current === "append" && media.length > 0 && !cropMode) {
          startAppendFlow(newFiles, step);
        } else {
          setSelectedFiles(newFiles);
          setCroppedImages(new Array(newFiles.length).fill(null));
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
          setCroppedImages(new Array(newFiles.length).fill(null));
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

  const handleCropComplete = useCallback(
    (croppedImage: Blob | null, newAspect: number) => {
      setAspect(newAspect);
      const newCroppedImages = [...croppedImages];
      newCroppedImages[currentIndex] = croppedImage;
      setCroppedImages(newCroppedImages);

      if (currentIndex < selectedFiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        const croppedMedia: File[] = newCroppedImages.map((img, idx) =>
          img
            ? new File([img], selectedFiles[idx].name.replace(/\.[^/.]+$/, `_cropped.jpg`), { type: 'image/jpeg' })
            : selectedFiles[idx]
        );
        // Merge with pre-existing media if we're in append flow
        if (stagedBeforeCropRef.current && stagedBeforeCropRef.current.length > 0) {
          setMedia([...(stagedBeforeCropRef.current || []), ...croppedMedia]);
        } else {
          setMedia(croppedMedia);
        }
        setCropMode(false);
        setSelectedFiles([]);
        setCroppedImages([]);
        // return to step if requested
        if (returnToStepRef.current) {
          setStep(returnToStepRef.current);
        }
        stagedBeforeCropRef.current = null;
        returnToStepRef.current = null;
      }
    },
    [currentIndex, selectedFiles, croppedImages]
  );

  const cropAllImages = useCallback(async () => {
    const newCroppedImages = [...croppedImages];
    for (let i = 0; i < selectedFiles.length; i++) {
      newCroppedImages[i] = await new Promise<Blob | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
        };
        img.onerror = () => resolve(null);
        img.src = URL.createObjectURL(selectedFiles[i]);
      });
    }
    setCroppedImages(newCroppedImages);
    const croppedMedia: File[] = newCroppedImages.map((img, idx) =>
      img
        ? new File([img], selectedFiles[idx].name.replace(/\.[^/.]+$/, `_cropped.jpg`), { type: 'image/jpeg' })
        : selectedFiles[idx]
    );
    setMedia(croppedMedia);
    setCropMode(false);
    setSelectedFiles([]);
    setCroppedImages([]);
  }, [croppedImages, selectedFiles]);

  const handleNext = () => {
    if (media.length > 0) setStep(2);
  };

  const triggerChooseReplace = () => {
    fileIntentRef.current = "replace";
    fileInputRef.current?.click();
  };

  const triggerChooseAppend = () => {
    fileIntentRef.current = "append";
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
      const created = await postAPI.create({ caption, tags });
      if (media.length > 0) {
        await postAPI.uploadMedia(created.id, media);
      }
      setStep(1);
      setMedia([]);
      setCaption('');
      setTags([]);
      setSelectedFiles([]);
      setCropMode(false);
      setCroppedImages([]);
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
      created = await postAPI.create({ caption, tags });
      if (media.length > 0) {
        await postAPI.uploadMedia(created.id, media);
      }
      setStep(1);
      setMedia([]);
      setCaption('');
      setTags([]);
      setSelectedFiles([]);
      setCropMode(false);
      setCroppedImages([]);
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
      setSelectedFiles([]);
      setCropMode(false);
      setCroppedImages([]);
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
    setCropMode(false);
    setCroppedImages([]);
    setCaption('');
    setTags([]);
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
            label="Choose"
            icon="pi pi-plus"
            onClick={triggerChooseReplace}
            className="p-button-raised p-button-info"
          />
          <Button
            label="Discard"
            icon="pi pi-trash"
            onClick={handleDiscard}
            className="p-button-text p-button-danger"
          />
          {cropMode && (
            <Button
              label="Crop All"
              icon="pi pi-check"
              onClick={cropAllImages}
              className="p-button-raised p-button-success"
            />
          )}
          <Button
            label="Tiếp theo"
            icon="pi pi-arrow-right"
            onClick={handleNext}
            disabled={media.length === 0 || cropMode}
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

  const galleriaItemTemplate = (item: File) => (
    <img
      src={URL.createObjectURL(item)}
      alt={item.name}
      style={{ maxHeight: '400px', maxWidth: '700px', width: '100%', height: 'auto', objectFit: 'contain' }}
    />
  );

  const galleriaThumbnailTemplate = (item: File) => (
    <img
      src={URL.createObjectURL(item)}
      alt={item.name}
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
        setCroppedImages([]);
        setCaption('');
        setTags([]);
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
      {step === 1 && (
        <div className="p-4">
          <div className="flex justify-between mb-4">
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={onFileSelect}
              style={{ display: 'none' }}
              aria-label="Upload images"
              key={step} // Force re-render after step change
            />
          </div>
          {cropMode && selectedFiles.length > 0 && (
            <CropImage
              imageSrc={URL.createObjectURL(selectedFiles[currentIndex])}
              onCropComplete={handleCropComplete}
              aspect={aspect}
              setAspect={setAspect} // Pass setAspect to CropImage
            />
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
                  <Button label="Chọn ảnh" icon="pi pi-plus" onClick={triggerChooseReplace} />
                </div>
              </div>
            </div>
          )}
          {!cropMode && media.length > 0 && (
            <div className="flex justify-center">
              <div className="backdrop-blur-md bg-white/30 p-4 rounded-lg">
                <Galleria
                  value={media}
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
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-20 object-cover" />
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
                  <Button label="Thêm ảnh" icon="pi pi-plus" onClick={triggerChooseAppend} />
                  <Button label="Xóa tất cả" icon="pi pi-trash" className="p-button-danger p-button-text" onClick={() => setMedia([])} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="p-4">
          <div className="mb-8 flex justify-center">
            <div className="backdrop-blur-md bg-white/30 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Preview:</h3>
              {media.length > 0 && (
                <Galleria
                  value={media}
                  numVisible={1}
                  circular
                  showItemNavigators
                  item={galleriaItemTemplate}
                  style={{ maxHeight: '400px', maxWidth: '700px' }}
                  className="w-full"
                />
              )}
            </div>
          </div>
          <div className="mb-6">
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
              placeholder="Nhập tags (dùng dấu phẩy để tách)"
              className="w-full"
            />
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
            <Button
              label="Thêm hashtag"
              icon="pi pi-hashtag"
              className="p-button-text"
              onClick={() => setCaption(caption + ' #')}
            />
            <Button label="Thẻ người" icon="pi pi-user" className="p-button-text" />
            <Button label="Thêm vị trí" icon="pi pi-map-marker" className="p-button-text" />
            <span className="flex-1" />
            <Button label="Thêm ảnh" icon="pi pi-plus" className="p-button-text" onClick={() => { fileIntentRef.current = "append"; fileInputRef.current?.click(); }} />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default InstagramPostDialog;
