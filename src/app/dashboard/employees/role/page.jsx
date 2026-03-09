'use client';

import { Download, Pencil, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const TABS = ['Default', 'English (EN)', 'Arabic (AR)'];
const MODULES = [
  'Order',
  'Business Setting',
  'Employee',
  'Radius Setup',
  'Report',
  'Restaurants',
  'Push Notification',
  'Disbursement',
  'Customers',
  'Coupon',
  'Deliveryman',
  'Banner',
  'Restaurant Withdraws',
  'Collect Cash',
];

const MODULE_TO_PERMISSION_KEY = {
  Order: 'orders',
  'Business Setting': 'business_setting',
  Employee: 'employee',
  'Radius Setup': 'radius_setup',
  Report: 'report',
  Restaurants: 'restaurants',
  'Push Notification': 'push_notification',
  Disbursement: 'disbursement',
  Customers: 'customers',
  Coupon: 'coupon',
  Deliveryman: 'deliveryman',
  Banner: 'banner',
  'Restaurant Withdraws': 'restaurant_withdraws',
  'Collect Cash': 'collect_cash',
};

const PERMISSION_KEY_TO_MODULE = Object.fromEntries(
  Object.entries(MODULE_TO_PERMISSION_KEY).map(([label, key]) => [key, label])
);

const formatKey = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const toIsoDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

export default function EmployeeRolePage() {
  const [activeTab, setActiveTab] = useState('Default');
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState('');
  const [search, setSearch] = useState('');
  const [apiError, setApiError] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const loadRoles = async () => {
    setLoadingRoles(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        is_active: 'true',
      });
      const { data } = await axios.get(`/api/auth/admin/employee-roles?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const payload =
        data?.data && typeof data.data === 'object'
          ? data.data
          : data;
      const list =
        payload?.roles ||
        payload?.list ||
        data?.roles ||
        data?.list ||
        payload ||
        [];
      setRoles(Array.isArray(list) ? list : []);
    } catch (error) {
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to load employee roles'
          : error?.message || 'Failed to load employee roles'
      );
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => {
      const roleName = String(role?.name || '').toLowerCase();
      const description = String(role?.description || '').toLowerCase();
      return roleName.includes(query) || description.includes(query);
    });
  }, [roles, search]);

  const toggleModule = (module) => {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((item) => item !== module) : [...prev, module]
    );
  };

  useEffect(() => {
    setSelectAll(MODULES.length > 0 && selectedModules.length === MODULES.length);
  }, [selectedModules]);

  const toggleSelectAll = () => {
    setSelectAll((prev) => {
      const next = !prev;
      setSelectedModules(next ? MODULES : []);
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError('');

    if (!form.name.trim()) {
      setApiError('Role name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const permissions = {};
      Object.values(MODULE_TO_PERMISSION_KEY).forEach((key) => {
        permissions[key] = { can_view: false, can_manage: false };
      });
      selectedModules.forEach((module) => {
        const key = MODULE_TO_PERMISSION_KEY[module];
        if (!key) return;
        permissions[key] = { can_view: true, can_manage: true };
      });

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        permissions,
        is_active: true,
      };

      const response = await axios({
        method: editingRoleId ? 'patch' : 'post',
        url: editingRoleId
          ? `/api/auth/admin/employee-roles/${editingRoleId}`
          : '/api/auth/admin/employee-roles',
        data: payload,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      toast.success(
        response?.data?.message ||
        (editingRoleId ? 'Employee role updated successfully.' : 'Employee role created successfully.')
      );
      await loadRoles();

      setForm({
        name: '',
        description: '',
      });
      setSelectedModules([]);
      setSelectAll(false);
      setEditingRoleId('');
    } catch (error) {
      setApiError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || error.message || 'Failed to save employee role'
          : error?.message || 'Failed to save employee role'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
    });
    setSelectedModules([]);
    setSelectAll(false);
    setEditingRoleId('');
  };

  const handleEditRole = (role) => {
    if (!role || typeof role !== 'object') return;
    setEditingRoleId(String(role.id || ''));
    setForm({
      name: role?.name || '',
      description: role?.description || '',
    });

    const selected = Object.entries(role?.permissions || {})
      .filter(([, value]) => value?.can_view || value?.can_manage)
      .map(([key]) => PERMISSION_KEY_TO_MODULE[key] || formatKey(key))
      .filter((module) => MODULES.includes(module));

    setSelectedModules(selected);
    setSelectAll(selected.length === MODULES.length);
    setApiError('');
  };

  return (
    <div className="pt-36 pb-8 space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] leading-none md:text-2xl font-semibold text-[#1E1E24]">Basic Information</h3>
          <p className="mt-1 text-sm text-gray-500">Setup your business information here</p>
        </div>

        <form className="p-4" onSubmit={handleSubmit}>
          <div className="rounded-lg bg-gray-50 p-3">
            {apiError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {apiError}
              </div>
            )}
            <div className="mb-3 flex items-center gap-4 border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-xs ${
                    activeTab === tab ? 'border-b-2 border-[#7C3AED] font-semibold text-[#7C3AED]' : 'text-gray-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="max-w-[520px]">
              <label className="mb-1.5 block text-xs font-medium text-[#1E1E24]">Role Name (Default)</label>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ex: Manager"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
              />
            </div>

            <div className="mt-3 max-w-[520px]">
              <label className="mb-1.5 block text-xs font-medium text-[#1E1E24]">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Role description"
                className="min-h-[86px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
              />
            </div>

            <div className="mt-3">
              <div className="mb-2 flex items-center gap-3">
                <p className="text-sm font-medium text-[#1E1E24]">Module Permission</p>
                <label className="inline-flex items-center gap-2 text-xs text-[#1E1E24]">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                  <span>Select All</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-y-2 md:grid-cols-5">
                {MODULES.map((module, index) => (
                  <label key={`${module}-${index}`} className="inline-flex items-center gap-2 text-xs text-[#1E1E24]">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module)}
                      onChange={() => toggleModule(module)}
                    />
                    <span>{module}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : (editingRoleId ? 'Update' : 'Submit')}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h3 className="text-xl font-semibold text-[#1E1E24]">Employee Role Table</h3>

          <div className="flex items-center gap-2">
            <div className="relative w-[210px]">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex: Tax"
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
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-2 py-2.5 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-2 py-2.5 text-left text-[11px] font-semibold text-[#1E1E24]">Employee Id</th>
                <th className="px-2 py-2.5 text-left text-[11px] font-semibold text-[#1E1E24]">Role Name</th>
                <th className="w-[38%] px-2 py-2.5 text-left text-[11px] font-semibold text-[#1E1E24]">Modules</th>
                <th className="px-2 py-2.5 text-left text-[11px] font-semibold text-[#1E1E24]">Created At</th>
                <th className="px-2 py-2.5 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingRoles && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    Loading roles...
                  </td>
                </tr>
              )}

              {!loadingRoles && filteredRoles.map((row, index) => {
                const modules = Object.entries(row?.permissions || {})
                  .filter(([, value]) => value?.can_view || value?.can_manage)
                  .map(([key]) => PERMISSION_KEY_TO_MODULE[key] || formatKey(key))
                  .join(', ');
                return (
                  <tr key={row?.id || `row-${index}`} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-2 py-2.5 text-xs text-gray-500">{index + 1}</td>
                    <td className="px-2 py-2.5 text-xs text-[#1E1E24]">
                      {row?.id ? `ID# ${String(row.id).slice(0, 4)}` : 'N/A'}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-[#1E1E24]">{row?.name || 'N/A'}</td>
                    <td className="w-[38%] px-2 py-2.5 text-[10px] leading-4 text-[#1E1E24]">
                      <p className="line-clamp-2 whitespace-normal break-words">{modules || 'No permissions set'}</p>
                    </td>
                    <td className="px-2 py-2.5 text-xs text-[#1E1E24]">{toIsoDate(row?.created_at)}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRole(row)}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loadingRoles && filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
