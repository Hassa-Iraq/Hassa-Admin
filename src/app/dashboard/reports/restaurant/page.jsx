'use client';

import { Download, Search } from 'lucide-react';

const tableRows = Array.from({ length: 5 }).map((_, i) => ({ id: 1002 + i }));
const bars = [3200, 4200, 6800, 8200, 7100, 7600, 2400];

export default function RestaurantReportPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-[11px] font-semibold text-[#1E1E24]">Search Data</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>Radius</option></select>
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>All Restaurants</option></select>
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>All Types</option></select>
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>All Time</option></select>
          <button className="rounded-md bg-[#6D28D9] px-5 py-2 text-sm font-semibold text-white">Filter</button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-64 rounded-lg border border-gray-100 bg-white p-4">
          <div className="grid h-full grid-cols-7 items-end gap-6">
            {bars.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-4 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#EEE7FF]" style={{ height: `${Math.max(28, h / 40)}px` }} />
                <span className="text-[10px] text-gray-500">{2020 + i}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-center text-[11px] text-gray-500">Total Order Amount</div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Restaurants report Table</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input placeholder="Search by restaurant name..." className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]" />
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600">
              <Download size={12} /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                {['Sl', 'Order ID', 'Restaurant', 'Total Food', 'Total Order', 'Total Order Amount', 'Total Discount Given', 'Total Admin Commission', 'Total VAT/TAX', 'Average Ratings'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs">{i + 1}</td>
                  <td className="px-3 py-3 text-xs">{row.id}</td>
                  <td className="px-3 py-3 text-xs">Rose Restaurant</td>
                  <td className="px-3 py-3 text-xs">8</td>
                  <td className="px-3 py-3 text-xs">8</td>
                  <td className="px-3 py-3 text-xs">IQD 19720.98</td>
                  <td className="px-3 py-3 text-xs">IQD 147.25</td>
                  <td className="px-3 py-3 text-xs">IQD 275.18</td>
                  <td className="px-3 py-3 text-xs">IQD 334.98</td>
                  <td className="px-3 py-3 text-xs text-amber-500">4.5 (120)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
