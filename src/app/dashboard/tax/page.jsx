'use client';

import { Download, Pencil, Search } from 'lucide-react';

const TAX_ROWS = [
  { id: 1, name: 'GST', rate: '15%', active: true },
  { id: 2, name: 'Custom Tax', rate: '10%', active: true },
  { id: 3, name: 'Income Tax', rate: '5%', active: true },
];

function Toggle({ checked }) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
        checked ? 'bg-[#7C3AED]' : 'bg-gray-300'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[17px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function TaxSetupPage() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#1E1E24]">List of Taxes</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px] text-gray-700 placeholder:text-gray-400"
              placeholder="Ex: Tax"
            />
          </div>
          <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70">
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Sl</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Tax Name</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Tax Rate</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {TAX_ROWS.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-3 py-3 text-xs text-gray-500">{row.id}</td>
                <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.name}</td>
                <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.rate}</td>
                <td className="px-3 py-3">
                  <Toggle checked={row.active} />
                </td>
                <td className="px-3 py-3">
                  <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]">
                    <Pencil size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
