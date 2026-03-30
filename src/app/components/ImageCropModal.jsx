'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { getCroppedImageBlob, ensureBlobMaxSize } from '@/app/lib/bannerCropUtils';

/**
 * Generic image crop dialog (react-easy-crop). Pass `aspect` as width ÷ height (e.g. 2.4 for 2.4:1, 1 for square, 3 for 3:1).
 */
export default function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onComplete,
  aspect = 1,
  title = 'Crop image',
  helperText = 'Drag to position, use zoom to fit.',
  outputBasename = 'image',
  titleId = 'image-crop-title',
  maxSizeBytes = 2 * 1024 * 1024,
  minZoom = 0.5,
  maxZoom = 4,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [applying, setApplying] = useState(false);

  const aspectNumber = typeof aspect === 'number' && aspect > 0 ? aspect : 1;

  useEffect(() => {
    if (open && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error('Adjust the crop and try again.');
      return;
    }
    try {
      setApplying(true);
      let blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, 'image/jpeg', 0.92);
      blob = await ensureBlobMaxSize(blob, maxSizeBytes);
      if (blob.size > maxSizeBytes) {
        toast.error('Image is still too large after compression. Try a smaller crop or another image.');
        return;
      }
      const safeBase = String(outputBasename || 'image').replace(/[^a-zA-Z0-9-_]/g, '') || 'image';
      const file = new File([blob], `${safeBase}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onComplete(file);
    } catch (e) {
      toast.error(e?.message || 'Could not crop image.');
    } finally {
      setApplying(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative z-[1] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-[#1E1E24]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="border-b border-gray-100 px-4 py-2 text-[11px] text-gray-500">{helperText}</p>

        <div className="relative h-[min(52vh,360px)] w-full bg-[#111]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectNumber}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            minZoom={minZoom}
            maxZoom={maxZoom}
          />
        </div>

        <div className="space-y-3 px-4 py-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Zoom</label>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#7C3AED]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={applying}
            onClick={handleApply}
            className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {applying ? 'Processing…' : 'Use cropped image'}
          </button>
        </div>
      </div>
    </div>
  );
}
