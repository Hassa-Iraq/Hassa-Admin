'use client';

import { Download, Pencil, Search, Trash2 } from 'lucide-react';

const EMPLOYEE_ROWS = [
  {
    id: 1,
    name: 'Hamza Khan',
    phone: '+91**********',
    email: 'h****@gmail.com',
    createdAt: '07 Jan, 2026',
    avatar: 'https://i.pravatar.cc/40?img=21',
  },
  {
    id: 2,
    name: 'Hamza Khan',
    phone: '+91**********',
    email: 'h****@gmail.com',
    createdAt: '07 Jan, 2026',
    avatar: 'https://i.pravatar.cc/40?img=22',
  },
  {
    id: 3,
    name: 'Hamza Khan',
    phone: '+91**********',
    email: 'h****@gmail.com',
    createdAt: '07 Jan, 2026',
    avatar: 'https://i.pravatar.cc/40?img=23',
  },
];

export default function EmployeeListPage() {
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
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Created At</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEE_ROWS.map((row, index) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img src={row.avatar} alt={row.name} className="h-7 w-7 rounded-full object-cover" />
                      <p className="text-xs font-semibold text-[#1E1E24]">{row.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.phone}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.email}</td>
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
