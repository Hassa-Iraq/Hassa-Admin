'use client';

import Link from 'next/link';
import { Upload } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { toast } from 'sonner';
import BannerImageCropModal from '@/app/components/BannerImageCropModal';

const INITIAL_FORM = {
  bannerName: '',
  description: '',
};

export default function AddBannerPage() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const imageRef = useRef(null);
  const [cropModal, setCropModal] = useState({ open: false, src: null });

  useEffect(() => {
    const role = String(localStorage.getItem('userRole') || '').trim().toLowerCase();
    const isRestaurantRole = ['restaurant', 'resturant', 'restaurant_admin', 'vendor'].includes(role);
    setIsAllowed(isRestaurantRole);
    if (!isRestaurantRole) {
      toast.error('Only restaurant role can create banners.');
      router.push('/dashboard/banners/status');
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (cropModal.src) URL.revokeObjectURL(cropModal.src);
    };
  }, [cropModal.src]);

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
    setCropModal((prev) => {
      if (prev.src) URL.revokeObjectURL(prev.src);
      return { open: true, src: URL.createObjectURL(file) };
    });
  };

  const closeCropModal = () => {
    setCropModal((prev) => {
      if (prev.src) URL.revokeObjectURL(prev.src);
      return { open: false, src: null };
    });
  };

  const handleCroppedImage = (file) => {
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    closeCropModal();
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
    const source = uploadData?.data && typeof uploadData.data === 'object'
      ? uploadData.data
      : uploadData;
    const assets = source?.assets && typeof source.assets === 'object'
      ? source.assets
      : source;

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

  const uploadBannerImage = async (token) => {
    if (!imageFile) {
      throw new Error('Please upload banner image first.');
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
      throw new Error('Banner image upload succeeded but image URL was not returned.');
    }
    return uploadedImageUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.bannerName.trim()) {
      toast.error('Banner name is required.');
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

      const bannerImageUrl = await uploadBannerImage(token);
      const validFrom = new Date();
      const validTo = new Date(validFrom);
      validTo.setFullYear(validTo.getFullYear() + 1);
      const payload = {
        restaurant_id: String(restaurantId).trim(),
        banner_name: form.bannerName.trim(),
        banner_image_url: bannerImageUrl,
        description: form.description.trim(),
        valid_from: validFrom.toISOString(),
        valid_to: validTo.toISOString(),
      };

      const response = await axios.post('/api/restaurants/banners', payload, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      toast.success(response?.data?.message || 'Banner created successfully.');
      router.push('/dashboard/banners/list');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to create banner.'
        : error?.message || 'Failed to create banner.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-36 pb-8">
      {!isAllowed ? null : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-[#1E1E24]">Create Banner</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Banner Name</label>
                <input
                  name="bannerName"
                  value={form.bannerName}
                  onChange={handleChange}
                  placeholder="Ex: Weekend Deal"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Flat 20% Off"
                  className="min-h-[90px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <h4 className="text-xs font-semibold text-[#1E1E24]">Banner Image</h4>
              <p className="mt-1 text-[11px] text-gray-400">
                Choose an image, then crop with a banner aspect ratio (zoom &amp; frame), then save.
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
                  <img src={imagePreview} alt="banner-preview" className="h-full w-full object-cover" />
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
            {submitting ? 'Saving...' : 'Save Banner'}
          </button>
        </div>
      </form>
      )}

      <BannerImageCropModal
        open={cropModal.open}
        imageSrc={cropModal.src || ''}
        onClose={closeCropModal}
        onComplete={handleCroppedImage}
        maxSizeBytes={2 * 1024 * 1024}
      />
    </div>
  );
}
