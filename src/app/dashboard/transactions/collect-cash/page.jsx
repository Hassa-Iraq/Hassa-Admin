'use client';

import { Download, Eye, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/app/config';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';

const TYPE_OPTIONS = [
  { label: 'Deliveryman', value: 'driver' },
  { label: 'Restaurant', value: 'restaurant' },
];

const METHOD_OPTIONS = ['Cash', 'Bank Transfer'];

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizePendingName = (entity) =>
  String(
    entity?.entity_name ||
    entity?.driver_name ||
      entity?.restaurant_name ||
      entity?.name ||
      entity?.full_name ||
      entity?.user?.full_name ||
      entity?.user?.name ||
      ''
  ).trim() || 'N/A';

const normalizePendingId = (entity) =>
  String(
    entity?.entity_id ||
    entity?.driver_user_id ||
      entity?.driver_id ||
      entity?.user_id ||
      entity?.restaurant_id ||
      entity?.id ||
      ''
  ).trim();

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const normalizeRestaurantImage = (entity) =>
  toAbsoluteAssetUrl(
    entity?.logo_url ||
      entity?.logo ||
      entity?.image_url ||
      entity?.image ||
      entity?.photo_url ||
      ''
  );

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

export default function CollectCashPage() {
  const [type, setType] = useState('driver');
  const [entityList, setEntityList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [restaurantDropdownOpen, setRestaurantDropdownOpen] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Table (UI-only placeholder until a history endpoint is provided).
  const [tableSearch, setTableSearch] = useState('');
  const [collections, setCollections] = useState([]);
  const [tablePage, setTablePage] = useState(1);
  const [tableTotalPages, setTableTotalPages] = useState(1);
  const [tableTotalCount, setTableTotalCount] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);

  const rows = useMemo(() => {
    const list = Array.isArray(collections) ? collections : [];
    return list.map((c, idx) => {
      const typeLabel = String(c?.collected_from_type || '').toLowerCase() === 'restaurant' ? 'Restaurant' : 'Deliveryman';
      const baseId = String(c?.id ?? '');
      const rowKey = baseId ? `${baseId}-${tablePage}-${idx}` : `row-${tablePage}-${idx}`;
      return {
        id: c?.id ?? `${tablePage}-${idx}`,
        rowKey,
        raw: c,
        sl: (tablePage - 1) * 20 + idx + 1,
        collectedFrom: c?.collected_from_name || 'N/A',
        typeLabel,
        collectedAt: formatDateTime(c?.collected_at),
        method: c?.method || '-',
        amountLabel: String(c?.amount ?? '-'),
        reference: c?.reference || '',
      };
    });
  }, [collections, tablePage]);

  const options = useMemo(() => {
    const items = Array.isArray(entityList) ? entityList : [];
    return items
      .map((raw) => {
        const id = normalizePendingId(raw);
        return {
          id,
          name: normalizePendingName(raw),
          image: normalizeRestaurantImage(raw),
          raw,
        };
      })
      .filter((item) => Boolean(item.id));
  }, [entityList]);

  const restaurantOptions = useMemo(() => {
    if (type !== 'restaurant') return [];
    const q = restaurantSearch.trim().toLowerCase();
    const base = options;
    if (!q) return base;
    return base.filter((item) => String(item.name || '').toLowerCase().includes(q));
  }, [options, restaurantSearch, type]);

  const selectedRestaurant = useMemo(() => {
    if (!selectedRestaurantId) return null;
    return options.find((o) => o.id === selectedRestaurantId) || null;
  }, [options, selectedRestaurantId]);

  useEffect(() => {
    // Clear previous selection and amount when switching Type.
    setSelectedDriverId('');
    setSelectedRestaurantId('');
    setRestaurantDropdownOpen(false);
    setRestaurantSearch('');
    setAmount('');
    setBalanceError('');
    setSubmitError('');
    setSubmitSuccess('');
  }, [type]);

  useEffect(() => {
    setTablePage(1);
  }, [tableSearch]);

  useEffect(() => {
    let cancelled = false;

    const fetchCollections = async () => {
      setTableLoading(true);
      setTableError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: String(tablePage),
          limit: '20',
        });
        const q = tableSearch.trim();
        if (q) {
          // Some backends use q, some use reference; send both safely.
          params.set('q', q);
          params.set('reference', q);
        }

        const res = await fetch(`/api/wallet/admin/cash-collection?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch collections');

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list = data?.collections || payload?.collections || [];
        const pagination = data?.pagination || payload?.pagination || {};

        if (!cancelled) setCollections(Array.isArray(list) ? list : []);

        const totalPages =
          Number(pagination?.totalPages ?? pagination?.total_pages ?? data?.totalPages ?? payload?.totalPages) || 1;
        const totalCount =
          Number(pagination?.total ?? data?.total ?? payload?.total ?? 0) || 0;

        if (!cancelled) {
          setTableTotalPages(totalPages > 0 ? totalPages : 1);
          setTableTotalCount(totalCount);
        }
      } catch (e) {
        if (!cancelled) {
          setCollections([]);
          setTableTotalPages(1);
          setTableTotalCount(0);
          setTableError(e?.message || 'Failed to fetch collections');
        }
      } finally {
        if (!cancelled) setTableLoading(false);
      }
    };

    fetchCollections();
    return () => {
      cancelled = true;
    };
  }, [tablePage, tableSearch]);

  useEffect(() => {
    if (!submitSuccess) return undefined;
    const timeout = window.setTimeout(() => setSubmitSuccess(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [submitSuccess]);

  useEffect(() => {
    let cancelled = false;

    const fetchList = async () => {
      setListLoading(true);
      setListError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({ type });
        const res = await fetch(`/api/wallet/admin/cash-collection/pending?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch list');

        const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list =
          source?.summary ||
          payload?.summary ||
          source?.list ||
          payload?.list ||
          [];

        if (!cancelled) setEntityList(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          setEntityList([]);
          setListError(e?.message || 'Failed to fetch list');
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };

    fetchList();
    return () => {
      cancelled = true;
    };
  }, [type]);

  useEffect(() => {
    let cancelled = false;
    const selectedId = type === 'restaurant' ? selectedRestaurantId : selectedDriverId;
    if (!selectedId) return;

    const fetchBalance = async () => {
      setBalanceLoading(true);
      setBalanceError('');
      try {
        const token = localStorage.getItem('token') || '';
        const endpoint =
          type === 'restaurant'
            ? `/api/wallet/admin/cash-collection/balance/restaurant/${encodeURIComponent(selectedId)}`
            : `/api/wallet/admin/cash-collection/balance/driver/${encodeURIComponent(selectedId)}`;
        const res = await fetch(endpoint, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch balance');

        const raw = payload?.data || payload || {};
        const pendingBalance =
          raw?.pending_balance ??
          raw?.pendingBalance ??
          raw?.balance ??
          raw?.remaining_balance ??
          0;

        if (!cancelled) setAmount(String(toNumber(pendingBalance)));
      } catch (e) {
        if (!cancelled) setBalanceError(e?.message || 'Failed to fetch balance');
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    };

    fetchBalance();
    return () => {
      cancelled = true;
    };
  }, [selectedDriverId, selectedRestaurantId, type]);

  const selectedUserId = type === 'restaurant' ? selectedRestaurantId : selectedDriverId;
  const canSubmit =
    !submitLoading &&
    !listLoading &&
    !balanceLoading &&
    Boolean(type) &&
    Boolean(selectedUserId) &&
    toNumber(amount) > 0 &&
    Boolean(method);

  const handleReset = () => {
    setSelectedDriverId('');
    setSelectedRestaurantId('');
    setAmount('');
    setMethod('Cash');
    setReference('');
    setSubmitError('');
    setSubmitSuccess('');
    setBalanceError('');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        collected_from_type: type,
        collected_from_user_id: selectedUserId,
        amount: toNumber(amount),
        method,
        reference: reference?.trim() || '',
      };

      const res = await fetch('/api/wallet/admin/cash-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to collect cash');

      const remaining =
        json?.data?.remaining_balance ??
        json?.remaining_balance ??
        json?.data?.remainingBalance ??
        null;

      const apiMessage = String(json?.message || '').trim();
      setSubmitSuccess(
        apiMessage ||
          (remaining === 0 || remaining === '0'
            ? 'Cash collected. Remaining balance is 0.'
            : 'Cash collected successfully.')
      );

      // Reset form after successful collection.
      setSelectedDriverId('');
      setSelectedRestaurantId('');
      setAmount('');
      setReference('');

      // Refresh transaction table.
      setTablePage(1);
    } catch (e) {
      setSubmitError(e?.message || 'Failed to collect cash');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedCollection ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Collection details"
          onMouseDown={() => setSelectedCollection(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-sm font-semibold text-[#1E1E24]">Collection Details</h3>
              <button
                type="button"
                onClick={() => setSelectedCollection(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailLine label="Collected From" value={selectedCollection?.collected_from_name || '—'} />
                <DetailLine
                  label="Type"
                  value={String(selectedCollection?.collected_from_type || '').toLowerCase() === 'restaurant' ? 'Restaurant' : 'Deliveryman'}
                />
                <DetailLine label="Phone" value={selectedCollection?.collected_from_phone || '—'} />
                <DetailLine label="Amount" value={selectedCollection?.amount ?? '—'} />
                <DetailLine label="Method" value={selectedCollection?.method || '—'} />
                <DetailLine label="Reference" value={selectedCollection?.reference || '—'} />
                <DetailLine label="Collected At" value={formatDateTime(selectedCollection?.collected_at)} />
                <DetailLine label="Collection ID" value={selectedCollection?.id || '—'} />
              </div>

              {selectedCollection?.note ? (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11px] font-semibold text-gray-600">Note</p>
                  <p className="mt-1 text-xs text-gray-700">{String(selectedCollection.note)}</p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedCollection(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <Field label="Type *">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={
              <span className="inline-flex items-center gap-2">
                Restaurant
                {listLoading && type === 'restaurant' ? (
                  <LoadingSpinner size="xs" label="Loading restaurants" />
                ) : null}
              </span>
            }
          >
            <div className="relative">
              <button
                type="button"
                disabled={listLoading || type !== 'restaurant'}
                onClick={() => setRestaurantDropdownOpen((v) => !v)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-normal normal-case text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                {listLoading ? (
                  <span className="inline-flex items-center gap-2 text-gray-500">
                    <LoadingSpinner size="xs" label="Loading restaurants" />
                  </span>
                ) : selectedRestaurant ? (
                  <span className="flex items-center gap-2">
                    <img
                      src={selectedRestaurant.image || '/default-restaurant-image.svg'}
                      alt={selectedRestaurant.name}
                      className="h-6 w-6 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/default-restaurant-image.svg';
                      }}
                    />
                    <span className="truncate">{selectedRestaurant.name}</span>
                  </span>
                ) : (
                  <span className="font-normal normal-case text-gray-500">Select Restaurant</span>
                )}
              </button>

              {restaurantDropdownOpen && type === 'restaurant' && !listLoading ? (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="p-2">
                    <div className="relative">
                      <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500" />
                      <input
                        value={restaurantSearch}
                        onChange={(e) => setRestaurantSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-7 text-[11px]"
                        placeholder="Search restaurant..."
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-auto p-1">
                    {restaurantOptions.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] text-gray-500">No restaurants found.</div>
                    ) : (
                      restaurantOptions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedRestaurantId(item.id);
                            setRestaurantDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-purple-50"
                        >
                          <img
                            src={item.image || '/default-restaurant-image.svg'}
                            alt={item.name}
                            className="h-7 w-7 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/default-restaurant-image.svg';
                            }}
                          />
                          <span className="min-w-0 flex-1 truncate text-gray-800">{item.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </Field>
          <Field
            label={
              <span className="inline-flex items-center gap-2">
                Deliveryman *
                {listLoading && type === 'driver' ? (
                  <LoadingSpinner size="xs" label="Loading delivery people" />
                ) : null}
              </span>
            }
          >
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              disabled={listLoading || type !== 'driver'}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <option value="">{listLoading ? '\u00A0' : 'Select Deliveryman'}</option>
              {type === 'driver'
                ? options.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                : null}
            </select>
          </Field>
          <Field label="Method *">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
            >
              {METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reference">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              placeholder="Ex: REC-001"
            />
          </Field>
          <Field label="Amount *">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              placeholder="Ex: 5500"
              inputMode="decimal"
            />
            {balanceLoading ? (
              <div className="mt-1 flex items-center gap-1.5" role="status" aria-label="Fetching pending balance">
                <LoadingSpinner size="xs" label="Fetching pending balance" />
              </div>
            ) : null}
          </Field>
        </div>
        {(listError || balanceError || submitError || submitSuccess) ? (
          <div className="px-4 pb-2">
            {listError ? (
              <p className="text-[11px] text-rose-600">{listError}</p>
            ) : null}
            {balanceError ? (
              <p className="mt-1 text-[11px] text-rose-600">{balanceError}</p>
            ) : null}
            {submitError ? (
              <p className="mt-1 text-[11px] text-rose-600">{submitError}</p>
            ) : null}
            {submitSuccess ? (
              <p className="mt-1 text-[11px] text-emerald-600">{submitSuccess}</p>
            ) : null}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED]"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitLoading ? (
              <span className="inline-flex items-center justify-center px-1">
                <LoadingSpinner size="sm" className="[&_svg]:text-white" label="Collecting cash" />
              </span>
            ) : (
              'Collect Cash'
            )}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1E1E24]">Transaction Table</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500" />
              <input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]"
                placeholder="Search by reference..."
              />
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600">
              <Download size={12} /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                {['Sl', 'Collected From', 'Type', 'Collected At', 'Payment Method', 'Collected Amount', 'Reference', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <TableLoadingSkeleton colSpan={8} rows={8} variant="cells" />
              ) : tableError ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-xs text-rose-600">
                    {tableError}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : rows.map((item) => (
                <tr
                  key={item.rowKey}
                  onClick={() => setSelectedCollection(item.raw || null)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                >
                  <td className="px-3 py-3 text-xs text-gray-500">{item.sl}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.collectedFrom}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.typeLabel}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.collectedAt}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.method}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.amountLabel}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.reference || 'N/A'}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCollection(item.raw || null);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFFBEB] text-[#F59E0B]"
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{tablePage}</span> of{' '}
            <span className="font-semibold text-gray-700">{tableTotalPages}</span>
            {tableTotalCount ? (
              <span className="text-gray-400"> ({tableTotalCount} total)</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              disabled={tablePage <= 1 || tableLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))}
              disabled={tablePage >= tableTotalPages || tableLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function DetailLine({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className="mt-0.5 text-xs font-medium text-[#1E1E24] break-words">{value ?? '—'}</p>
    </div>
  );
}
