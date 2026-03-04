'use client';

import Link from 'next/link';
import { Upload } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/app/config';

export default function AddSubcategoryPage() {
  const router = useRouter();
  const [subcategoryId, setSubcategoryId] = useState('');
  const isEditMode = Boolean(subcategoryId);
  const [restaurantId, setRestaurantId] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [loadingSubcategory, setLoadingSubcategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const imageRef = useRef(null);

  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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

  const uploadSubcategoryImage = async (token) => {
    if (!imageFile) {
      throw new Error('Please upload subcategory image first.');
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
      throw new Error('Subcategory image upload succeeded but image URL was not returned.');
    }
    return uploadedImageUrl;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSubcategoryId(params.get('category_id') || '');
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      const id =
        localStorage.getItem('restaurant_id') ||
        localStorage.getItem('selectedRestaurantId') ||
        '';
      setRestaurantId(id);

      if (!id) {
        setCategories([]);
        return;
      }

      setCategoriesLoading(true);
      setApiError('');

      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          restaurant_id: id,
          page: '1',
          limit: '500',
        });

        const { data } = await axios.get(`/api/restaurants/categories?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const list =
          payload?.categories ||
          payload?.list ||
          data?.categories ||
          data?.list ||
          payload ||
          [];

        const normalized = (Array.isArray(list) ? list : [])
          .map((item) => ({
            id: String(item?.id || '').trim(),
            name: String(item?.name || item?.title || '').trim() || 'Untitled Category',
            parentId: item?.parent_id ? String(item.parent_id) : '',
          }))
          .filter((item) => item.id && !item.parentId);

        setCategories(normalized);
      } catch (error) {
        setCategories([]);
        setApiError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load categories'
            : error?.message || 'Failed to load categories'
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const loadSubcategory = async () => {
      if (!isEditMode) return;

      setLoadingSubcategory(true);
      setApiError('');
      try {
        const token = localStorage.getItem('token') || '';
        const { data } = await axios.get(`/api/restaurants/categories/${subcategoryId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const subcategory =
          payload?.category ||
          payload?.menu_category ||
          payload;

        const normalizedImageUrl = toAbsoluteAssetUrl(
          pickFirstUrl(
            subcategory?.image_url,
            subcategory?.image,
            subcategory?.url,
            subcategory?.path
          )
        );

        setExistingImageUrl(normalizedImageUrl);
        setImagePreview(normalizedImageUrl);
        setParentCategoryId(
          subcategory?.parent_id ? String(subcategory.parent_id) : ''
        );
        setName(subcategory?.name || '');
        setDescription(subcategory?.description || '');
      } catch (error) {
        setApiError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load subcategory'
            : error?.message || 'Failed to load subcategory'
        );
      } finally {
        setLoadingSubcategory(false);
      }
    };

    loadSubcategory();
  }, [isEditMode, subcategoryId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');
    setApiSuccess('');

    if (!restaurantId) {
      setApiError('Restaurant ID not found. Please select restaurant first.');
      return;
    }
    if (!parentCategoryId) {
      setApiError('Please select a parent category.');
      return;
    }
    if (!name.trim()) {
      setApiError('Please enter subcategory name.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const imageUrl = imageFile
        ? await uploadSubcategoryImage(token)
        : existingImageUrl;
      if (!imageUrl) {
        throw new Error('Please upload subcategory image first.');
      }
      const payload = {
        restaurant_id: restaurantId,
        parent_id: parentCategoryId,
        name: name.trim(),
        description: description.trim(),
        image_url: imageUrl,
        display_order: 1,
      };

      const response = await axios({
        method: isEditMode ? 'put' : 'post',
        url: isEditMode
          ? `/api/restaurants/categories/${subcategoryId}`
          : '/api/restaurants/categories',
        data: payload,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setApiSuccess(
        response?.data?.message ||
        (isEditMode ? 'Subcategory updated successfully.' : 'Subcategory created successfully.')
      );
      setName('');
      setDescription('');
      setImageFile(null);
      setImagePreview('');
      setExistingImageUrl('');
      setParentCategoryId('');
      router.push('/dashboard/foods/sub-categories');
    } catch (error) {
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to save subcategory'
          : error?.message || 'Failed to save subcategory'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-36 pb-8">
      <form onSubmit={handleSubmit}>
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-[#1E1E24]">
            {isEditMode ? 'Update Subcategory' : 'Add Subcategory'}
          </h3>

          {loadingSubcategory && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Loading subcategory details...
            </div>
          )}

          {apiError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {apiError}
            </div>
          )}
          {apiSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {apiSuccess}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Parent Category</label>
                  <select
                    value={parentCategoryId}
                    onChange={(e) => setParentCategoryId(e.target.value)}
                    disabled={categoriesLoading}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none disabled:bg-gray-50"
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select Parent Category'}
                    </option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Subcategory Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Subcategory Name"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter Subcategory Description"
                  className="min-h-[90px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <h4 className="text-xs font-semibold text-[#1E1E24]">Subcategory Image</h4>
              <p className="mt-1 text-[11px] text-gray-400">Upload subcategory image here</p>

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
                  <img src={imagePreview} alt="subcategory-preview" className="h-full w-full rounded-lg object-cover" />
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

          <div className="mt-4 flex justify-end gap-2">
            <Link href="/dashboard/foods/sub-categories">
              <button
                type="button"
                className="rounded-lg border border-[#D8B4FE] bg-white px-5 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
              >
                Back
              </button>
            </Link>
            <button
              type="submit"
              disabled={submitting || categoriesLoading || loadingSubcategory}
              className="rounded-lg bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : (isEditMode ? 'Update Subcategory' : 'Save Subcategory')}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
