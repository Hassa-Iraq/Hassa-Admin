'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Pencil, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';

const PER_PAGE = 20;

const getShortDisplayId = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  const normalized = String(value).trim();
  if (!normalized) return fallback;
  const compact = normalized.replace(/[^a-zA-Z0-9]/g, '');
  const shortPart = (compact || normalized).slice(-4);
  return shortPart ? `ID# ${shortPart}` : fallback;
};

export default function CuisineCategoriesListPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); // All | Active | Inactive
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

    const normalizeItem = (raw, index) => {
      const rawId =
        raw?.id ?? raw?.cuisine_category_id ?? raw?.cuisineCategoryId ?? raw?.cuisine_id ?? '';
      const fallbackId = `ID# ${(page - 1) * PER_PAGE + index + 1}`;
      return {
        id: rawId || `${page}-${index}`,
        image:
          normalizeImage(raw?.image_url) ||
          normalizeImage(raw?.image) ||
          toAbsoluteAssetUrl(pickFirstUrl(raw?.image_url, raw?.image, raw?.url, raw?.path)),
        displayId: getShortDisplayId(rawId, fallbackId),
        name: raw?.name || 'N/A',
        displayOrder: Number(raw?.display_order ?? raw?.displayOrder ?? 1) || 1,
        isActive: Boolean(raw?.is_active ?? raw?.isActive ?? true),
      };
    };

    const fetchCuisineCategories = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
        });
        const { data } = await axios.get(`/api/restaurants/admin/cuisine-categories?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload = data?.data && typeof data.data === 'object' ? data.data : data;
        const list =
          payload?.cuisine_categories ||
          payload?.categories ||
          payload?.list ||
          data?.cuisine_categories ||
          data?.list ||
          payload ||
          [];
        const normalized = (Array.isArray(list) ? list : []).map(normalizeItem);
        setItems(normalized);

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
        setItems([]);
        setTotalCount(0);
        setFetchError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Failed to load cuisine categories'
            : error?.message || 'Failed to load cuisine categories'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCuisineCategories();
  }, [page]);

  const filteredItems = useMemo(() => {
    let base = items;

    if (activeFilter === 'Active') base = base.filter((item) => item.isActive);
    if (activeFilter === 'Inactive') base = base.filter((item) => !item.isActive);

    const query = search.trim().toLowerCase();
    if (query) base = base.filter((item) => item.name.toLowerCase().includes(query));

    return base;
  }, [search, items, activeFilter]);

  const handleExport = () => {
    if (!filteredItems.length) return;

    const headers = ['Sl', 'Cuisine ID', 'Cuisine Name', 'Order', 'Active'];
    const rows = filteredItems.map((item, index) => [
      index + 1,
      item.displayId,
      item.name,
      item.displayOrder,
      item.isActive ? 'Yes' : 'No',
    ]);

    const escapeCsv = (value) => {
      const raw = value === null || value === undefined ? '' : String(value);
      const needsQuotes = /[",\n]/.test(raw);
      const escaped = raw.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cuisine-categories-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const confirmed = window.confirm('Are you sure you want to delete this cuisine category?');
    if (!confirmed) return;

    try {
      setDeletingId(String(id));
      setFetchError('');
      const token = localStorage.getItem('token') || '';

      await axios.delete(`/api/restaurants/admin/cuisine-categories/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      setFetchError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to delete cuisine category'
          : error?.message || 'Failed to delete cuisine category'
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
              placeholder="Search cuisine..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
            >
              <Download size={12} />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
            >
              <SlidersHorizontal size={12} />
              <span>Filters</span>
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-11 z-10 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                <p className="mb-2 text-xs font-semibold text-gray-700">Active status</p>
                <div className="space-y-1">
                  {['All', 'Active', 'Inactive'].map((value) => (
                    <label key={value} className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <input
                        type="radio"
                        name="activeFilter"
                        value={value}
                        checked={activeFilter === value}
                        onChange={() => setActiveFilter(value)}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('All')}
                    className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-purple-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Image</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Cuisine ID</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Cuisine Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Order</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Active</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableLoadingSkeleton colSpan={7} rows={8} />}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-500">
                    {fetchError}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && filteredItems.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-xs text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="h-7 w-7 overflow-hidden rounded-lg bg-purple-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">{item.displayId}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-[#1E1E24]">{item.name}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{item.displayOrder}</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{item.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/foods/cuisine-categories/add?cuisine_category_id=${encodeURIComponent(String(item.id))}`)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === String(item.id)}
                        onClick={() => handleDelete(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-rose-500 hover:border-rose-300 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !fetchError && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    No cuisine categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

