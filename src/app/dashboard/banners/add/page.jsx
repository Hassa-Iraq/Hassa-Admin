'use client';

import Link from 'next/link';
import { Upload } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { toast } from 'sonner';
import BannerImageCropModal from '@/app/components/BannerImageCropModal';

function formatDateForInput(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getInitialForm() {
  const now = new Date();
  const next = new Date(now);
  next.setFullYear(next.getFullYear() + 1);
  return {
    advertisementName: '',
    description: '',
    validFromDate: formatDateForInput(now),
    validToDate: formatDateForInput(next),
  };
}

/** Date-only (YYYY-MM-DD) → API start-of-day UTC */
function dateInputToStartUtcIso(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  return `${dateStr}T00:00:00.000Z`;
}

/** Date-only (YYYY-MM-DD) → API end-of-day UTC */
function dateInputToEndUtcIso(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  return `${dateStr}T23:59:59.999Z`;
}

export default function AddAdvertisementPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [form, setForm] = useState(getInitialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const imageRef = useRef(null);
  const imageFileRef = useRef(null);
  const [cropModal, setCropModal] = useState({ open: false, src: null });

  useEffect(() => {
    imageFileRef.current = imageFile;
  }, [imageFile]);

  useEffect(() => {
    const role = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
    const isRestaurantRole = ['restaurant', 'resturant', 'restaurant_admin', 'vendor'].includes(role);
    setIsAllowed(isRestaurantRole);
    if (!isRestaurantRole) {
      toast.error('Only restaurant role can create advertisements.');
      router.push('/dashboard/banners/status');
    }
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCropForFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image must be under 15 MB. Choose a smaller file.');
      return;
    }
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setCropModal((prev) => {
      if (prev.src) URL.revokeObjectURL(prev.src);
      return { open: true, src: URL.createObjectURL(file) };
    });
  };

  const dismissCropModal = () => {
    setCropModal((prev) => {
      if (prev.src) URL.revokeObjectURL(prev.src);
      return { open: false, src: null };
    });
  };

  /** User closed crop without applying — drop staging preview or restore previous cropped image. */
  const closeCropModalOnCancel = () => {
    dismissCropModal();
    setImagePreview((prevPreview) => {
      if (prevPreview) URL.revokeObjectURL(prevPreview);
      const hadFile = imageFileRef.current;
      if (hadFile) return URL.createObjectURL(hadFile);
      return '';
    });
  };

  const handleCroppedImage = (file) => {
    imageFileRef.current = file;
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    dismissCropModal();
  };

  const toAbsoluteAssetUrl = (value) => {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
    return `${API_BASE_URL}/${trimmed}`;
  };

  const pickFirstUrl = (...values) =>
    values.find((value) => typeof value === 'string' && value.trim().length > 0) || '';

  const extractImageUrl = (uploadData = {}) => {
    const source =
      uploadData?.data && typeof uploadData.data === 'object' ? uploadData.data : uploadData;
    const assets =
      source?.assets && typeof source.assets === 'object' ? source.assets : source;

    return toAbsoluteAssetUrl(
      pickFirstUrl(
        assets?.banner_image_url,
        assets?.image_url,
        assets?.image,
        assets?.url,
        assets?.path,
        source?.banner_image_url,
        source?.image_url,
        source?.url,
        source?.path
      )
    );
  };

  const uploadAdvertisementImage = async (token) => {
    if (!imageFile) {
      throw new Error('Please upload advertisement image first.');
    }
    const formData = new FormData();
    formData.append('banner_image', imageFile);
    const response = await axios.post('/api/restaurants/banners/upload-image', formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const uploadedImageUrl = extractImageUrl(response?.data);
    if (!uploadedImageUrl) {
      throw new Error('Image upload succeeded but image URL was not returned.');
    }
    return uploadedImageUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.advertisementName.trim()) {
      toast.error('Advertisement name is required.');
      return;
    }
    if (!form.validFromDate || !form.validToDate) {
      toast.error('Please choose valid from and valid to dates.');
      return;
    }
    if (form.validToDate < form.validFromDate) {
      toast.error('Valid to must be on or after valid from.');
      return;
    }
    const validFromIso = dateInputToStartUtcIso(form.validFromDate);
    const validToIso = dateInputToEndUtcIso(form.validToDate);
    if (!validFromIso || !validToIso) {
      toast.error('Invalid dates. Use the date picker.');
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token') || '';
      const restaurantId =
        localStorage.getItem('restaurant_id') ||
        localStorage.getItem('selectedRestaurantId') ||
        '';
      if (!restaurantId) {
        throw new Error('Restaurant ID not found. Please login/select restaurant again.');
      }

      const imageUrl = await uploadAdvertisementImage(token);
      const payload = {
        restaurant_id: String(restaurantId).trim(),
        banner_name: form.advertisementName.trim(),
        banner_image_url: imageUrl,
        description: form.description.trim(),
        valid_from: validFromIso,
        valid_to: validToIso,
      };

      const response = await axios.post('/api/restaurants/banners', payload, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      toast.success(response?.data?.message || 'Advertisement created successfully.');
      router.push('/dashboard/banners/list');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to create advertisement.'
        : error?.message || 'Failed to create advertisement.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const titlePreview = form.advertisementName.trim();
  const descriptionPreview = form.description.trim();

  return (
    <div className="pt-36 pb-8">
      {!isAllowed ? null : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-[#1E1E24]">Advertisement preview</h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Updates as you add the image, name, and description below.
            </p>
            <div className="mx-auto mt-4 max-w-[320px] overflow-hidden rounded-xl border border-gray-200 shadow-sm">
              <div className="relative aspect-[2.4/1] w-full bg-[#E8E8ED]">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent pt-10 pb-2.5 px-3"
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-6">
                  <p
                    className={`truncate text-sm font-semibold leading-tight drop-shadow-sm ${
                      titlePreview ? 'text-white' : 'text-white/65'
                    }`}
                  >
                    {titlePreview || 'Title'}
                  </p>
                  <p
                    className={`mt-0.5 line-clamp-2 text-xs leading-snug drop-shadow-sm ${
                      descriptionPreview ? 'text-white/95' : 'text-white/55'
                    }`}
                  >
                    {descriptionPreview || 'Description'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-[#1E1E24]">Create advertisement</h3>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Advertisement name
                  </label>
                  <input
                    name="advertisementName"
                    value={form.advertisementName}
                    onChange={handleChange}
                    placeholder="Ex: Weekend Deal"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Flat 20% off"
                    className="min-h-[90px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                      Valid from
                    </label>
                    <input
                      type="date"
                      name="validFromDate"
                      value={form.validFromDate}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                      Valid to
                    </label>
                    <input
                      type="date"
                      name="validToDate"
                      value={form.validToDate}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <h4 className="text-xs font-semibold text-[#1E1E24]">Advertisement image</h4>
                <p className="mt-1 text-[11px] text-gray-400">
                  Wide image for home / promo areas. Recommended: 2400 × 1000 or 1920 × 800 px.
                </p>

                <div
                  onClick={() => imageRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer?.files?.[0];
                    if (file) openCropForFile(file);
                  }}
                  className="mt-3 flex h-[165px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-[#FAFAFF] hover:border-[#7C3AED]"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="advertisement preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <Upload size={18} className="text-[#7C3AED]" />
                      <p className="mt-2 text-xs text-gray-500">
                        <span className="font-semibold text-[#7C3AED]">Click to Upload</span> or
                      </p>
                      <p className="text-xs font-semibold text-[#7C3AED]">Drag Drop</p>
                    </>
                  )}
                </div>

                <p className="mt-2 text-[11px] text-gray-400">
                  JPEG, PNG, WebP — up to 15 MB before crop; output kept under 2 MB when possible.
                </p>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) openCropForFile(file);
                    event.target.value = '';
                  }}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link href="/dashboard/banners/list">
              <button
                type="button"
                className="rounded-lg border border-[#D8B4FE] bg-white px-5 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
              >
                Back
              </button>
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save advertisement'}
            </button>
          </div>
        </form>
      )}

      <BannerImageCropModal
        open={cropModal.open}
        imageSrc={cropModal.src || ''}
        onClose={closeCropModalOnCancel}
        onComplete={handleCroppedImage}
        maxSizeBytes={2 * 1024 * 1024}
      />
    </div>
  );
}
