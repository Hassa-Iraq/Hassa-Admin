'use client';

import { useMemo, useState } from 'react';
import { Download, Eye, Search } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';

const CUSTOMER_ROWS = [
  { id: 1002, name: 'Hamza Khan', email: 'h********@gmail.com', phone: '+9*************', totalOrders: 22, joiningDate: '12 Jan 2026', totalAmount: '$12,242.45', active: true, avatar: 'https://i.pravatar.cc/40?img=12' },
  { id: 1002, name: 'Hamza Khan', email: 'h********@gmail.com', phone: '+9*************', totalOrders: 22, joiningDate: '12 Jan 2026', totalAmount: '$12,242.45', active: true, avatar: 'https://i.pravatar.cc/40?img=13' },
  { id: 1002, name: 'Hamza Khan', email: 'h********@gmail.com', phone: '+9*************', totalOrders: 22, joiningDate: '12 Jan 2026', totalAmount: '$12,242.45', active: true, avatar: 'https://i.pravatar.cc/40?img=14' },
  { id: 1002, name: 'Hamza Khan', email: 'h********@gmail.com', phone: '+9*************', totalOrders: 22, joiningDate: '12 Jan 2026', totalAmount: '$12,242.45', active: true, avatar: 'https://i.pravatar.cc/40?img=15' },
  { id: 1002, name: 'Hamza Khan', email: 'h********@gmail.com', phone: '+9*************', totalOrders: 22, joiningDate: '12 Jan 2026', totalAmount: '$12,242.45', active: true, avatar: 'https://i.pravatar.cc/40?img=16' },
  { id: 1002, name: 'Hamza Khan', email: 'h********@gmail.com', phone: '+9*************', totalOrders: 22, joiningDate: '12 Jan 2026', totalAmount: '$12,242.45', active: true, avatar: 'https://i.pravatar.cc/40?img=17' },
];

const INITIAL_FILTERS = {
  orderDate: '',
  joiningDate: '',
  customerStatus: '',
  chooseFirst: '',
  search: '',
};

export default function CustomersPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [statusMap, setStatusMap] = useState(() =>
    Object.fromEntries(CUSTOMER_ROWS.map((row, index) => [`${row.id}-${index}`, row.active]))
  );

  const rows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    if (!query) return CUSTOMER_ROWS;
    return CUSTOMER_ROWS.filter((row) => row.name.toLowerCase().includes(query));
  }, [filters.search]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStatus = (key) => {
    setStatusMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="pt-36 pb-8 space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Order Date">
            <input
              name="orderDate"
              value={filters.orderDate}
              onChange={updateFilter}
              placeholder="Select date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </Field>

          <Field label="Customer Joining Date">
            <input
              name="joiningDate"
              value={filters.joiningDate}
              onChange={updateFilter}
              placeholder="Select date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </Field>

          <Field label="Customer Status">
            <select
              name="customerStatus"
              value={filters.customerStatus}
              onChange={updateFilter}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Choose First">
            <input
              name="chooseFirst"
              value={filters.chooseFirst}
              onChange={updateFilter}
              placeholder="Ex: 30"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </Field>
        </div>

        <div className="mt-3 flex justify-end">
          <button className="rounded-md bg-[#6D28D9] px-7 py-2 text-xs font-semibold text-white hover:bg-[#5B21B6]">
            Filter
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h3 className="text-base font-semibold text-[#1E1E24]">Customers List</h3>

          <div className="flex items-center gap-2">
            <div className="relative w-[250px]">
              <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
                name="search"
                value={filters.search}
                onChange={updateFilter}
                placeholder="Search by name..."
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
          <table className="w-full min-w-[1150px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Contact</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Total Orders</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Joining Date</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Total Order Amount</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Order Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const key = `${row.id}-${index}`;
                return (
                  <tr key={key} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <img src={row.avatar} alt={row.name} className="h-7 w-7 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-semibold text-[#1E1E24]">{row.name}</p>
                          <p className="text-[11px] text-gray-500">ID #{row.id}</p>
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
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFF7ED] text-[#F97316]">
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
