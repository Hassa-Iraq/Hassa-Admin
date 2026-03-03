'use client';

import { Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

const INITIAL_FORM = {
  parentId: '',
  name: '',
  description: '',
  displayOrder: '1',
};

export default function AddCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category_id') || '';
  const isEditMode = Boolean(categoryId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const imageRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const parseId = (value) => {
    const raw = String(value ?? '').trim();
    return raw ? raw : null;
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

  const extractImageUrl = (uploadData = {}) => {
    const source = uploadData?.data && typeof uploadData.data === 'object'
      ? uploadData.data
      : uploadData;
    const assets = source?.assets && typeof source.assets === 'object'
      ? source.assets
      : source;

    return toAbsoluteAssetUrl(
      pickFirstUrl(
        assets?.image_url,
        assets?.image,
        assets?.url,
        assets?.path,
        source?.image_url,
        source?.url,
        source?.path
      )
    );
  };

  const uploadCategoryImage = async (token) => {
    if (!imageFile) {
      throw new Error('Please upload category image first.');
    }

    const formData = new FormData();
    formData.append('category_image', imageFile);

    const response = await axios.post('/api/restaurants/menu-categories/uploads/image', formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const uploadedImageUrl = extractImageUrl(response?.data);
    if (!uploadedImageUrl) {
      throw new Error('Category image upload succeeded but image URL was not returned.');
    }
    return uploadedImageUrl;
  };

  useEffect(() => {
    const loadCategory = async () => {
      if (!isEditMode) return;

      setLoadingCategory(true);
      setApiError('');
      try {
        const token = localStorage.getItem('token') || '';
        const { data } = await axios.get(`/api/restaurants/categories/${categoryId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const category =
          payload?.category ||
          payload?.menu_category ||
          payload;

        const normalizedImageUrl = toAbsoluteAssetUrl(
          pickFirstUrl(
            category?.image_url,
            category?.image,
            category?.url,
            category?.path
          )
        );
        setExistingImageUrl(normalizedImageUrl);
        setImagePreview(normalizedImageUrl);

        setForm({
          parentId: category?.parent_id ? String(category.parent_id) : '',
          name: category?.name || '',
          description: category?.description || '',
          displayOrder:
            category?.display_order !== undefined && category?.display_order !== null
              ? String(category.display_order)
              : '1',
        });
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to load category'
          : error?.message || 'Failed to load category';
        setApiError(message);
      } finally {
        setLoadingCategory(false);
      }
    };

    loadCategory();
  }, [isEditMode, categoryId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');
    setApiSuccess('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const restaurantIdFromStorage =
        localStorage.getItem('restaurant_id') ||
        localStorage.getItem('selectedRestaurantId') ||
        '';
      const resolvedRestaurantId = parseId(restaurantIdFromStorage);
      if (!resolvedRestaurantId) {
        throw new Error('Restaurant ID not found in local storage. Please login/select restaurant again.');
      }
      const imageUrl = imageFile ? await uploadCategoryImage(token) : existingImageUrl;
      if (!imageUrl) {
        throw new Error('Please upload category image first.');
      }

      const payload = {
        restaurant_id: resolvedRestaurantId,
        parent_id: parseId(form.parentId),
        name: form.name.trim() || '',
        description: form.description.trim() || '',
        image_url: imageUrl,
        display_order: parseNumber(form.displayOrder, 1),
      };

      const response = await axios({
        method: isEditMode ? 'put' : 'post',
        url: isEditMode
          ? `/api/restaurants/categories/${categoryId}`
          : '/api/restaurants/categories',
        data: payload,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setApiSuccess(
        response?.data?.message ||
        (isEditMode ? 'Category updated successfully.' : 'Category created successfully.')
      );
      if (isEditMode) {
        router.push('/dashboard/foods/categories');
      }
    } catch (error) {
      const cleanedMessage = axios.isAxiosError(error)
        ? (error.response?.data?.message || error.message || 'Failed to save category')
        : (error?.message || 'Failed to save category');
      setApiError(cleanedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {loadingCategory && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Loading category details...
          </div>
        )}
        {apiError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {apiError}
          </div>
        )}
        {apiSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {apiSuccess}
          </div>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-[#1E1E24]">Add Category</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">
                    Parent Category ID (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="parentId"
                    value={form.parentId}
                    onChange={handleChange}
                    placeholder="Leave empty for main category"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Category Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Burgers"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="All burgers"
                  className="min-h-[90px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div className="max-w-[220px]">
                <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Display Order</label>
                <input
                  name="displayOrder"
                  value={form.displayOrder}
                  onChange={handleChange}
                  placeholder="1"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <h4 className="text-xs font-semibold text-[#1E1E24]">Category Image</h4>
              <p className="mt-1 text-[11px] text-gray-400">Upload category image here</p>

              <div
                onClick={() => imageRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer?.files?.[0];
                  if (file) handleImageSelect(file);
                }}
                className="mt-3 flex h-[165px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-[#FAFAFF] hover:border-[#7C3AED]"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="category-preview" className="h-full w-full rounded-lg object-cover" />
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

              <p className="mt-2 text-[11px] text-gray-400">Jpeg, Jpg, Png, Webp Image : Max 2 MB (1:1)</p>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
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
          <Link href="/dashboard/foods/categories">
            <button
              type="button"
              className="rounded-lg border border-[#D8B4FE] bg-white px-5 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
            >
              Back
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting || loadingCategory}
            className="rounded-lg bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : (isEditMode ? 'Update Category' : 'Save Category')}
          </button>
        </div>
      </form>
    </div>
  );
}
