'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Upload } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/app/lib/apiErrorMessage';
import MenuItemOptionGroupsPanel from '@/app/components/MenuItemOptionGroupsPanel';

const INITIAL_FORM = {
  itemName: '',
  shortDescription: '',
  categoryId: '',
  subcategoryId: '',
  unitPrice: '',
  nutritionCalories: '',
  nutritionProtein: '',
  tags: '',
  isAvailable: true,
  displayOrder: '1',
};

function extractCreatedMenuItemId(responseData) {
  if (!responseData || typeof responseData !== 'object') return '';
  const tryId = (v) => (v != null && String(v).trim() ? String(v).trim() : '');
  const root =
    responseData?.data && typeof responseData.data === 'object' ? responseData.data : responseData;
  const item = root?.menu_item ?? root?.menuItem ?? root?.item ?? root;
  const chain = [
    tryId(responseData.menu_item_id),
    tryId(responseData.id),
    tryId(root?.menu_item_id),
    tryId(root?.id),
    tryId(item?.id),
    tryId(item?.menu_item_id),
    tryId(responseData.data?.menu_item_id),
    tryId(responseData.data?.id),
  ];
  const found = chain.find(Boolean);
  return found || '';
}

export default function AddFoodPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuItemId = String(searchParams.get('menu_item_id') || '').trim();
  const isEditMode = Boolean(menuItemId);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loadingItem, setLoadingItem] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const imageRef = useRef(null);

  const selectedCategoryId = String(form.categoryId || '');
  const categoryOptions = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );
  const subcategoryOptions = useMemo(
    () => categories.filter((category) => String(category.parentId) === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'categoryId') {
        next.subcategoryId = '';
      }
      return next;
    });
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) handleImageSelect(file);
  };

  const parseId = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    return raw;
  };

  const parseNumber = (value, fallback = null) => {
    const n = Number(String(value ?? '').replace(/[^\d.]/g, ''));
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

    return toAbsoluteAssetUrl(pickFirstUrl(
      assets?.image_url,
      assets?.image,
      assets?.url,
      assets?.path,
      source?.image_url,
      source?.url,
      source?.path
    ));
  };

  const uploadMenuImage = async (token) => {
    if (!imageFile) return '';

    const formData = new FormData();
    formData.append('menu_item_image', imageFile);

    const response = await axios.post('/api/restaurants/menu-items/uploads/image', formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const uploadedImageUrl = extractImageUrl(response?.data);
    if (!uploadedImageUrl) {
      throw new Error('Menu image upload succeeded but image URL was not returned.');
    }
    return uploadedImageUrl;
  };

  useEffect(() => {
    const normalizeCategory = (item, index, fallbackParentId = '') => {
      const rawId = item?.id ?? item?.category_id ?? item?.menu_category_id ?? '';
      const id = String(rawId || '').trim();
      const parentId = item?.parent_id
        ? String(item.parent_id)
        : (fallbackParentId ? String(fallbackParentId) : '');
      return {
        id,
        name: String(item?.name || item?.title || '').trim() || 'Untitled Category',
        parentId,
      };
    };
    const collectSubcategories = (category) => {
      const collections = [
        category?.subcategories,
        category?.sub_categories,
        category?.subCategories,
        category?.children,
      ];
      const firstArray = collections.find((value) => Array.isArray(value));
      return Array.isArray(firstArray) ? firstArray : [];
    };

    const loadCategories = async () => {
      setCategoriesLoading(true);

      try {
        const restaurantId =
          localStorage.getItem('restaurant_id') ||
          localStorage.getItem('selectedRestaurantId') ||
          '';
        const token = localStorage.getItem('token') || '';

        if (!restaurantId) {
          setCategories([]);
          toast.error('Restaurant ID not found. Please select restaurant first.');
          return;
        }

        const params = new URLSearchParams({
          restaurant_id: restaurantId,
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
        const rawList = Array.isArray(list) ? list : [];

        const normalizedFromRoot = rawList.map((item, index) =>
          normalizeCategory(item, index)
        );

        const normalizedFromNested = rawList.flatMap((item, parentIndex) => {
          const parentId = String(item?.id || item?.category_id || item?.menu_category_id || '');
          return collectSubcategories(item).map((sub, subIndex) =>
            normalizeCategory(sub, parentIndex * 1000 + subIndex, parentId)
          );
        });

        const uniqueById = new Map();
        [...normalizedFromRoot, ...normalizedFromNested]
          .filter((category) => Boolean(category.id))
          .forEach((category) => {
            if (!uniqueById.has(String(category.id))) {
              uniqueById.set(String(category.id), category);
            }
          });

        setCategories(Array.from(uniqueById.values()));
      } catch (error) {
        setCategories([]);
        const message = axios.isAxiosError(error)
          ? apiErrorMessage(error, 'Failed to load categories')
          : error?.message || 'Failed to load categories';
        toast.error(message);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadMenuItem = async () => {
      if (!isEditMode) return;

      setLoadingItem(true);
      try {
        const token = localStorage.getItem('token') || '';
        const { data } = await axios.get(`/api/restaurants/menu-items/${menuItemId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const item =
          payload?.menu_item ||
          payload?.menuItem ||
          payload?.item ||
          payload;

        const normalizedImageUrl = toAbsoluteAssetUrl(
          pickFirstUrl(
            item?.image_url,
            item?.image,
            item?.photo
          )
        );
        setExistingImageUrl(normalizedImageUrl);
        setImagePreview(normalizedImageUrl);

        const calories = item?.nutrition?.calories;
        const protein = item?.nutrition?.protein_g;
        const searchTags = Array.isArray(item?.search_tags) ? item.search_tags.join(', ') : '';

        setForm({
          itemName: item?.name || '',
          shortDescription: item?.description || '',
          categoryId: item?.category_id ? String(item.category_id) : '',
          subcategoryId: item?.subcategory_id ? String(item.subcategory_id) : '',
          unitPrice: item?.price !== undefined && item?.price !== null ? String(item.price) : '',
          nutritionCalories: calories !== undefined && calories !== null ? String(calories) : '',
          nutritionProtein: protein !== undefined && protein !== null ? String(protein) : '',
          tags: searchTags,
          isAvailable:
            item?.is_available === true ||
            item?.is_available === 1 ||
            item?.status === true ||
            item?.status === 1 ||
            item?.status === 'active',
          displayOrder:
            item?.display_order !== undefined && item?.display_order !== null
              ? String(item.display_order)
              : '1',
        });
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? apiErrorMessage(error, 'Failed to load menu item')
          : error?.message || 'Failed to load menu item';
        toast.error(message);
      } finally {
        setLoadingItem(false);
      }
    };

    loadMenuItem();
  }, [isEditMode, menuItemId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const restaurantIdCandidate =
        localStorage.getItem('restaurant_id') ||
        localStorage.getItem('selectedRestaurantId') ||
        '';
      if (!isEditMode && !imageFile) {
        throw new Error('Please upload menu item image first.');
      }
      const uploadedImageUrl = imageFile
        ? await uploadMenuImage(token)
        : existingImageUrl;
      if (!uploadedImageUrl) {
        throw new Error('Please upload menu item image first.');
      }

      const nutrition = {};
      const calories = parseNumber(form.nutritionCalories, null);
      const protein = parseNumber(form.nutritionProtein, null);
      if (calories !== null) nutrition.calories = calories;
      if (protein !== null) nutrition.protein_g = protein;
      const restaurantId = parseId(restaurantIdCandidate);
      const categoryId = parseId(form.categoryId);
      const subcategoryId = parseId(form.subcategoryId);

      const payload = {
        restaurant_id: restaurantId,
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(subcategoryId ? { subcategory_id: subcategoryId } : {}),
        name: form.itemName.trim() || '',
        description: form.shortDescription.trim() || '',
        price: parseNumber(form.unitPrice, 0),
        image_url: uploadedImageUrl,
        nutrition,
        search_tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        is_available: Boolean(form.isAvailable),
        display_order: parseNumber(form.displayOrder, 1),
      };

      const response = await axios({
        method: isEditMode ? 'put' : 'post',
        url: isEditMode
          ? `/api/restaurants/menu-items/${menuItemId}`
          : '/api/restaurants/menu-items',
        data: payload,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      toast.success(
        response?.data?.message ||
        (isEditMode ? 'Food item updated successfully.' : 'Food item created successfully.')
      );
      if (!isEditMode) {
        const newId = extractCreatedMenuItemId(response?.data);
        if (newId) {
          toast.info('Next: add option groups & add-ons for this item.');
          router.push(`/dashboard/foods/add?menu_item_id=${encodeURIComponent(newId)}`);
          return;
        }
        toast.warning(
          'Item was created. Open it from the food list to add options & add-ons if the ID was not returned.'
        );
        router.push('/dashboard/foods/list');
        return;
      }
      return;
    } catch (error) {
      const cleanedMessage = axios.isAxiosError(error)
        ? apiErrorMessage(error, 'Failed to save menu item')
        : error?.message || 'Failed to save menu item';
      toast.error(cleanedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEditMode) return;
    setForm(INITIAL_FORM);
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return '';
    });
  };

  return (
    <div className="pt-36 pb-8">
      {isEditMode ? (
        <div className="mb-4">
          <Link
            href="/dashboard/foods/list"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9]"
          >
            <ChevronLeft size={16} />
            Back to list
          </Link>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {loadingItem && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Loading menu item details...
          </div>
        )}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <FormField label="Name">
                <Input name="itemName" value={form.itemName} onChange={handleChange} placeholder="Ex: Zinger Burger" />
              </FormField>

              <FormField label="Short description">
                <textarea
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  placeholder="Crispy chicken zinger"
                  className="min-h-[78px] w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
                />
              </FormField>

            </div>

            <div className="rounded-xl border border-gray-200 p-3">
              <h3 className="text-xs font-semibold text-[#1E1E24]">Food Image</h3>
              <p className="mt-1 text-[11px] text-gray-400">Upload your item image here</p>

              <div
                onClick={() => imageRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="mt-3 flex h-[165px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-[#FAFAFF] hover:border-[#7C3AED]"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt={imageFile?.name || 'food-preview'} className="h-full w-full rounded-lg object-cover" />
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

        <Card title="Restaurant & Category Info">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Category">
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                disabled={categoriesLoading}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="">
                  {categoriesLoading ? 'Loading categories...' : 'Select Category'}
                </option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Sub Category">
              <select
                name="subcategoryId"
                value={form.subcategoryId}
                onChange={handleChange}
                disabled={!form.categoryId || categoriesLoading}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="">Select Sub Category</option>
                {subcategoryOptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </Card>

        <Card title="Nutrition">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Calories">
              <Input
                name="nutritionCalories"
                value={form.nutritionCalories}
                onChange={handleChange}
                placeholder="520"
              />
            </FormField>
            <FormField label="Protein (g)">
              <Input
                name="nutritionProtein"
                value={form.nutritionProtein}
                onChange={handleChange}
                placeholder="24"
              />
            </FormField>
          </div>
        </Card>

        <Card title="Search tags">
          <Input name="tags" value={form.tags} onChange={handleChange} placeholder="burger, chicken, spicy" />
        </Card>

        <Card title="Price & Display">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="Unit Price">
              <Input name="unitPrice" value={form.unitPrice} onChange={handleChange} placeholder="699" />
            </FormField>
            <FormField label="Display Order">
              <Input name="displayOrder" value={form.displayOrder} onChange={handleChange} placeholder="1" />
            </FormField>
            <FormField label="Availability">
              <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={form.isAvailable}
                  onChange={handleChange}
                />
                <span>Is Available</span>
              </label>
            </FormField>
          </div>
        </Card>

        {isEditMode && menuItemId ? (
          <MenuItemOptionGroupsPanel menuItemId={menuItemId} />
        ) : (
          <section className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
            <h3 className="text-xs font-semibold text-[#1E1E24]">Options &amp; Add-ons</h3>
            <p className="mt-1 text-[11px] text-gray-500">
              Configure these after you save — you’ll be taken to the editor for this item.
            </p>
          </section>
        )}

        <div className="flex justify-end gap-3">
          {!isEditMode ? (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-[#D8B4FE] bg-white px-5 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
            >
              Reset
            </button>
          ) : null}
          <button
            type="submit"
            disabled={submitting || loadingItem}
            className="rounded-lg bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : (isEditMode ? 'Save changes' : 'Create menu item')}
          </button>
        </div>
      </form>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-xs font-semibold text-[#1E1E24]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      {label && <label className="mb-1.5 block text-[11px] font-medium text-gray-700">{label}</label>}
      {children}
    </div>
  );
}

function Input({ name, value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
    />
  );
}

