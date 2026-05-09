'use client';

import { Download, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/app/config';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';

const toNumber = (value) => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const formatIQD = (value) => {
  const n = toNumber(value);
  return `IQD ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const safeStr = (value) => {
  const s = value == null ? '' : String(value);
  return s.trim();
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

const formatDateTime = (iso) => {
  const s = safeStr(iso);
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const pick = (obj, keys, fallback = null) => {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
  }
  return fallback;
};

let lastLoadGlobal = { key: '', at: 0 };

function Card({ title, value, tone }) {
  const toneCls =
    tone === 'green'
      ? 'text-emerald-500'
      : tone === 'red'
      ? 'text-rose-500'
      : 'text-[#7C3AED]';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <p className={`text-xl font-semibold ${toneCls}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{title}</p>
    </div>
  );
}

export default function TransactionReportPage() {
  const [time, setTime] = useState('All Time');
  const [reference, setReference] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState({
    completed: 0,
    refunded: 0,
    adminEarning: 0,
    restaurantEarning: 0,
    deliverymanEarning: 0,
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);

  const abortRef = useRef(null);
  const dropdownRef = useRef(null);

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
    let cancelled = false;
    const fetchRestaurants = async () => {
      setRestaurantsLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: '1',
          limit: '200',
        });
        const res = await fetch(`/api/restaurants?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.message || 'Failed to load restaurants');

        const source =
          payload?.data && typeof payload.data === 'object' ? payload.data : payload || {};
        const list =
          source?.restaurants ||
          source?.list ||
          source?.data ||
          payload?.restaurants ||
          payload?.list ||
          [];

        const normalized = (Array.isArray(list) ? list : [])
          .map((r) => {
            const id = safeStr(r?.id ?? r?.restaurant_id ?? r?.restaurantId);
            const name = safeStr(r?.name ?? r?.restaurant_name ?? r?.restaurantName);
            const image =
              normalizeImage(r?.logo_url) ||
              normalizeImage(r?.logoUrl) ||
              normalizeImage(r?.logo_full_url) ||
              normalizeImage(r?.logo) ||
              normalizeImage(r?.cover_image_url) ||
              normalizeImage(r?.coverImageUrl) ||
              normalizeImage(r?.image_full_url) ||
              normalizeImage(r?.image) ||
              normalizeImage(r?.cover_photo_full_url) ||
              normalizeImage(r?.cover_photo) ||
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

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    const rid = restaurantId.trim();
    if (rid) params.set('restaurant_id', rid);
    const df = dateFrom.trim();
    const dt = dateTo.trim();
    if (df) params.set('date_from', df);
    if (dt) params.set('date_to', dt);
    if (time && time !== 'All Time') params.set('time', time);
    return params;
  }, [dateFrom, dateTo, limit, page, reference, restaurantId, time]);

  const visibleRows = useMemo(() => {
    const q = reference.trim().toLowerCase();
    if (!q) return rows;
    return (Array.isArray(rows) ? rows : []).filter((row) => {
      const restaurantName = safeStr(row?.restaurant_name).toLowerCase();
      const customerName = safeStr(row?.customer_name).toLowerCase();
      const orderNumber = safeStr(row?.order_number).toLowerCase();
      const orderId = safeStr(row?.order_id).toLowerCase();
      return (
        restaurantName.includes(q) ||
        customerName.includes(q) ||
        orderNumber.includes(q) ||
        orderId.includes(q)
      );
    });
  }, [reference, rows]);

  const selectedRestaurant = useMemo(() => {
    if (!restaurantId) return null;
    return restaurants.find((r) => r.id === restaurantId) || null;
  }, [restaurantId, restaurants]);

  const filteredRestaurants = useMemo(() => {
    const q = restaurantSearch.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => (r.name || '').toLowerCase().includes(q));
  }, [restaurantSearch, restaurants]);

  const fetchReport = async ({ signal, params }) => {
    const token = localStorage.getItem('token') || '';
    const url = `/api/admin/reports/transactions${params?.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.message || 'Failed to fetch transaction report');
    return payload;
  };

  const normalize = (payload) => {
    const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload || {};
    const list =
      source?.transactions ||
      source?.transaction ||
      source?.orders ||
      source?.items ||
      source?.data ||
      payload?.transactions ||
      [];
    const normalizedRows = Array.isArray(list) ? list : [];

    const rawSummary = source?.summary || source?.totals || source || {};
    const completed = pick(rawSummary, ['completed_total', 'completed_transaction', 'completed', 'completedAmount', 'completed_amount'], 0);
    const refunded = pick(rawSummary, ['refunded_total', 'refunded_transaction', 'refunded', 'refundedAmount', 'refunded_amount'], 0);
    const adminEarning = pick(rawSummary, ['admin_earning', 'adminEarning', 'admin_earnings'], 0);
    const restaurantEarning = pick(rawSummary, ['restaurant_earning', 'restaurantEarning', 'restaurant_earnings'], 0);
    const deliverymanEarning = pick(rawSummary, ['deliveryman_earning', 'deliverymanEarning', 'deliveryman_earnings'], 0);

    const rawPagination = source?.pagination || payload?.pagination || {};
    const normalizedPagination = {
      page: Number(rawPagination?.page ?? page) || 1,
      limit: Number(rawPagination?.limit ?? limit) || limit,
      total: Number(rawPagination?.total ?? 0) || 0,
      totalPages: Number(rawPagination?.totalPages ?? rawPagination?.total_pages ?? 1) || 1,
    };

    return {
      rows: normalizedRows,
      summary: {
        completed,
        refunded,
        adminEarning,
        restaurantEarning,
        deliverymanEarning,
      },
      pagination: normalizedPagination,
    };
  };

  const load = async (params = queryParams) => {
    const key = params?.toString?.() ? params.toString() : '';
    const now = Date.now();
    // React 18 StrictMode can mount components twice in dev; avoid duplicate identical calls.
    if (key && lastLoadGlobal.key === key && now - lastLoadGlobal.at < 800) {
      return;
    }
    lastLoadGlobal = { key, at: now };

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const payload = await fetchReport({ signal: controller.signal, params });
      const normalized = normalize(payload);
      setRows(normalized.rows);
      setSummary(normalized.summary);
      setPagination(normalized.pagination);
    } catch (e) {
      if (e?.name === 'AbortError') return;
      setRows([]);
      setSummary({
        completed: 0,
        refunded: 0,
        adminEarning: 0,
        restaurantEarning: 0,
        deliverymanEarning: 0,
      });
      setError(e?.message || 'Failed to fetch transaction report');
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
  }, [restaurantId, dateFrom, dateTo, limit]);

  const exportRows = () => {
    const headers = [
      'Sl',
      'Order ID',
      'Order Number',
      'Restaurant',
      'Customer Name',
      'Customer Phone',
      'Placed At',
      'Status',
      'Payment Method',
      'Order Type',
      'Amount Received By',
      'Subtotal',
      'Discount Amount',
      'Tax Amount',
      'Delivery Fee',
      'Total Amount',
      'Admin Commission',
      'Restaurant Net Income',
      'Admin Net Income',
    ];

    const asRow = (row, index) => {
      const restaurantName = safeStr(row?.restaurant_name);
      const customerName = safeStr(row?.customer_name);
      const customerPhone = safeStr(row?.customer_phone);
      const orderId = safeStr(row?.order_id);
      const orderNumber = safeStr(row?.order_number);
      const placedAt = formatDateTime(row?.placed_at);
      const status = safeStr(row?.status);
      const paymentMethod = safeStr(row?.payment_method);
      const orderType = safeStr(row?.order_type);
      const amountReceivedBy = safeStr(row?.amount_received_by);
      const subtotal = toNumber(row?.subtotal);
      const discountAmount = toNumber(row?.discount_amount);
      const taxAmount = toNumber(row?.tax_amount);
      const deliveryFee = toNumber(row?.delivery_fee);
      const totalAmount = toNumber(row?.total_amount);
      const adminCommission = toNumber(row?.admin_commission);
      const restaurantNetIncome = toNumber(row?.restaurant_net_income);
      const adminNetIncome = toNumber(row?.admin_net_income);

      return [
        index + 1,
        safeStr(orderId),
        safeStr(orderNumber),
        safeStr(restaurantName),
        safeStr(customerName),
        safeStr(customerPhone),
        safeStr(placedAt),
        safeStr(status),
        safeStr(paymentMethod),
        safeStr(orderType),
        safeStr(amountReceivedBy),
        String(subtotal),
        String(discountAmount),
        String(taxAmount),
        String(deliveryFee),
        String(totalAmount),
        String(adminCommission),
        String(restaurantNetIncome),
        String(adminNetIncome),
      ];
    };

    const escapeCsv = (v) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const csv = [
      headers.map(escapeCsv).join(','),
      ...visibleRows.map((r, i) => asRow(r, i).map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction-report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
                  {restaurantsLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <LoadingSpinner size="xs" label="Loading restaurants" />
                    </span>
                  ) : (
                    selectedRestaurant?.name || 'All Restaurants'
                  )}
                </span>
              </span>
              <span className="text-gray-400">▾</span>
            </button>

            {restaurantDropdownOpen ? (
              <div
                className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
                role="listbox"
              >
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
          <input
            type="date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <button
            onClick={() => {
              // Fetch is driven by query param changes; button is just a UX affordance.
              setRestaurantDropdownOpen(false);
              setRestaurantSearch('');
            }}
            className="w-full justify-self-stretch rounded-md bg-[#6D28D9] px-8 py-2 text-sm font-medium text-white disabled:opacity-60 md:w-auto md:justify-self-end"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex w-full items-center justify-center py-0.5">
                <LoadingSpinner size="sm" className="[&_svg]:text-white" label="Applying filters" />
              </span>
            ) : (
              'Filter'
            )}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600">
          <div>
            Showing <span className="font-semibold text-gray-800">{visibleRows.length}</span> of{' '}
            <span className="font-semibold text-gray-800">{pagination.total}</span> results
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

      <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <Card title="Completed Transaction" value={formatIQD(summary.completed)} tone="green" />
        <Card title="Refunded Transaction" value={formatIQD(summary.refunded)} tone="red" />
        <Card title="Admin Earning" value={formatIQD(summary.adminEarning)} tone="violet" />
        <Card title="Restaurant Earning" value={formatIQD(summary.restaurantEarning)} tone="violet" />
        <Card title="Deliveryman Earning" value={formatIQD(summary.deliverymanEarning)} tone="violet" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Order Transactions</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                placeholder="Search by reference..."
                className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <button
              onClick={exportRows}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-normal text-gray-600 disabled:opacity-60"
              disabled={loading || visibleRows.length === 0}
            >
              <Download size={12} /> Export
            </button>
          </div>
        </div>
        {error ? (
          <div className="px-4 py-3 text-xs text-rose-600">{error}</div>
        ) : null}
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/90 backdrop-blur">
                {[
                  'Sl',
                  'Order ID',
                  'Order Number',
                  'Restaurant',
                  'Customer Name',
                  'Subtotal',
                  'Discount',
                  'Vat/Tax',
                  'Delivery Charge',
                  'Total Amount',
                  'Admin Commission',
                  'Restaurant Net',
                  'Admin Net',
                  'Payment',
                  'Received By',
                  'Type',
                  'Status',
                  'Placed At',
                ].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold text-[#1E1E24]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoadingSkeleton colSpan={17} rows={8} variant="cells" />
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={17} className="px-4 py-10 text-center text-xs text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, index) => {
                  const orderId = safeStr(row?.order_id);
                  const orderNumber = safeStr(row?.order_number);
                  const restaurantName = safeStr(row?.restaurant_name);
                  const customerName = safeStr(row?.customer_name) || '-';

                  const subtotal = toNumber(row?.subtotal);
                  const discountAmount = toNumber(row?.discount_amount);
                  const taxAmount = toNumber(row?.tax_amount);
                  const deliveryFee = toNumber(row?.delivery_fee);
                  const totalAmount = toNumber(row?.total_amount);
                  const adminCommission = toNumber(row?.admin_commission);
                  const restaurantNetIncome = toNumber(row?.restaurant_net_income);
                  const adminNetIncome = toNumber(row?.admin_net_income);
                  const paymentMethod = safeStr(row?.payment_method);
                  const status = safeStr(row?.status);
                  const placedAt = formatDateTime(row?.placed_at);
                  const amountReceivedBy = safeStr(row?.amount_received_by);
                  const orderType = safeStr(row?.order_type);

                  return (
                    <tr key={`${safeStr(orderId) || index}`} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed">
                        <span
                          className="block max-w-[180px] truncate font-mono"
                          title={orderId || ''}
                        >
                          {orderId || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed">
                        <span
                          className="block max-w-[160px] truncate"
                          title={orderNumber || ''}
                        >
                          {orderNumber || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed">
                        <span className="block max-w-[160px] truncate" title={restaurantName || ''}>
                          {restaurantName || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed">
                        <span className="block max-w-[160px] truncate" title={customerName || ''}>
                          {customerName || '-'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {formatIQD(subtotal)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {formatIQD(discountAmount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {formatIQD(taxAmount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {formatIQD(deliveryFee)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {formatIQD(totalAmount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {formatIQD(adminCommission)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {formatIQD(restaurantNetIncome)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {formatIQD(adminNetIncome)}
                      </td>
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed">{paymentMethod || '-'}</td>
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed">
                        <span className="block max-w-[160px] truncate" title={amountReceivedBy || ''}>
                          {amountReceivedBy || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed">
                        <span className="block max-w-[120px] truncate" title={orderType || ''}>
                          {orderType || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-[11px] leading-relaxed">{status || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] leading-relaxed">
                        {placedAt}
                      </td>
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
