'use client';

import { Download, Eye, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PER_PAGE = 20;

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toStatusPill = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'bg-emerald-50 text-emerald-600';
  if (s === 'rejected') return 'bg-rose-50 text-rose-600';
  return 'bg-amber-50 text-amber-600';
};

export default function RestaurantWithdrawPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || '';

  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  useEffect(() => {
    let cancelled = false;

    const fetchPayouts = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          role: 'restaurant',
          page: String(page),
          limit: String(PER_PAGE),
        });
        if (status) params.set('status', status);
        if (search.trim()) {
          params.set('q', search.trim());
          params.set('search', search.trim());
        }

        const res = await fetch(`/api/wallet/admin/payouts?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch payouts');

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list = data?.payouts || data?.requests || data?.items || data?.list || payload?.payouts || [];
        const pagination = data?.pagination || payload?.pagination || {};

        if (!cancelled) setRows(Array.isArray(list) ? list : []);

        const apiTotalPages = Number(pagination?.totalPages ?? pagination?.total_pages ?? data?.totalPages ?? 1) || 1;
        if (!cancelled) setTotalPages(apiTotalPages > 0 ? apiTotalPages : 1);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setTotalPages(1);
          setError(e?.message || 'Failed to fetch payouts');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPayouts();
    return () => {
      cancelled = true;
    };
  }, [page, status, search]);

  const displayRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const buildDetailHref = (row, fallbackId, index) => {
    const id = String(fallbackId || row?.id || row?._id || '');
    const walletId = row?.wallet_id || row?.walletId || '';
    const userId = row?.user_id || row?.userId || '';
    const requestedAt = row?.requested_at || row?.created_at || row?.requestedAt || row?.requested_time || '';
    const restaurantName = row?.restaurant_name || row?.restaurant?.name || '';
    const params = new URLSearchParams();
    if (walletId) params.set('wallet_id', String(walletId));
    if (userId) params.set('user_id', String(userId));
    if (requestedAt) params.set('requested_at', String(requestedAt));
    if (restaurantName) params.set('restaurant_name', String(restaurantName));
    params.set('idx', String(index));
    return `/dashboard/transactions/restaurant-withdraw/${encodeURIComponent(id)}?${params.toString()}`;
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1E1E24]">Withdraw Request Table</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]"
              placeholder="Ex: search by restaurant..."
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] text-gray-600"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600">
            <Download size={12} /> Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70">
              {['Sl', 'Amount', 'Restaurant', 'Request Time', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                  Loading withdraw requests...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-rose-600">
                  {error}
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                  No withdraw requests found.
                </td>
              </tr>
            ) : (
              displayRows.map((row, index) => {
                const id = row?.id || row?._id || `${page}-${index}`;
                const rowKey = `${id}-${page}-${index}`;
                const amount = row?.amount ?? row?.requested_amount ?? row?.withdraw_amount ?? '-';
                const restaurantName = row?.restaurant_name || row?.restaurant?.name || 'N/A';
                const requestedAt = row?.requested_at || row?.created_at || row?.requestedAt || row?.requested_time;
                const statusValue = String(row?.status || 'pending');
                const detailHref = buildDetailHref(row, id, index);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => router.push(detailHref)}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                  >
                    <td className="px-3 py-3 text-xs text-gray-500">{(page - 1) * PER_PAGE + index + 1}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{amount}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{restaurantName}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{formatDateTime(requestedAt)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${toStatusPill(statusValue)}`}>
                        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(detailHref);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFFBEB] text-[#F59E0B]"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-500">
          Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
          <span className="font-semibold text-gray-700">{totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
