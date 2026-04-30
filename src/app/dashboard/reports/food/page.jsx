'use client';

import { Download, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/app/config';

const toNumber = (value) => {
  const n =
    typeof value === 'number'
      ? value
      : Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const safeStr = (value) => {
  const s = value == null ? '' : String(value);
  return s.trim();
};

const formatIQD = (value) => {
  const n = toNumber(value);
  return `IQD ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const toAbsoluteUrl = (value) => {
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
  if (typeof value === 'string' && value.trim()) return toAbsoluteUrl(value);
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
      normalizeImage(value.logo) ||
      ''
    );
  }
  return '';
};

export default function FoodReportPage() {
  const [categoryId, setCategoryId] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [tableSearch, setTableSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [averageYearlySales, setAverageYearlySales] = useState(0);
  const [chart, setChart] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const dropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const abortRef = useRef(null);
  const lastLoadRef = useRef({ key: '', at: 0 });

  useEffect(() => {
    if (!restaurantDropdownOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setRestaurantDropdownOpen(false);
    };
    const onPointerDown = (e) => {
      const el = dropdownRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setRestaurantDropdownOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [restaurantDropdownOpen]);

  useEffect(() => {
    if (!categoryDropdownOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setCategoryDropdownOpen(false);
    };
    const onPointerDown = (e) => {
      const el = categoryDropdownRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setCategoryDropdownOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [categoryDropdownOpen]);

  useEffect(() => {
    let cancelled = false;
    const fetchRestaurants = async () => {
      setRestaurantsLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({ page: '1', limit: '200' });
        const res = await fetch(`/api/restaurants?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Failed to load restaurants');

        const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload || {};
        const list = source?.restaurants || source?.list || source?.data || payload?.restaurants || payload?.list || [];
        const normalized = (Array.isArray(list) ? list : [])
          .map((r) => {
            const id = safeStr(r?.id ?? r?.restaurant_id ?? r?.restaurantId);
            const name = safeStr(r?.name ?? r?.restaurant_name ?? r?.restaurantName);
            const image =
              normalizeImage(r?.logo_url) ||
              normalizeImage(r?.logoUrl) ||
              normalizeImage(r?.logo_full_url) ||
              normalizeImage(r?.logo) ||
              normalizeImage(r?.image_full_url) ||
              normalizeImage(r?.image) ||
              '';
            return id ? { id, name: name || id, image } : null;
          })
          .filter(Boolean);
        if (!cancelled) setRestaurants(normalized);
      } catch {
        if (!cancelled) setRestaurants([]);
      } finally {
        if (!cancelled) setRestaurantsLoading(false);
      }
    };
    fetchRestaurants();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Restaurant change should reset category filter.
    setCategoryId('');
    setCategorySearch('');
    setCategoryDropdownOpen(false);
  }, [restaurantId]);

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      const rid = restaurantId.trim();
      if (!rid) {
        setCategories([]);
        return;
      }
      setCategoriesLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          restaurant_id: rid,
          page: '1',
          limit: '20',
        });
        const res = await fetch(`/api/restaurants/categories?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Failed to load categories');

        const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload || {};
        const list = source?.categories || source?.list || source?.data || payload?.categories || payload?.list || [];
        const normalized = (Array.isArray(list) ? list : [])
          .map((c) => {
            const id = safeStr(c?.id ?? c?.category_id ?? c?.categoryId);
            const name = safeStr(c?.name ?? c?.category_name ?? c?.categoryName);
            const image = normalizeImage(c?.image_url) || normalizeImage(c?.image) || '';
            return id ? { id, name: name || id, image } : null;
          })
          .filter(Boolean);

        if (!cancelled) setCategories(normalized);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const selectedRestaurant = useMemo(() => {
    if (!restaurantId) return null;
    return restaurants.find((r) => r.id === restaurantId) || null;
  }, [restaurantId, restaurants]);

  const selectedCategory = useMemo(() => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId) || null;
  }, [categoryId, categories]);

  const filteredRestaurants = useMemo(() => {
    const q = restaurantSearch.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => (r.name || '').toLowerCase().includes(q));
  }, [restaurantSearch, restaurants]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [categorySearch, categories]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    const rid = restaurantId.trim();
    if (rid) params.set('restaurant_id', rid);
    const cid = categoryId.trim();
    if (cid) params.set('category_id', cid);
    return params;
  }, [categoryId, limit, page, restaurantId]);

  const load = async (params = queryParams) => {
    const key = params?.toString?.() ? params.toString() : '';
    const now = Date.now();
    // React 18 StrictMode runs effects twice in dev; avoid duplicate identical calls.
    if (key && lastLoadRef.current.key === key && now - lastLoadRef.current.at < 800) {
      return;
    }
    lastLoadRef.current = { key, at: now };

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || '';
      const url = `/api/admin/reports/food${params?.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to fetch food report');

      const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload || {};
      setAverageYearlySales(toNumber(data?.average_yearly_sales));
      setChart(Array.isArray(data?.chart) ? data.chart : []);
      setItems(Array.isArray(data?.items) ? data.items : []);
      const p = data?.pagination || {};
      setPagination({
        page: Number(p?.page ?? page) || 1,
        limit: Number(p?.limit ?? limit) || limit,
        total: Number(p?.total ?? 0) || 0,
        totalPages: Number(p?.totalPages ?? p?.total_pages ?? 1) || 1,
      });
    } catch (e) {
      if (e?.name === 'AbortError') return;
      setAverageYearlySales(0);
      setChart([]);
      setItems([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
      setError(e?.message || 'Failed to fetch food report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, restaurantId, limit]);

  const visibleItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return items;
    return (Array.isArray(items) ? items : []).filter((it) =>
      safeStr(it?.name).toLowerCase().includes(q)
    );
  }, [items, tableSearch]);

  const exportRows = () => {
    const headers = [
      'Sl',
      'Menu Item ID',
      'Name',
      'Restaurant',
      'Order Count',
      'Price',
      'Total Amount Sold',
      'Total Discount Given',
      'Average Sale Value',
      'Average Rating',
      'Image URL',
    ];

    const escapeCsv = (v) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [
      headers.map(escapeCsv).join(','),
      ...visibleItems.map((it, idx) => {
        const row = [
          idx + 1,
          safeStr(it?.menu_item_id),
          safeStr(it?.name),
          safeStr(it?.restaurant_name),
          toNumber(it?.order_count),
          toNumber(it?.price),
          toNumber(it?.total_amount_sold),
          toNumber(it?.total_discount_given),
          toNumber(it?.average_sale_value),
          toNumber(it?.average_rating),
          safeStr(it?.image_url),
        ];
        return row.map(escapeCsv).join(',');
      }),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'food-report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const chartBars = useMemo(() => {
    const list = (Array.isArray(chart) ? chart : [])
      .map((c) => ({
        year: safeStr(c?.year),
        value: toNumber(c?.total_amount_sold),
      }))
      .filter((c) => c.year);
    return list;
  }, [chart]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-[11px] font-semibold text-[#1E1E24]">Search Data</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs disabled:opacity-60"
              onClick={() => setRestaurantDropdownOpen((v) => !v)}
              disabled={restaurantsLoading}
            >
              <span className="flex min-w-0 items-center gap-2">
                {selectedRestaurant?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedRestaurant.image}
                    alt=""
                    className="h-5 w-5 flex-none rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <span className="h-5 w-5 flex-none rounded-full border border-gray-200 bg-gray-50" />
                )}
                <span className="min-w-0 truncate">
                  {restaurantsLoading ? 'Loading restaurants...' : selectedRestaurant?.name || 'All Restaurants'}
                </span>
              </span>
              <span className="text-gray-400">▾</span>
            </button>

            {restaurantDropdownOpen ? (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-100 p-2">
                  <input
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                    placeholder="Search restaurant..."
                    value={restaurantSearch}
                    onChange={(e) => setRestaurantSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-auto py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                    onClick={() => {
                      setRestaurantId('');
                      setRestaurantDropdownOpen(false);
                      setRestaurantSearch('');
                    }}
                  >
                    <span className="h-5 w-5 flex-none rounded-full border border-gray-200 bg-gray-50" />
                    <span className="truncate">All Restaurants</span>
                  </button>
                  {filteredRestaurants.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500">No restaurants found.</div>
                  ) : (
                    filteredRestaurants.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                        onClick={() => {
                          setRestaurantId(r.id);
                          setRestaurantDropdownOpen(false);
                          setRestaurantSearch('');
                        }}
                        title={r.name}
                      >
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.image}
                            alt=""
                            className="h-5 w-5 flex-none rounded-full border border-gray-200 object-cover"
                          />
                        ) : (
                          <span className="h-5 w-5 flex-none rounded-full border border-gray-200 bg-gray-50" />
                        )}
                        <span className="min-w-0 truncate">{r.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs disabled:opacity-60"
              onClick={() => setCategoryDropdownOpen((v) => !v)}
              disabled={categoriesLoading || !restaurantId.trim()}
              title={!restaurantId.trim() ? 'Select restaurant first' : ''}
            >
              <span className="flex min-w-0 items-center gap-2">
                {selectedCategory?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedCategory.image}
                    alt=""
                    className="h-5 w-5 flex-none rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <span className="h-5 w-5 flex-none rounded-full border border-gray-200 bg-gray-50" />
                )}
                <span className="min-w-0 truncate">
                  {!restaurantId.trim()
                    ? 'Select restaurant first'
                    : categoriesLoading
                    ? 'Loading categories...'
                    : selectedCategory?.name || 'All Categories'}
                </span>
              </span>
              <span className="text-gray-400">▾</span>
            </button>

            {categoryDropdownOpen ? (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-100 p-2">
                  <input
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                    placeholder="Search category..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-auto py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                    onClick={() => {
                      setCategoryId('');
                      setCategoryDropdownOpen(false);
                      setCategorySearch('');
                    }}
                  >
                    <span className="h-5 w-5 flex-none rounded-full border border-gray-200 bg-gray-50" />
                    <span className="truncate">All Categories</span>
                  </button>
                  {filteredCategories.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500">No categories found.</div>
                  ) : (
                    filteredCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-gray-50"
                        onClick={() => {
                          setCategoryId(c.id);
                          setCategoryDropdownOpen(false);
                          setCategorySearch('');
                        }}
                        title={c.name}
                      >
                        {c.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.image}
                            alt=""
                            className="h-5 w-5 flex-none rounded-full border border-gray-200 object-cover"
                          />
                        ) : (
                          <span className="h-5 w-5 flex-none rounded-full border border-gray-200 bg-gray-50" />
                        )}
                        <span className="min-w-0 truncate">{c.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <button
            onClick={() => {
              // Fetch is driven by query param changes; button is just a UX affordance.
              setRestaurantDropdownOpen(false);
              setCategoryDropdownOpen(false);
            }}
            className="w-full justify-self-stretch rounded-md bg-[#6D28D9] px-8 py-2 text-sm font-medium text-white disabled:opacity-60 md:w-auto md:justify-self-end"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Filter'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600">
          <div>
            Showing <span className="font-semibold text-gray-800">{visibleItems.length}</span> of{' '}
            <span className="font-semibold text-gray-800">{pagination.total}</span> items
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Prev
            </button>
            <span>
              Page <span className="font-semibold text-gray-800">{pagination.page}</span> /{' '}
              <span className="font-semibold text-gray-800">{pagination.totalPages}</span>
            </span>
            <button
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
              disabled={loading || page >= (pagination.totalPages || 1)}
            >
              Next
            </button>
            <select
              className="rounded-md border border-gray-200 bg-white px-2 py-1.5"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 20)}
              disabled={loading}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-64 rounded-lg border border-gray-100 bg-white p-4">
          {chartBars.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-500">
              {loading ? 'Loading chart...' : 'No chart data.'}
            </div>
          ) : (
            <div className="flex h-full items-end justify-around gap-6">
              {chartBars.slice(-7).map((c, i) => (
                <div key={`${c.year}-${i}`} className="flex w-14 flex-col items-center gap-2">
                  <div
                    className="w-4 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#EEE7FF]"
                    style={{ height: `${Math.max(28, c.value / 40)}px` }}
                    title={`${c.year}: ${formatIQD(c.value)}`}
                  />
                  <span className="whitespace-nowrap text-[10px] text-gray-500">{c.year}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-center text-[11px] text-gray-500">
          Average Yearly Sales: <span className="ml-1 font-semibold text-gray-800">{formatIQD(averageYearlySales)}</span>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Food report Table</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                placeholder="Search by food name..."
                className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
            <button
              onClick={exportRows}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-normal text-gray-600 disabled:opacity-60"
              disabled={loading || visibleItems.length === 0}
            >
              <Download size={12} /> Export
            </button>
          </div>
        </div>
        {error ? (
          <div className="px-4 py-3 text-xs text-rose-600">{error}</div>
        ) : null}
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/90 backdrop-blur">
                {[
                  'Sl',
                  'Food',
                  'Name',
                  'Restaurant',
                  'Order Count',
                  'Price',
                  'Total Amount Sold',
                  'Total Discount Given',
                  'Average Sale Value',
                  'Average Rating',
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-xs text-gray-500">
                    Loading items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-xs text-gray-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                visibleItems.map((it, idx) => {
                  const img = normalizeImage(it?.image_url);
                  const name = safeStr(it?.name) || '-';
                  const restaurantName = safeStr(it?.restaurant_name) || '-';
                  const orderCount = toNumber(it?.order_count);
                  const price = toNumber(it?.price);
                  const totalAmountSold = toNumber(it?.total_amount_sold);
                  const totalDiscountGiven = toNumber(it?.total_discount_given);
                  const averageSaleValue = toNumber(it?.average_sale_value);
                  const averageRating = toNumber(it?.average_rating);
                  return (
                    <tr key={`${safeStr(it?.menu_item_id) || idx}`} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-3 py-3 text-xs text-gray-500">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-3 py-3 text-xs">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="h-8 w-8 rounded-md border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md border border-gray-200 bg-gray-50" />
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className="block max-w-[220px] truncate" title={name}>
                          {name}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className="block max-w-[200px] truncate" title={restaurantName}>
                          {restaurantName}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{orderCount}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{formatIQD(price)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{formatIQD(totalAmountSold)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{formatIQD(totalDiscountGiven)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{formatIQD(averageSaleValue)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{averageRating || 0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
