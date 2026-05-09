'use client';

import { Download, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
};

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

const pickString = (...values) => {
  const v = values.find((x) => typeof x === 'string' && x.trim());
  return v ? v.trim() : '';
};

const shortenId = (value, left = 6, right = 4) => {
  const s = String(value || '').trim();
  if (!s) return '-';
  if (s.length <= left + right + 3) return s;
  return `${s.slice(0, left)}...${s.slice(-right)}`;
};

function AmountCard({ title, value, color }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{title}</p>
    </div>
  );
}

export default function CustomerWalletReportPage() {
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState('');

  const [customerId, setCustomerId] = useState('');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [direction, setDirection] = useState('');
  const [type, setType] = useState('');

  const [applied, setApplied] = useState({
    customerId: '',
    q: '',
    dateFrom: '',
    dateTo: '',
    direction: '',
    type: '',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ debit_total: 0, credit_total: 0 });
  const [transactions, setTransactions] = useState([]);

  const customerOptions = useMemo(() => {
    const list = Array.isArray(customers) ? customers : [];
    return list
      .map((c) => ({
        id: pickString(String(c?.id ?? '')),
        label: pickString(c?.full_name, c?.name) || 'Customer',
        phone: pickString(c?.phone),
        email: pickString(c?.email),
      }))
      .filter((c) => Boolean(c.id));
  }, [customers]);

  useEffect(() => {
    let cancelled = false;
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      setCustomersError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          q: '',
          limit: '1000',
        });
        const res = await fetch(`/api/admin/analytics/reports/wallet/customers?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch customers');

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const list = data?.customers || payload?.customers || [];
        if (!cancelled) setCustomers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) {
          setCustomers([]);
          setCustomersError(e?.message || 'Failed to fetch customers');
        }
      } finally {
        if (!cancelled) setCustomersLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [applied]);

  useEffect(() => {
    let cancelled = false;
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
        });
        if (applied.customerId) params.set('customer_id', applied.customerId);
        if (applied.q) params.set('q', applied.q);
        if (applied.direction) params.set('direction', applied.direction);
        if (applied.type) params.set('type', applied.type);
        if (applied.dateFrom) params.set('date_from', applied.dateFrom);
        if (applied.dateTo) params.set('date_to', applied.dateTo);

        const res = await fetch(`/api/admin/analytics/reports/wallet/transactions?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch report');

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const summaryRaw = data?.summary && typeof data.summary === 'object' ? data.summary : {};
        const list = data?.transactions || data?.list || payload?.transactions || [];
        const pagination = data?.pagination || payload?.pagination || {};

        if (!cancelled) {
          setSummary({
            debit_total: toNumber(summaryRaw?.debit_total ?? summaryRaw?.debitTotal ?? 0),
            credit_total: toNumber(summaryRaw?.credit_total ?? summaryRaw?.creditTotal ?? 0),
          });
          setTransactions(Array.isArray(list) ? list : []);

          const tp = Number(pagination?.totalPages ?? pagination?.total_pages ?? data?.totalPages ?? 1) || 1;
          const tc = Number(pagination?.total ?? data?.total ?? 0) || 0;
          setTotalPages(tp > 0 ? tp : 1);
          setTotalCount(tc);
        }
      } catch (e) {
        if (!cancelled) {
          setSummary({ debit_total: 0, credit_total: 0 });
          setTransactions([]);
          setTotalPages(1);
          setTotalCount(0);
          setError(e?.message || 'Failed to fetch report');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [page, applied]);

  const rows = useMemo(() => {
    const list = Array.isArray(transactions) ? transactions : [];
    return list.map((t, idx) => {
      const id = t?.transaction_id ?? `${page}-${idx}`;
      const rowKey = `${id}-${page}-${idx}`;
      const customerPhone = pickString(t?.customer_phone);
      const referenceId = pickString(String(t?.reference_id ?? ''));
      const referenceType = pickString(String(t?.reference_type ?? ''));
      return {
        id,
        rowKey,
        sl: (page - 1) * 20 + idx + 1,
        transactionId: t?.transaction_id ?? '-',
        customerName: t?.customer_name ?? '-',
        customerPhone,
        credit: t?.credit ?? 0,
        debit: t?.debit ?? 0,
        balance: t?.balance ?? '-',
        transactionType: t?.transaction_type ?? '-',
        referenceId: referenceId || '-',
        referenceType: referenceType || '-',
        createdAt: formatDateTime(t?.created_at),
      };
    });
  }, [transactions, page]);

  const totals = useMemo(() => {
    const debit = toNumber(summary?.debit_total ?? 0);
    const credit = toNumber(summary?.credit_total ?? 0);
    const balance = credit - debit;
    return { debit, credit, balance };
  }, [summary]);

  const handleReset = () => {
    setCustomerId('');
    setQ('');
    setDateFrom('');
    setDateTo('');
    setDirection('');
    setType('');
    setApplied({
      customerId: '',
      q: '',
      dateFrom: '',
      dateTo: '',
      direction: '',
      type: '',
    });
  };

  const handleApply = () => {
    setApplied({
      customerId,
      q: q.trim(),
      dateFrom,
      dateTo,
      direction,
      type,
    });
  };

  const exportRows = () => {
    if (!rows.length) return;

    const headers = [
      'Sl',
      'Transaction ID',
      'Customer Name',
      'Customer Phone',
      'Credit',
      'Debit',
      'Balance',
      'Transaction Type',
      'Reference Type',
      'Reference ID',
      'Created At',
    ];

    const escapeCsv = (v) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((r) => {
        const row = [
          r.sl,
          r.transactionId,
          r.customerName,
          r.customerPhone || '',
          r.credit,
          r.debit,
          r.balance,
          r.transactionType,
          r.referenceType,
          r.referenceId,
          r.createdAt,
        ];
        return row.map(escapeCsv).join(',');
      }),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-wallet-transactions.csv';
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
          <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                const next = e.target.value;
                setDateFrom(next);
                setApplied((prev) => ({ ...prev, dateFrom: next }));
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                const next = e.target.value;
                setDateTo(next);
                setApplied((prev) => ({ ...prev, dateTo: next }));
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
              placeholder="To"
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            {customersLoading ? <LoadingSpinner size="xs" label="Loading customers" /> : null}
            <select
              value={customerId}
              onChange={(e) => {
                const next = e.target.value;
                setCustomerId(next);
                setApplied((prev) => ({
                  ...prev,
                  customerId: next,
                }));
              }}
              disabled={customersLoading}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <option value="">{customersLoading ? '\u00A0' : 'Select Customer'}</option>
              {customerOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-[#7C3AED] bg-white px-5 py-2 text-sm font-semibold text-[#7C3AED] md:col-span-1"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-[#6D28D9] px-5 py-2 text-sm font-semibold text-white md:col-span-1"
          >
            Filter
          </button>
        </div>
        {customersError ? (
          <p className="mt-2 text-[11px] text-rose-600">{customersError}</p>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <AmountCard title="Debit" value={formatMoney(totals.debit)} color="text-rose-500" />
        <AmountCard title="Credit" value={formatMoney(totals.credit)} color="text-emerald-500" />
        <AmountCard title="Balance (Credit - Debit)" value={formatMoney(totals.balance)} color="text-[#7C3AED]" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Transactions</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                value={q}
                onChange={(e) => {
                  const next = e.target.value;
                  setQ(next);
                  setApplied((prev) => ({ ...prev, q: next.trim() }));
                }}
                placeholder="Search..."
                className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]"
              />
            </div>
            <button
              type="button"
              onClick={exportRows}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] !font-normal !normal-case !tracking-normal text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={12} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                {['Sl', 'Transaction ID', 'Customer', 'Credit', 'Debit', 'Balance', 'Transaction Type', 'Reference', 'Created At'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableLoadingSkeleton colSpan={9} rows={8} variant="cells" />
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-xs text-rose-600">
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-xs text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.rowKey} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70">
                    <td className="px-3 py-3 text-xs">{row.sl}</td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-[#1E1E24]" title={row.transactionId}>
                        {shortenId(row.transactionId)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-[#1E1E24]">{row.customerName}</div>
                      {row.customerPhone ? (
                        <div className="mt-0.5 text-[11px] text-gray-500">{row.customerPhone}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        +{formatMoney(row.credit)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                        -{formatMoney(row.debit)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#1E1E24]">{formatMoney(row.balance)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-[#6D28D9]">
                        {row.transactionType}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-[#1E1E24]" title={row.referenceId}>
                        {shortenId(row.referenceId)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">{row.referenceType}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700">{row.createdAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalPages}</span>
            {totalCount ? <span className="text-gray-400"> ({totalCount} total)</span> : null}
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
    </div>
  );
}
