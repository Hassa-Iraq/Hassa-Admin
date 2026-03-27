'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { getCroppedImageBlob, ensureBlobMaxSize } from '@/app/lib/bannerCropUtils';

/** Common banner / hero aspect ratios (width / height) */
export const BANNER_ASPECT_PRESETS = [
  { label: '21:9', ratio: 21 / 9 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '3:1', ratio: 3 },
  { label: '2:1', ratio: 2 },
];

export default function BannerImageCropModal({
  open,
  imageSrc,
  onClose,
  onComplete,
  maxSizeBytes = 2 * 1024 * 1024,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(16 / 9);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (open && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspect(16 / 9);
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
      const file = new File([blob], `banner-${Date.now()}.jpg`, { type: 'image/jpeg' });
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="banner-crop-title"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 id="banner-crop-title" className="text-sm font-semibold text-[#1E1E24]">
            Crop banner image
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

        <div className="border-b border-gray-100 px-4 py-3">
          <p className="mb-2 text-[11px] font-medium text-gray-600">Aspect ratio</p>
          <div className="flex flex-wrap gap-2">
            {BANNER_ASPECT_PRESETS.map(({ label, ratio }) => {
              const active = Math.abs(aspect - ratio) < 0.0001;
              return (
              <button
                key={label}
                type="button"
                onClick={() => setAspect(ratio)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#7C3AED] text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-[#7C3AED]'
                }`}
              >
                {label}
              </button>
              );
            })}
          </div>
        </div>

        <div className="relative h-[min(52vh,360px)] w-full bg-[#111]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            minZoom={0.5}
            maxZoom={4}
          />
        </div>

        <div className="space-y-3 px-4 py-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Zoom</label>
            <input
              type="range"
              min={0.5}
              max={4}
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
