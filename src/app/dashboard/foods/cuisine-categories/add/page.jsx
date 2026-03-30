'use client';

import { Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { toast } from 'sonner';

const INITIAL_FORM = {
  name: '',
  displayOrder: '1',
  isActive: true,
};

export default function AddCuisineCategoryPage() {
  const router = useRouter();
  const [cuisineCategoryId, setCuisineCategoryId] = useState('');
  const isEditMode = Boolean(cuisineCategoryId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loadingItem, setLoadingItem] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCuisineCategoryId(params.get('cuisine_category_id') || '');
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const parseNumber = (value, fallback = 1) => {
    const cleaned = String(value ?? '').replace(/[^\d.]/g, '').trim();
    if (!cleaned) return fallback;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  };

  const pickFirstUrl = (...values) =>
    values.find((value) => typeof value === 'string' && value.trim().length > 0) || '';

  const toAbsoluteAssetUrl = (value) => {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
    return `${API_BASE_URL}/${trimmed}`;
  };

  const normalizeImage = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        const candidate = normalizeImage(item);
        if (candidate) return candidate;
      }
      return '';
    }
    if (typeof value === 'string' && value.trim()) return toAbsoluteAssetUrl(value);
    if (value && typeof value === 'object') {
      const pathWithKey =
        value.path && value.key
          ? `${String(value.path).replace(/\/$/, '')}/${String(value.key).replace(/^\//, '')}`
          : '';
      return (
        normalizeImage(value.full_url) ||
        normalizeImage(value.url) ||
        normalizeImage(pathWithKey) ||
        normalizeImage(value.path) ||
        normalizeImage(value.key) ||
        normalizeImage(value.image) ||
        ''
      );
    }
    return '';
  };

  const extractImageUrl = (uploadData = {}) => {
    const source = uploadData?.data && typeof uploadData.data === 'object' ? uploadData.data : uploadData;
    const assets = source?.assets && typeof source.assets === 'object' ? source.assets : source;

    return (
      normalizeImage(assets?.image_url) ||
      normalizeImage(assets?.image) ||
      normalizeImage(assets?.url) ||
      normalizeImage(assets?.path) ||
      normalizeImage(source?.image_url) ||
      normalizeImage(source?.url) ||
      normalizeImage(source?.path) ||
      ''
    );
  };

  const uploadCuisineImage = async (token) => {
    if (!imageFile) {
      throw new Error('Please upload cuisine image first.');
    }
    const formData = new FormData();
    formData.append('cuisine_category_image', imageFile);

    const response = await axios.post('/api/restaurants/admin/cuisine-categories/upload-image', formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const uploadedImageUrl = extractImageUrl(response?.data);
    if (!uploadedImageUrl) {
      throw new Error('Cuisine image upload succeeded but image URL was not returned.');
    }
    return uploadedImageUrl;
  };

  useEffect(() => {
    const loadItem = async () => {
      if (!isEditMode) return;
      setLoadingItem(true);
      try {
        const token = localStorage.getItem('token') || '';
        const { data } = await axios.get(`/api/restaurants/admin/cuisine-categories/${cuisineCategoryId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = data?.data && typeof data.data === 'object' ? data.data : data;
        const item =
          payload?.cuisine_category ||
          payload?.data?.cuisine_category ||
          payload?.category ||
          payload?.data?.category ||
          payload?.data ||
          payload;

        const normalizedImageUrl =
          normalizeImage(item?.image_url) ||
          normalizeImage(item?.image) ||
          normalizeImage(item?.assets?.image_url) ||
          normalizeImage(item?.assets?.image) ||
          normalizeImage(item?.url) ||
          normalizeImage(item?.path) ||
          toAbsoluteAssetUrl(pickFirstUrl(item?.image_url));
        setExistingImageUrl(normalizedImageUrl);
        setImagePreview(normalizedImageUrl);

        setForm({
          name: item?.name || '',
          displayOrder:
            item?.display_order !== undefined && item?.display_order !== null
              ? String(item.display_order)
              : '1',
          isActive: Boolean(item?.is_active ?? item?.isActive ?? true),
        });
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to load cuisine category'
          : error?.message || 'Failed to load cuisine category';
        toast.error(message);
      } finally {
        setLoadingItem(false);
      }
    };
    loadItem();
  }, [isEditMode, cuisineCategoryId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Cuisine name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const imageUrl = imageFile ? await uploadCuisineImage(token) : existingImageUrl;
      if (!imageUrl) {
        throw new Error('Please upload cuisine image first.');
      }

      const payload = {
        name: form.name.trim(),
        image_url: imageUrl,
        display_order: parseNumber(form.displayOrder, 1),
        is_active: Boolean(form.isActive),
      };

      const response = await axios({
        method: isEditMode ? 'patch' : 'post',
        url: isEditMode
          ? `/api/restaurants/admin/cuisine-categories/${cuisineCategoryId}`
          : '/api/restaurants/admin/cuisine-categories',
        data: payload,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      toast.success(
        response?.data?.message ||
          (isEditMode ? 'Cuisine category updated successfully.' : 'Cuisine category created successfully.')
      );
      router.push('/dashboard/foods/cuisine-categories');
    } catch (error) {
      const cleanedMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message || 'Failed to save cuisine category'
        : error?.message || 'Failed to save cuisine category';
      toast.error(cleanedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-[#1E1E24]">
            {isEditMode ? 'Update Cuisine' : 'Create Cuisine'}
          </h3>

          {loadingItem ? (
            <p className="mt-3 text-xs text-gray-500">Loading cuisine category...</p>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Cuisine Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Burgers"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Display Order</label>
                  <input
                    name="displayOrder"
                    value={form.displayOrder}
                    onChange={handleChange}
                    placeholder="1"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={Boolean(form.isActive)}
                    onChange={handleChange}
                    className="h-4 w-4 accent-[#7C3AED]"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <h4 className="text-xs font-semibold text-[#1E1E24]">Cuisine Image</h4>
              <p className="mt-1 text-[11px] text-gray-400">Upload image, then it will be used when saving cuisine.</p>

              <div
                onClick={() => imageRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer?.files?.[0];
                  if (file) handleImageSelect(file);
                }}
                className="mt-3 flex h-[165px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-[#FAFAFF] hover:border-[#7C3AED]"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="cuisine-preview" className="h-full w-full object-cover" />
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

              <p className="mt-2 text-[11px] text-gray-400">JPEG, PNG, WebP — recommended square.</p>
              <input
                ref={imageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleImageSelect(file);
                  event.target.value = '';
                }}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/foods/cuisine-categories">
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
            {submitting ? 'Saving...' : isEditMode ? 'Update Cuisine' : 'Save Cuisine'}
          </button>
        </div>
      </form>
    </div>
  );
}

