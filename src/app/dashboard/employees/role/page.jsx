'use client';

import { Download, Pencil, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
  'Banner',
];

const ROLE_ROWS = [
  {
    id: 1,
    employeeId: 'ID# 1002',
    roleName: 'Customer Care Executive',
    modules: 'Order, Business Settings, Restaurant Withdraw, Customers, Report, Coupon, Deliveryman, Push Notification',
    createdAt: '07 Feb 2026',
  },
  {
    id: 2,
    employeeId: 'ID# 1002',
    roleName: 'Manager',
    modules: 'Order, Business Settings, Restaurant Withdraw, Customers, Report, Coupon, Deliveryman, Push Notification',
    createdAt: '07 Feb 2026',
  },
  {
    id: 3,
    employeeId: 'ID# 1002',
    roleName: 'Customer Care Executive',
    modules: 'Order, Business Settings, Restaurant Withdraw, Customers, Report, Coupon, Deliveryman, Push Notification',
    createdAt: '07 Feb 2026',
  },
];

export default function EmployeeRolePage() {
  const [activeTab, setActiveTab] = useState('Default');
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const toggleModule = (module) => {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((item) => item !== module) : [...prev, module]
    );
  };

  const handleSelectAll = () => {
    setSelectAll((prev) => {
      const next = !prev;
      setSelectedModules(next ? MODULES : []);
      return next;
    });
  };

  return (
    <div className="pt-36 pb-8 space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] leading-none md:text-2xl font-semibold text-[#1E1E24]">Basic Information</h3>
          <p className="mt-1 text-sm text-gray-500">Setup your business information here</p>
        </div>

        <div className="p-4">
          <div className="rounded-lg bg-gray-50 p-3">
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
                placeholder="Ex: Manager"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
              />
            </div>

            <div className="mt-3">
              <div className="mb-2 flex items-center gap-3">
                <p className="text-sm font-medium text-[#1E1E24]">Module Permission</p>
                <label className="inline-flex items-center gap-2 text-xs text-[#1E1E24]">
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
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
              <button className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]">
                Reset
              </button>
              <button className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9]">
                Submit
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h3 className="text-xl font-semibold text-[#1E1E24]">Employee Role Table</h3>

          <div className="flex items-center gap-2">
            <div className="relative w-[210px]">
              <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input
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
              {ROLE_ROWS.map((row, index) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-2 py-2.5 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-2 py-2.5 text-xs text-[#1E1E24]">{row.employeeId}</td>
                  <td className="px-2 py-2.5 text-xs text-[#1E1E24]">{row.roleName}</td>
                  <td className="w-[38%] px-2 py-2.5 text-[10px] leading-4 text-[#1E1E24]">
                    <p className="line-clamp-2 whitespace-normal break-words">{row.modules}</p>
                  </td>
                  <td className="px-2 py-2.5 text-xs text-[#1E1E24]">{row.createdAt}</td>
                  <td className="px-2 py-2.5">
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
