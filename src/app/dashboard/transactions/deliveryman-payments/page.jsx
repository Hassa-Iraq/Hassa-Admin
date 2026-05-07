'use client';

import { Download, Eye, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const METHOD_OPTIONS = ['Cash', 'Bank Transfer'];

const pickString = (...values) => {
  const matched = values.find((value) => typeof value === 'string' && value.trim());
  return matched ? matched.trim() : '';
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeDeliverymanId = (item) =>
  pickString(
    String(item?.id ?? ''),
    String(item?.driver_user_id ?? ''),
    String(item?.driver_id ?? ''),
    String(item?.user_id ?? ''),
    String(item?.driver?.id ?? '')
  );

const normalizeDeliverymanName = (item) =>
  pickString(item?.full_name, item?.name, item?.driver_name, item?.user?.full_name, item?.user?.name) || 'N/A';

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

export default function DeliverymanPaymentsPage() {
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversError, setDriversError] = useState('');

  const [driverUserId, setDriverUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tableTotalPages, setTableTotalPages] = useState(1);
  const [tableTotalCount, setTableTotalCount] = useState(0);
  const [payments, setPayments] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const driverOptions = useMemo(() => {
    const list = Array.isArray(drivers) ? drivers : [];
    return list
      .map((raw) => {
        const id = normalizeDeliverymanId(raw);
        return { id, name: normalizeDeliverymanName(raw), raw };
      })
      .filter((x) => Boolean(x.id));
  }, [drivers]);

  const driverNameById = useMemo(() => {
    const map = new Map();
    for (const d of driverOptions) map.set(d.id, d.name);
    return map;
  }, [driverOptions]);

  const rows = useMemo(() => {
    const list = Array.isArray(payments) ? payments : [];
    return list.map((p, idx) => {
      const id = p?.id ?? `${tablePage}-${idx}`;
      const rowKey = `${id}-${tablePage}-${idx}`;
      const driverId = pickString(String(p?.driver_user_id ?? ''), String(p?.driver_id ?? ''), String(p?.user_id ?? ''));
      const driverName =
        pickString(p?.driver_name, p?.driver?.full_name, p?.driver?.name, p?.user?.full_name, p?.user?.name) ||
        (driverId ? driverNameById.get(driverId) : '') ||
        '-';
      const statusLabel = pickString(String(p?.status ?? ''), String(p?.payment_status ?? ''), String(p?.state ?? '')) || '-';

      return {
        id,
        rowKey,
        raw: p,
        sl: (tablePage - 1) * 20 + idx + 1,
        driverName,
        amountLabel: String(p?.amount ?? '-'),
        methodLabel: pickString(String(p?.method ?? '')) || '-',
        reference: pickString(String(p?.reference ?? '')),
        createdAt: formatDateTime(p?.created_at ?? p?.createdAt ?? p?.request_time ?? p?.requested_at),
        statusLabel,
      };
    });
  }, [payments, tablePage, driverNameById]);

  useEffect(() => {
    let cancelled = false;
    const fetchDrivers = async () => {
      setDriversLoading(true);
      setDriversError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: '1',
          limit: '1000',
          is_active: 'true',
        });
        const res = await fetch(`/api/auth/drivers?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch deliverymen');

        const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list = source?.drivers || source?.deliverymen || source?.list || source?.items || payload?.drivers || payload?.deliverymen || [];
        if (!cancelled) setDrivers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          setDrivers([]);
          setDriversError(e?.message || 'Failed to fetch deliverymen');
        }
      } finally {
        if (!cancelled) setDriversLoading(false);
      }
    };
    fetchDrivers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setTablePage(1);
  }, [tableSearch]);

  useEffect(() => {
    let cancelled = false;
    const fetchPayments = async () => {
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
          params.set('q', q);
          params.set('reference', q);
          params.set('search', q);
        }
        if (driverUserId) {
          // Send multiple possible keys; backend may accept one of them.
          params.set('driver_user_id', driverUserId);
          params.set('driver_id', driverUserId);
        }

        const res = await fetch(`/api/wallet/admin/driver-payments?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch payments');

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list = data?.payments || data?.driver_payments || data?.list || payload?.payments || payload?.list || [];
        const pagination = data?.pagination || payload?.pagination || {};
        if (!cancelled) setPayments(Array.isArray(list) ? list : []);

        const totalPages = Number(pagination?.totalPages ?? pagination?.total_pages ?? data?.totalPages ?? payload?.totalPages) || 1;
        const totalCount = Number(pagination?.total ?? data?.total ?? payload?.total ?? 0) || 0;
        if (!cancelled) {
          setTableTotalPages(totalPages > 0 ? totalPages : 1);
          setTableTotalCount(totalCount);
        }
      } catch (e) {
        if (!cancelled) {
          setPayments([]);
          setTableTotalPages(1);
          setTableTotalCount(0);
          setTableError(e?.message || 'Failed to fetch payments');
        }
      } finally {
        if (!cancelled) setTableLoading(false);
      }
    };

    fetchPayments();
    return () => {
      cancelled = true;
    };
  }, [tablePage, tableSearch, driverUserId]);

  useEffect(() => {
    if (!submitSuccess) return undefined;
    const timeout = window.setTimeout(() => setSubmitSuccess(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [submitSuccess]);

  const canSubmit =
    !submitLoading &&
    !driversLoading &&
    Boolean(driverUserId) &&
    toNumber(amount) > 0 &&
    Boolean(method);

  const handleReset = () => {
    setDriverUserId('');
    setAmount('');
    setMethod('Cash');
    setReference('');
    setNote('');
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        driver_user_id: driverUserId,
        amount: toNumber(amount),
        method,
        reference: reference.trim(),
        note: note.trim(),
      };

      const res = await fetch('/api/wallet/admin/driver-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to create payment');

      setSubmitSuccess(String(json?.message || 'Payment created successfully.'));
      setAmount('');
      setReference('');
      setNote('');
      setTablePage(1);
    } catch (e) {
      setSubmitError(e?.message || 'Failed to create payment');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedPayment ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Payment details"
          onMouseDown={() => setSelectedPayment(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-sm font-semibold text-[#1E1E24]">Payment Details</h3>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailLine
                  label="Deliveryman"
                  value={
                    pickString(
                      selectedPayment?.driver_name,
                      selectedPayment?.driver?.full_name,
                      selectedPayment?.driver?.name,
                      selectedPayment?.user?.full_name,
                      selectedPayment?.user?.name
                    ) || '-'
                  }
                />
                <DetailLine label="Amount" value={selectedPayment?.amount ?? '—'} />
                <DetailLine label="Method" value={pickString(String(selectedPayment?.method ?? '')) || '—'} />
                <DetailLine label="Reference" value={pickString(String(selectedPayment?.reference ?? '')) || '—'} />
                <DetailLine
                  label="Status"
                  value={
                    pickString(
                      String(selectedPayment?.status ?? ''),
                      String(selectedPayment?.payment_status ?? ''),
                      String(selectedPayment?.state ?? '')
                    ) || '—'
                  }
                />
                <DetailLine
                  label="Created At"
                  value={formatDateTime(selectedPayment?.created_at ?? selectedPayment?.createdAt)}
                />
              </div>
              {pickString(String(selectedPayment?.note ?? '')) ? (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11px] font-semibold text-gray-600">Note</p>
                  <p className="mt-1 text-xs text-gray-700">{String(selectedPayment.note)}</p>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white">
        <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-[#1E1E24]">Provide Deliveryman Earning</h3>
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <Field label="Deliveryman">
            <select
              value={driverUserId}
              onChange={(e) => setDriverUserId(e.target.value)}
              disabled={driversLoading}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <option value="">{driversLoading ? 'Loading...' : 'Select Deliveryman'}</option>
              {driverOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              placeholder="Ex: 100"
              inputMode="decimal"
            />
          </Field>
          <Field label="Method">
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
              placeholder="Ex: EARN-001"
            />
          </Field>
          <Field label="Note">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              placeholder="Optional note"
            />
          </Field>
        </div>
        {(driversError || submitError || submitSuccess) ? (
          <div className="px-4 pb-2">
            {driversError ? <p className="text-[11px] text-rose-600">{driversError}</p> : null}
            {submitError ? <p className="mt-1 text-[11px] text-rose-600">{submitError}</p> : null}
            {submitSuccess ? <p className="mt-1 text-[11px] text-emerald-600">{submitSuccess}</p> : null}
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
            {submitLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1E1E24]">Distribute DM Earning Table</h3>
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
                {['Sl', 'Deliveryman', 'Amount', 'Method', 'Reference', 'Request Time', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : tableError ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-xs text-rose-600">
                    {tableError}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.rowKey}
                    onClick={() => setSelectedPayment(row.raw || null)}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                  >
                    <td className="px-3 py-3 text-xs text-gray-500">{row.sl}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.driverName}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.amountLabel}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.methodLabel}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.reference || '-'}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.createdAt}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                          String(row.statusLabel || '').toLowerCase() === 'approved' ||
                          String(row.statusLabel || '').toLowerCase() === 'paid'
                            ? 'bg-emerald-50 text-emerald-500'
                            : 'bg-amber-50 text-amber-500'
                        }`}
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayment(row.raw || null);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFFBEB] text-[#F59E0B]"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{tablePage}</span> of{' '}
            <span className="font-semibold text-gray-700">{tableTotalPages}</span>
            {tableTotalCount ? <span className="text-gray-400"> ({tableTotalCount} total)</span> : null}
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
