'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Pencil, Search } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';
import { useLanguage } from '@/app/i18n/LanguageContext';

const DEFAULT_EMPLOYEE_IMAGE = '/default-image.svg';
const PER_PAGE = 20;

export default function EmployeeListPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const normalizeDate = (value) => {
      if (!value) return '-';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    const normalizeRow = (item, index) => ({
      id: String(item?.id || `row-${index}`),
      employeeUserId: String(item?.user_id || item?.userId || item?.id || '').trim(),
      name:
        item?.full_name ||
        item?.name ||
        `${item?.f_name || item?.first_name || ''} ${item?.l_name || item?.last_name || ''}`.trim() ||
        'N/A',
      phone: item?.phone || '-',
      email: item?.email || '-',
      employeeRole: item?.employee_role_name || item?.role || '-',
      createdAt: normalizeDate(item?.created_at || item?.createdAt),
      avatar: item?.image_url || item?.image || item?.avatar || '',
    });

    const loadRows = async () => {
      setLoading(true);
      setApiError('');
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PER_PAGE),
          search: search.trim(),
          employee_role_id: '',
          is_active: 'true',
        });
        const { data } = await axios.get(`/api/auth/admin/employees?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const payload =
          data?.data && typeof data.data === 'object'
            ? data.data
            : data;
        const list =
          payload?.employees ||
          payload?.roles ||
          payload?.list ||
          data?.employees ||
          data?.roles ||
          data?.list ||
          [];

        const normalized = (Array.isArray(list) ? list : []).map(normalizeRow);
        setRows(normalized);

        const total =
          payload?.pagination?.total ??
          payload?.total ??
          payload?.total_size ??
          data?.pagination?.total ??
          data?.total ??
          data?.total_size ??
          normalized.length;
        const parsedTotal = Number(total);
        setTotalCount(Number.isFinite(parsedTotal) ? parsedTotal : normalized.length);
      } catch (error) {
        setRows([]);
        setTotalCount(0);
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to load employee list'
          : error?.message || 'Failed to load employee list';
        setApiError(message);
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, [page, search]);

  const filteredRows = rows;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const handleExport = () => {
    if (!filteredRows.length) return;

    const headers = ['Sl', 'Employee Name', 'Phone', 'Email', 'Role', 'Created At'];
    const csvRows = filteredRows.map((row, index) => [
      index + 1,
      row.name,
      row.phone,
      row.email,
      row.employeeRole,
      row.createdAt,
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
    link.setAttribute('download', 'employees-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const goToEmployeeDetail = (row) => {
    const id = String(row?.employeeUserId || '').trim();
    if (!id) return;
    router.push(`/dashboard/employees/${encodeURIComponent(id)}`);
  };

  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h3 className="text-2xl font-semibold text-[#1E1E24]">{t.employeeList}</h3>

          <div className="flex items-center gap-2">
            <div className="relative w-[220px]">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                placeholder={t.searchByName}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
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
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.sl}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.employeeName}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.contact}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.email}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.role}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.createdAt}</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <TableLoadingSkeleton colSpan={7} rows={8} />
              )}
              {!loading && apiError && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-xs text-red-500">
                    {apiError}
                  </td>
                </tr>
              )}
              {!loading && !apiError && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">
                    {t.noRecordsFound}
                  </td>
                </tr>
              )}
              {!loading && !apiError && filteredRows.map((row, index) => (
                <tr
                  key={row.id}
                  onClick={() => goToEmployeeDetail(row)}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                >
                  <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={row.avatar || DEFAULT_EMPLOYEE_IMAGE}
                        alt={row.name}
                        className="h-7 w-7 rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = DEFAULT_EMPLOYEE_IMAGE;
                        }}
                      />
                      <p className="text-xs font-semibold text-[#1E1E24]">{row.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{formatPhoneWithFlag(row.phone)}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.email}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.employeeRole}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.createdAt}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToEmployeeDetail(row);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFF7ED] text-[#F97316]"
                        title="View"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!row.employeeUserId) return;
                          router.push(`/dashboard/employees/add?employee_user_id=${row.employeeUserId}`);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
