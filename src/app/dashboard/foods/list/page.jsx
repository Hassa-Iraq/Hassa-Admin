'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Pencil, Search, SlidersHorizontal, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

const PER_PAGE = 20;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CATEGORY_OPTIONS = [
  { id: '1', name: 'Burgers' },
  { id: '2', name: 'Pizza' },
  { id: '3', name: 'Drinks' },
];

const SUBCATEGORY_OPTIONS = {
  1: [
    { id: '101', name: 'Chicken Burger' },
    { id: '102', name: 'Beef Burger' },
  ],
  2: [
    { id: '201', name: 'Classic Pizza' },
    { id: '202', name: 'Special Pizza' },
  ],
  3: [
    { id: '301', name: 'Cold Drinks' },
    { id: '302', name: 'Juices' },
  ],
};

export default function FoodListPage() {
  const router = useRouter();
  const [foods, setFoods] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const selectedCategoryId = Number(categoryFilter);
  const subcategoryOptions = useMemo(
    () => SUBCATEGORY_OPTIONS[selectedCategoryId] || [],
    [selectedCategoryId]
  );

  useEffect(() => {
    const toAbsoluteAssetUrl = (value) => {
      if (!value || typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
      return `${API_BASE_URL}/${trimmed}`;
    };

    const resolveText = (...values) =>
      values.find((value) => typeof value === 'string' && value.trim().length > 0) || '';

    const normalizeCategory = (item) => ({
      id: String(item?.id ?? item?.category_id ?? item?.menu_category_id ?? '').trim(),
      name: resolveText(item?.name, item?.title, ''),
      image: toAbsoluteAssetUrl(
        resolveText(item?.image_url, item?.image, item?.photo)
      ),
    });

    const normalizeItem = (item, index, categoriesById) => {
      const id = item?.id ?? item?.menu_item_id ?? item?.item_id ?? `${page}-${index}`;
      const categoryId = String(
        item?.category_id ??
        item?.menu_category_id ??
        item?.category?.id ??
        item?.menu_category?.id ??
        ''
      ).trim();
      const matchedCategory = categoriesById.get(categoryId) || null;
      const name = resolveText(item?.name, item?.title, item?.item_name, 'N/A');
      const category = resolveText(
        matchedCategory?.name,
        item?.category?.name,
        item?.category_name,
        item?.menu_category?.name,
        'N/A'
      );
      const categoryImage = toAbsoluteAssetUrl(
        resolveText(
          matchedCategory?.image,
          item?.category?.image_url,
          item?.category?.image,
          item?.menu_category?.image_url,
          item?.menu_category?.image
        )
      );
      const priceValue = Number(item?.price ?? item?.unit_price ?? 0);
      const price = Number.isFinite(priceValue) ? `$ ${priceValue.toFixed(2)}` : '$ 0.00';
      const rating = Number(item?.avg_rating ?? item?.rating ?? 0);
      const reviews = Number(item?.rating_count ?? item?.reviews_count ?? item?.total_reviews ?? 0);
      const image = toAbsoluteAssetUrl(
        resolveText(item?.image_url, item?.image, item?.photo)
      );
      const status =
        item?.is_available === true ||
        item?.is_available === 1 ||
        item?.status === true ||
        item?.status === 1 ||
        item?.status === 'active';

      return { id, name, category, categoryImage, price, rating, reviews, image, status };
    };

    const fetchFoods = async () => {
      setLoading(true);
      setFetchError('');

      try {
        const restaurantId =
          localStorage.getItem('restaurant_id') ||
          localStorage.getItem('selectedRestaurantId') ||
          '';
        const token = localStorage.getItem('token') || '';

        if (!restaurantId) {
          setFoods([]);
          setTotalCount(0);
          setFetchError('Restaurant ID not found. Please select a restaurant first.');
          return;
        }

        const params = new URLSearchParams({
          restaurant_id: restaurantId,
          page: String(page),
          limit: String(PER_PAGE),
        });
        // Temporary: backend list endpoint is currently consumed with restaurant_id + pagination only.
        // Category/subcategory filters will be sent once real UUID filter IDs are wired.

        const categoriesParams = new URLSearchParams({
          restaurant_id: restaurantId,
          page: '1',
          limit: '500',
        });

        const [{ data }, { data: categoriesData }] = await Promise.all([
          axios.get(`/api/restaurants/menu-items?${params.toString()}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          axios.get(`/api/restaurants/categories?${categoriesParams.toString()}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
        ]);

        const categoriesPayload =
          categoriesData?.data && typeof categoriesData.data === 'object'
            ? categoriesData.data
            : categoriesData;
        const categoriesList =
          categoriesPayload?.categories ||
          categoriesPayload?.list ||
          categoriesData?.categories ||
          categoriesData?.list ||
          categoriesPayload ||
          [];
        const categoriesById = new Map(
          (Array.isArray(categoriesList) ? categoriesList : [])
            .map(normalizeCategory)
            .filter((item) => Boolean(item.id))
            .map((item) => [item.id, item])
        );

        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const list =
          payload?.menu_items ||
          payload?.menuItems ||
          payload?.items ||
          payload?.list ||
          data?.menu_items ||
          data?.menuItems ||
          data?.items ||
          data?.list ||
          [];

        const normalized = (Array.isArray(list) ? list : []).map((item, index) =>
          normalizeItem(item, index, categoriesById)
        );
        setFoods(normalized);

        const total =
          payload?.pagination?.total ??
          data?.pagination?.total ??
          payload?.total ??
          data?.total ??
          payload?.total_size ??
          data?.total_size ??
          payload?.count ??
          normalized.length;
        const parsedTotal = Number(total);
        setTotalCount(Number.isFinite(parsedTotal) ? parsedTotal : normalized.length);

      } catch (error) {
        setFoods([]);
        setTotalCount(0);
        setFetchError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load menu items'
            : error?.message || 'Failed to load menu items'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [page, categoryFilter, subcategoryFilter, search]);

  const handleDeleteItem = async (menuItemId) => {
    if (!menuItemId) return;
    const confirmed = window.confirm('Are you sure you want to delete this food item?');
    if (!confirmed) return;

    try {
      setDeletingId(String(menuItemId));
      setFetchError('');
      const token = localStorage.getItem('token') || '';

      await axios.delete(`/api/restaurants/menu-items/${menuItemId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setFoods((prev) => prev.filter((item) => String(item.id) !== String(menuItemId)));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      setFetchError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to delete menu item'
          : error?.message || 'Failed to delete menu item'
      );
    } finally {
      setDeletingId('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <div className="pt-36 pb-8">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search any food..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setSubcategoryFilter('');
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 focus:border-[#7C3AED] focus:outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={subcategoryFilter}
              onChange={(event) => {
                setSubcategoryFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 focus:border-[#7C3AED] focus:outline-none"
            >
              <option value="">All Subcategories</option>
              {subcategoryOptions.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Download size={12} />
              <span>Export</span>
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <SlidersHorizontal size={12} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Category</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Price</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Average Ratings</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    Loading menu items...
                  </td>
                </tr>
              )}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-500">
                    {fetchError}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && foods.map((food, index) => (
                <tr key={food.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-xs text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 overflow-hidden rounded-lg bg-purple-100">
                        {food.image ? (
                          <img src={food.image} alt={food.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <p className="text-xs font-semibold text-[#1E1E24]">{food.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 overflow-hidden rounded-lg bg-purple-100">
                        {food.categoryImage ? (
                          <img
                            src={food.categoryImage}
                            alt={food.category}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.style.visibility = 'hidden';
                            }}
                          />
                        ) : null}
                      </div>
                      <p className="text-xs text-[#1E1E24]">{food.category}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{food.price}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                      food.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {food.status ? 'Available' : 'Out of stock'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">
                    <span className="text-[#F59E0B]">★</span>
                    {food.rating}({food.reviews})
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/foods/add?menu_item_id=${food.id}`)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#7C3AED] bg-[#F8F4FF] text-[#7C3AED]"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(food.id)}
                        disabled={deletingId === String(food.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !fetchError && foods.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    No foods found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-400">
            Showing {totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1}-
            {Math.min(page * PER_PAGE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#7C3AED] disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 text-xs font-semibold text-[#1E1E24]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#7C3AED] disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
