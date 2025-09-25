import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import 'react-easy-crop/react-easy-crop.css';

// Define CroppedAreaPixels inline to match InstagramPostDialog
interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropImageProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob | null, aspect: number) => void;
  aspect: number;
  setAspect: (aspect: number) => void; // Add setAspect prop to update parent state
}

const CropImage: React.FC<CropImageProps> = ({ imageSrc, onCropComplete, aspect, setAspect }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  const aspectOptions = [
    { label: '1:1 (Square)', value: 1 },
    { label: '4:5 (Portrait)', value: 4 / 5 },
    { label: '16:9 (Landscape)', value: 16 / 9 },
    { label: '9:16 (Story)', value: 9 / 16 },
  ];

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = useCallback(async () => {
    if (!croppedAreaPixels) {
      alert('Please select a crop area.');
      return;
    }

    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const cropX = croppedAreaPixels.x * scaleX;
      const cropY = croppedAreaPixels.y * scaleY;
      const cropWidth = croppedAreaPixels.width * scaleX;
      const cropHeight = croppedAreaPixels.height * scaleY;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              onCropComplete(blob, aspect);
            } else {
              onCropComplete(null, aspect);
            }
            resolve(blob);
            URL.revokeObjectURL(imageSrc);
          },
          'image/jpeg',
          0.8
        );
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
      onCropComplete(null, aspect);
      return null;
    }
  }, [imageSrc, croppedAreaPixels, aspect, onCropComplete]);

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
          showGrid={true}
          objectFit="contain"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 items-center">
          <Dropdown
            value={aspect}
            options={aspectOptions}
            onChange={(e) => setAspect(e.value)} // Update aspect without triggering crop
            placeholder="Chọn tỷ lệ"
            className="w-32"
          />
          <Button
            label="Zoom In"
            icon="pi pi-plus"
            onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
            className="p-button-text"
          />
          <Button
            label="Zoom Out"
            icon="pi pi-minus"
            onClick={() => setZoom(Math.max(zoom - 0.1, 1))}
            className="p-button-text"
          />
          <Button
            label="Crop & Export"
            onClick={getCroppedImg}
            className="p-button-raised p-button-primary"
          />
        </div>
      </div>
    </div>
  );
};

export default CropImage;