'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Pencil, Search, Trash2 } from 'lucide-react';
import axios from 'axios';
import { formatPhoneWithFlag } from '@/app/lib/phone';

export default function EmployeeListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');

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
          page: '1',
          limit: '20',
          search: '',
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
      } catch (error) {
        setRows([]);
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to load employee list'
          : error?.message || 'Failed to load employee list';
        setApiError(message);
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.name, row.email, row.phone].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [rows, search]);

  const getInitials = (name) =>
    String(name || '')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h3 className="text-2xl font-semibold text-[#1E1E24]">Employee List</h3>

          <div className="flex items-center gap-2">
            <div className="relative w-[220px]">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                placeholder="Search by name..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
              />
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Download size={12} />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Employee Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Contact</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Email</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Role</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Created At</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">
                    Loading employee list...
                  </td>
                </tr>
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
                    No records found.
                  </td>
                </tr>
              )}
              {!loading && !apiError && filteredRows.map((row, index) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {row.avatar ? (
                        <img src={row.avatar} alt={row.name} className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-[10px] font-semibold text-purple-700">
                          {getInitials(row.name) || 'NA'}
                        </div>
                      )}
                      <p className="text-xs font-semibold text-[#1E1E24]">{row.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{formatPhoneWithFlag(row.phone)}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.email}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.employeeRole}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.createdAt}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]">
                        <Pencil size={12} />
                      </button>
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
