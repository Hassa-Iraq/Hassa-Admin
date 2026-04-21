'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Download, Eye, Search } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { API_BASE_URL } from '@/app/config';
import { APP_CURRENCY, formatCurrencyFixed2 } from '@/app/lib/currency';
import { useLanguage } from '@/app/i18n/LanguageContext';

const INITIAL_FILTERS = {
  search: '',
};
const PER_PAGE = 20;

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatAmount = (value, currency = APP_CURRENCY) => formatCurrencyFixed2(value, currency);

const toDisplayName = (entity) => {
  const fullName = String(entity?.full_name || entity?.name || '').trim();
  if (fullName) return fullName;
  const joined = `${entity?.f_name || entity?.first_name || ''} ${entity?.l_name || entity?.last_name || ''}`.trim();
  if (joined) return joined;
  const email = String(entity?.email || '').trim();
  if (!email) return 'N/A';
  const prefix = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || '';
  return prefix
    ? prefix
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'N/A';
};

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [apiRows, setApiRows] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setFetchError('');

      try {
        const token = localStorage.getItem('token') || '';
        const endpoint = `/api/orders/customers?page=${encodeURIComponent(
          String(page)
        )}&limit=${encodeURIComponent(String(PER_PAGE))}&search=${encodeURIComponent(
          filters.search.trim()
        )}&restaurant_id=&date_from=&date_to=`;
        const response = await fetch(endpoint, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || 'Failed to fetch customers');
        }

        const list =
          payload?.data?.customers ||
          payload?.data?.list ||
          payload?.customers ||
          payload?.list ||
          payload?.data ||
          [];

        const rows = (Array.isArray(list) ? list : []).map((item, index) => {
          const customer = item?.customer || item?.user || item || {};
          const id = String(
            customer?.id ||
            item?.id ||
            item?.user_id ||
            item?.customer_id ||
            `customer-${index}`
          );
          const totalOrders =
            item?.total_orders ??
            item?.orders_count ??
            item?.orders ??
            item?.totalOrders ??
            0;

          const totalAmount =
            item?.total_spent ??
            item?.total_order_amount ??
            item?.total_amount ??
            item?.order_amount ??
            item?.amount ??
            0;

          const activeValue =
            customer?.is_active ??
            customer?.active ??
            item?.is_active ??
            item?.active ??
            true;

          return {
            key: `${id}-${index}`,
            id,
            name: toDisplayName(customer),
            email: customer?.email || item?.email || '-',
            phone: customer?.phone || item?.phone || '-',
            totalOrders: Number(totalOrders) || 0,
            joiningDate: formatDate(
              item?.first_order_at ||
              item?.last_order_at ||
              customer?.created_at ||
              item?.created_at ||
              customer?.joining_date ||
              item?.joining_date
            ),
            totalAmount: formatAmount(totalAmount, item?.currency || customer?.currency || APP_CURRENCY),
            active: Boolean(activeValue),
            avatar: toAbsoluteAssetUrl(customer?.profile_picture_url || customer?.image_url || customer?.avatar || ''),
          };
        });

        setApiRows(rows);

        const total =
          payload?.data?.total ??
          payload?.total ??
          payload?.data?.total_size ??
          payload?.total_size ??
          payload?.data?.count ??
          rows.length;
        const parsedTotal = Number(total);
        setTotalCount(Number.isFinite(parsedTotal) ? parsedTotal : rows.length);
      } catch (error) {
        setApiRows([]);
        setTotalCount(0);
        setFetchError(error?.message || 'Failed to fetch customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [page, filters.search]);

  const rows = apiRows;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const handleExport = () => {
    if (!rows.length) return;

    const headers = [
      'Sl',
      'Name',
      'Email',
      'Phone',
      'Total Orders',
      'Joining Date',
      `Total Order Amount (${APP_CURRENCY})`,
      'Active',
    ];

    const csvRows = rows.map((row, index) => [
      index + 1,
      row.name,
      row.email,
      row.phone,
      row.totalOrders,
      row.joiningDate,
      row.totalAmount,
      row.active ? 'Yes' : 'No',
    ]);

    const escapeCsv = (value) => {
      const raw = value === null || value === undefined ? '' : String(value);
      const needsQuotes = /[",\n]/.test(raw);
      const escaped = raw.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...csvRows.map((r) => r.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setStatusMap(
      Object.fromEntries(rows.map((row) => [row.key, row.active]))
    );
  }, [rows]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (name === 'search') setPage(1);
  };

  const toggleStatus = (key) => {
    setStatusMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="pt-36 pb-8 space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h3 className="text-base font-semibold text-[#1E1E24]">{t.customersList}</h3>

          <div className="flex items-center gap-2">
            <div className="relative w-[250px]">
              <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                name="search"
                value={filters.search}
                onChange={updateFilter}
                placeholder={t.searchByName}
                className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
            >
              <Download size={12} />
              <span>{t.export}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.sl}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.name}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.contact}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.totalOrders}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.joiningDate}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.totalOrderAmount}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.orderStatus}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-500">
                    {t.loadingCustomers}
                  </td>
                </tr>
              )}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-rose-500">
                    {fetchError}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && rows.map((row, index) => {
                const key = row.key;
                return (
                  <tr
                    key={key}
                    onClick={() => router.push(`/dashboard/customers/${row.id}`)}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                  >
                    <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={row.avatar || '/default-image.svg'}
                          alt={row.name}
                          className="h-7 w-7 rounded-full object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = '/default-image.svg';
                          }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#1E1E24]">{row.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-[#1E1E24]">{row.email}</p>
                      <p className="text-[11px] text-gray-500">{formatPhoneWithFlag(row.phone)}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.totalOrders}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.joiningDate}</td>
                    <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.totalAmount}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleStatus(key)}
                        className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors ${
                          statusMap[key] ? 'bg-[#7C3AED]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            statusMap[key] ? 'translate-x-[17px]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/dashboard/customers/${row.id}`);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFF7ED] text-[#F97316]"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && !fetchError && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-500">
                    {t.noCustomersFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            {t.page}{' '}
            <span className="font-semibold text-gray-700">{page}</span> {t.of}{' '}
            <span className="font-semibold text-gray-700">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={14} />
              {t.prev}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.next}
              <ChevronRight size={14} />
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
      <label className="mb-1.5 block text-[11px] font-medium text-[#1E1E24]">{label}</label>
      {children}
    </div>
  );
}
