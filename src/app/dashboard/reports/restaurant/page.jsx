'use client';

import { Download, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/app/config';

export default function RestaurantReportPage() {
  // Draft inputs (user typing) vs applied filters (used for API call).
  const [zoneDraft, setZoneDraft] = useState('');
  const [dateFromDraft, setDateFromDraft] = useState('');
  const [dateToDraft, setDateToDraft] = useState('');

  const [zone, setZone] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [tableSearch, setTableSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [chart, setChart] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const abortRef = useRef(null);
  const lastLoadRef = useRef({ key: '', at: 0 });

  const safeStr = (value) => (value == null ? '' : String(value)).trim();
  const toNumber = (value) => {
    const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
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

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    const z = zone.trim();
    if (z) params.set('zone', z);
    const df = dateFrom.trim();
    const dt = dateTo.trim();
    if (df) params.set('date_from', df);
    if (dt) params.set('date_to', dt);
    return params;
  }, [dateFrom, dateTo, limit, page, zone]);

  const applyFilters = () => {
    setZone(zoneDraft);
    setDateFrom(dateFromDraft);
    setDateTo(dateToDraft);
    setPage(1);
  };

  const load = async (params = queryParams) => {
    const key = params?.toString?.() ? params.toString() : '';
    const now = Date.now();
    // React 18 StrictMode runs effects twice in dev; avoid duplicate identical calls.
    if (key && lastLoadRef.current.key === key && now - lastLoadRef.current.at < 800) return;
    lastLoadRef.current = { key, at: now };

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || '';
      const url = `/api/admin/reports/restaurants${key ? `?${key}` : ''}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to fetch restaurant report');

      const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload || {};
      setAverageOrderValue(toNumber(data?.average_order_value));
      setChart(Array.isArray(data?.chart) ? data.chart : []);
      setRestaurants(Array.isArray(data?.restaurants) ? data.restaurants : []);
      const p = data?.pagination || {};
      setPagination({
        page: Number(p?.page ?? page) || 1,
        limit: Number(p?.limit ?? limit) || limit,
        total: Number(p?.total ?? 0) || 0,
        totalPages: Number(p?.totalPages ?? p?.total_pages ?? 1) || 1,
      });
    } catch (e) {
      if (e?.name === 'AbortError') return;
      setAverageOrderValue(0);
      setChart([]);
      setRestaurants([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
      setError(e?.message || 'Failed to fetch restaurant report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  useEffect(() => {
    // Keep draft inputs aligned with applied filters (e.g. initial render, back/forward).
    setZoneDraft(zone);
    setDateFromDraft(dateFrom);
    setDateToDraft(dateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [zone, dateFrom, dateTo, limit]);

  const chartBars = useMemo(() => {
    return (Array.isArray(chart) ? chart : [])
      .map((c) => ({
        year: safeStr(c?.year),
        value: toNumber(c?.total_order_amount),
      }))
      .filter((c) => c.year);
  }, [chart]);

  const visibleRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return restaurants;
    return (Array.isArray(restaurants) ? restaurants : []).filter((r) =>
      safeStr(r?.restaurant_name).toLowerCase().includes(q)
    );
  }, [restaurants, tableSearch]);

  const exportRows = () => {
    const headers = [
      'Sl',
      'Restaurant ID',
      'Restaurant',
      'Zone',
      'Total Food',
      'Total Orders',
      'Total Order Amount',
      'Total Discount Given',
      'Total Admin Commission',
      'Total VAT/TAX',
      'Average Rating',
      'Logo URL',
    ];

    const escapeCsv = (v) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [
      headers.map(escapeCsv).join(','),
      ...visibleRows.map((r, idx) => {
        const row = [
          idx + 1,
          safeStr(r?.restaurant_id),
          safeStr(r?.restaurant_name),
          safeStr(r?.zone),
          toNumber(r?.total_food),
          toNumber(r?.total_orders),
          toNumber(r?.total_order_amount),
          toNumber(r?.total_discount_given),
          toNumber(r?.total_admin_commission),
          toNumber(r?.total_vat_tax),
          toNumber(r?.average_rating),
          toAbsoluteUrl(safeStr(r?.logo_url)),
        ];
        return row.map(escapeCsv).join(',');
      }),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restaurant-report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-[11px] font-semibold text-[#1E1E24]">Search Data</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
            placeholder="Zone..."
            value={zoneDraft}
            onChange={(e) => setZoneDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters();
            }}
          />
          <input
            type="date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
            value={dateFromDraft}
            onChange={(e) => setDateFromDraft(e.target.value)}
          />
          <input
            type="date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
            value={dateToDraft}
            onChange={(e) => setDateToDraft(e.target.value)}
          />
          <button
            onClick={applyFilters}
            className="w-full justify-self-stretch rounded-md bg-[#6D28D9] px-8 py-2 text-sm font-medium text-white disabled:opacity-60 md:w-auto md:justify-self-end"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Filter'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600">
          <div>
            Showing <span className="font-semibold text-gray-800">{visibleRows.length}</span> of{' '}
            <span className="font-semibold text-gray-800">{pagination.total}</span> restaurants
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
          Average Order Value:{' '}
          <span className="ml-1 font-semibold text-gray-800">{formatIQD(averageOrderValue)}</span>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Restaurants report Table</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                placeholder="Search by restaurant name..."
                className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-normal text-gray-600 disabled:opacity-60"
              onClick={exportRows}
              disabled={loading || visibleRows.length === 0}
            >
              <Download size={12} /> Export
            </button>
          </div>
        </div>
        {error ? <div className="px-4 py-3 text-xs text-rose-600">{error}</div> : null}
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/90 backdrop-blur">
                {[
                  'Sl',
                  'Restaurant',
                  'Zone',
                  'Total Food',
                  'Total Orders',
                  'Total Order Amount',
                  'Total Discount Given',
                  'Total Admin Commission',
                  'Total VAT/TAX',
                  'Average Ratings',
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
                    Loading restaurants...
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-xs text-gray-500">
                    No restaurants found.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r, idx) => {
                  const name = safeStr(r?.restaurant_name) || '-';
                  const zoneName = safeStr(r?.zone) || '-';
                  const logo = toAbsoluteUrl(safeStr(r?.logo_url));
                  const totalFood = toNumber(r?.total_food);
                  const totalOrders = toNumber(r?.total_orders);
                  const totalOrderAmount = toNumber(r?.total_order_amount);
                  const totalDiscount = toNumber(r?.total_discount_given);
                  const totalCommission = toNumber(r?.total_admin_commission);
                  const totalVat = toNumber(r?.total_vat_tax);
                  const avgRating = toNumber(r?.average_rating);
                  return (
                    <tr key={`${safeStr(r?.restaurant_id) || idx}`} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-3 py-3 text-xs text-gray-500">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-3 py-3 text-xs">
                        <div className="flex items-center gap-2">
                          {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logo}
                              alt=""
                              className="h-7 w-7 flex-none rounded-md border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="h-7 w-7 flex-none rounded-md border border-gray-200 bg-gray-50" />
                          )}
                          <span className="block max-w-[220px] truncate" title={name}>
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className="block max-w-[180px] truncate" title={zoneName}>
                          {zoneName}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{totalFood}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{totalOrders}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{formatIQD(totalOrderAmount)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{formatIQD(totalDiscount)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{formatIQD(totalCommission)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{formatIQD(totalVat)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">{avgRating || 0}</td>
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
