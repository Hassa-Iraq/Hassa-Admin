'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Pencil, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';

const PER_PAGE = 20;

export default function CategoryListPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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

    const pickFirstUrl = (...values) =>
      values.find((value) => typeof value === 'string' && value.trim().length > 0) || '';

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

    const normalizeCategory = (item, index) => ({
      id: item?.id ?? `${page}-${index}`,
      image:
        normalizeImage(item?.image_url) ||
        normalizeImage(item?.imageUrl) ||
        normalizeImage(item?.image_full_url) ||
        normalizeImage(item?.imageFullUrl) ||
        normalizeImage(item?.image) ||
        toAbsoluteAssetUrl(
        pickFirstUrl(
          item?.image_url,
          item?.image,
          item?.url
        )
      ),
      categoryId: (page - 1) * PER_PAGE + index + 1,
      name: item?.name || 'N/A',
    });

    const fetchCategories = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const restaurantId =
          localStorage.getItem('restaurant_id') ||
          localStorage.getItem('selectedRestaurantId') ||
          '';
        const token = localStorage.getItem('token') || '';

        if (!restaurantId) {
          setCategories([]);
          setTotalCount(0);
          setFetchError('Restaurant ID not found. Please select restaurant first.');
          return;
        }

        const params = new URLSearchParams({
          restaurant_id: restaurantId,
          page: String(page),
          limit: String(PER_PAGE),
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
        const normalized = (Array.isArray(list) ? list : []).map(normalizeCategory);
        setCategories(normalized);

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
        setCategories([]);
        setTotalCount(0);
        setFetchError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load categories'
            : error?.message || 'Failed to load categories'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [page]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((item) => item.name.toLowerCase().includes(query));
  }, [search, categories]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId) return;
    const confirmed = window.confirm('Are you sure you want to delete this category?');
    if (!confirmed) return;

    try {
      setDeletingId(String(categoryId));
      setFetchError('');
      const token = localStorage.getItem('token') || '';

      await axios.delete(`/api/restaurants/categories/${categoryId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setCategories((prev) => prev.filter((item) => String(item.id) !== String(categoryId)));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      setFetchError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to delete category'
          : error?.message || 'Failed to delete category'
      );
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="pt-36 pb-8">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search any category..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
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
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Image</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Category ID</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Category Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    Loading categories...
                  </td>
                </tr>
              )}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-red-500">
                    {fetchError}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && filteredCategories.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-xs text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="h-7 w-7 overflow-hidden rounded-lg bg-purple-100">
                      <img
                        src={item.image || null}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.categoryId}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.name}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/foods/categories/add?category_id=${item.id}`)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#7C3AED] bg-[#F8F4FF] text-[#7C3AED]"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(item.id)}
                        disabled={deletingId === String(item.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !fetchError && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    No categories found.
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
