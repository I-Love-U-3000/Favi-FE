import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import 'react-easy-crop/react-easy-crop.css';

interface CroppedAreaPixels { x: number; y: number; width: number; height: number; }

interface CropImageProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob | null, aspect: number) => void;
  aspect: number;
  setAspect: (aspect: number) => void;
  /** Optional - ẩn dropdown đổi tỉ lệ (VD: avatar luôn 1:1) */
  lockAspect?: boolean;
  /** Optional - mime & chất lượng output */
  outputMime?: 'image/jpeg' | 'image/png' | 'image/webp';
  outputQuality?: number; // 0..1
  /** Optional - khi người dùng đóng dialog mà không export */
  onCancel?: () => void;
}

const CropImage: React.FC<CropImageProps> = ({
  imageSrc,
  onCropComplete,
  aspect,
  setAspect,
  lockAspect = false,
  outputMime = 'image/jpeg',
  outputQuality = 0.9,
  onCancel,
}) => {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  const aspectOptions = [
    { label: '1:1 (Square)', value: 1 },
    { label: '4:5 (Portrait)', value: 4 / 5 },
    { label: '16:9 (Landscape)', value: 16 / 9 },
    { label: '9:16 (Story)', value: 9 / 16 },
  ];

  const onCropCompleteHandler = useCallback((_: Area, pixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // an toàn cho cả object URL & http URL
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      // crossOrigin không gây hại với object URL; với remote image thì cần để export canvas
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });

  const handleExport = useCallback(async () => {
    if (!croppedAreaPixels) {
      alert('Please select a crop area.');
      return;
    }
    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D not available');

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const sx = croppedAreaPixels.x * scaleX;
      const sy = croppedAreaPixels.y * scaleY;
      const sw = croppedAreaPixels.width * scaleX;
      const sh = croppedAreaPixels.height * scaleY;

      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));

      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          onCropComplete(blob, aspect);
          // QUAN TRỌNG: KHÔNG revoke imageSrc ở đây — parent sẽ quản lý
        },
        outputMime,
        outputQuality
      );
    } catch (e) {
      console.error('Crop error:', e);
      alert('Failed to crop image. Please try again.');
      onCropComplete(null, aspect);
    }
  }, [croppedAreaPixels, imageSrc, aspect, onCropComplete, outputMime, outputQuality]);

  return (
    <div className="relative w-full">
      <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={setZoom}
          cropShape="rect"
          showGrid
          objectFit="contain"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center">
          {!lockAspect && (
            <Dropdown
              value={aspect}
              options={aspectOptions}
              onChange={(e) => setAspect(e.value)}
              placeholder="Chọn tỷ lệ"
              className="w-36"
            />
          )}
          <Button
            label="Zoom In"
            icon="pi pi-plus"
            onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}
            className="p-button-text"
          />
          <Button
            label="Zoom Out"
            icon="pi pi-minus"
            onClick={() => setZoom((z) => Math.max(z - 0.1, 1))}
            className="p-button-text"
          />
          {onCancel && (
            <Button
              label="Hủy"
              className="p-button-text"
              onClick={onCancel}
            />
          )}
          <Button
            label="Crop & Export"
            onClick={handleExport}
            className="p-button-raised p-button-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default CropImage;
