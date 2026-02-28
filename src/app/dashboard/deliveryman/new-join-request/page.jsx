'use client';

import { Check, Download, Eye, Search, SlidersHorizontal, X } from 'lucide-react';

const REQUEST_ROWS = [
  {
    id: 1,
    name: 'Hamza Khan',
    contactName: 'Hamza Khan',
    contactPhone: '+91**********',
    radius: 'All over the world',
    jobType: 'Freelance',
    vehicleType: 'Car',
    status: 'Pending',
    avatar: 'https://i.pravatar.cc/40?img=31',
  },
  {
    id: 2,
    name: 'Hamza Khan',
    contactName: 'Hamza Khan',
    contactPhone: '+91**********',
    radius: 'All over the world',
    jobType: 'Freelance',
    vehicleType: 'Car',
    status: 'Pending',
    avatar: 'https://i.pravatar.cc/40?img=32',
  },
];

export default function NewJoinRequestPage() {
  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              placeholder="Search any order..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Download size={12} />
              <span>Export</span>
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <SlidersHorizontal size={12} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Contact</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Radius</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Job Type</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Vehicle Type</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {REQUEST_ROWS.map((row, index) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img src={row.avatar} alt={row.name} className="h-7 w-7 rounded-full object-cover" />
                      <p className="text-xs font-semibold text-[#1E1E24]">{row.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-[#1E1E24]">{row.contactName}</p>
                    <p className="text-[11px] text-gray-500">{row.contactPhone}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.radius}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.jobType}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.vehicleType}</td>
                  <td className="px-3 py-3">
                    <span className="inline-block rounded-sm bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-medium text-[#F59E0B]">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFF7ED] text-[#F97316]">
                        <Eye size={12} />
                      </button>
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#99F6E4] bg-[#ECFEFF] text-[#14B8A6]">
                        <Check size={12} />
                      </button>
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]">
                        <X size={12} />
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
