import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Galleria } from 'primereact/galleria';
import { Chips } from 'primereact/chips';
import CropImage from './CropImage';
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

interface InstagramPostDialogProps {
  visible: boolean;
  onHide: () => void;
}

const InstagramPostDialog: React.FC<InstagramPostDialogProps> = ({ visible, onHide }) => {
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
  const fileInputRef = useRef<HTMLInputElement>(null); // Add ref for file input
  const MIN_SIZE = 320;

  useEffect(() => {
    const urls = media.map((file) => URL.createObjectURL(file));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [media]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validationPromises = [...files].map(
        (file: File) =>
          new Promise<boolean>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img.width >= MIN_SIZE && img.height >= MIN_SIZE);
            img.onerror = () => resolve(false);
            img.src = URL.createObjectURL(file);
          })
      );
      const results = await Promise.all(validationPromises);
      const newFiles = [...files].filter((_, index) => results[index]);
      if (newFiles.length > 0) {
        setSelectedFiles(newFiles);
        setCroppedImages(new Array(newFiles.length).fill(null));
        setCurrentIndex(0);
        setCropMode(true);
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
      const validationPromises = [...files].map(
        (file: File) =>
          new Promise<boolean>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img.width >= MIN_SIZE && img.height >= MIN_SIZE);
            img.onerror = () => resolve(false);
            img.src = URL.createObjectURL(file);
          })
      );
      const results = await Promise.all(validationPromises);
      const newFiles = [...files].filter((_, index) => results[index]);
      if (newFiles.length > 0) {
        setSelectedFiles(newFiles);
        setCroppedImages(new Array(newFiles.length).fill(null));
        setCurrentIndex(0);
        setCropMode(true);
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
        setMedia(croppedMedia);
        setCropMode(false);
        setSelectedFiles([]);
        setCroppedImages([]);
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
    setAspect(1); // Reset aspect ratio
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  const renderFooter = () => (
    <div className="!py-2 !px-3 flex justify-end gap-2">
      {step === 1 && (
        <>
          <Button
            label="Choose"
            icon="pi pi-plus"
            onClick={() => fileInputRef.current?.click()}
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
            onClick={handleShare}
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
        setAspect(1); // Reset aspect ratio
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
        onHide();
      }}
      style={{ width: '90vw', maxWidth: '1000px', height: '90vh', maxHeight: '800px' }}
      footer={renderFooter()}
      className="rounded-lg sm:w-full sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw]"
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
          <div className="flex gap-2">
            <Button
              label="Thêm hashtag"
              icon="pi pi-hashtag"
              className="p-button-text"
              onClick={() => setCaption(caption + ' #')}
            />
            <Button label="Thẻ người" icon="pi pi-user" className="p-button-text" />
            <Button label="Thêm vị trí" icon="pi pi-map-marker" className="p-button-text" />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default InstagramPostDialog;