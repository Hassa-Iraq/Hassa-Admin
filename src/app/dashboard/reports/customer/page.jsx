'use client';

import { Download, Search } from 'lucide-react';

const rows = Array.from({ length: 5 }).map((_, i) => ({ id: i + 1 }));

function AmountCard({ title, value, color }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{title}</p>
    </div>
  );
}

export default function CustomerWalletReportPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-[11px] font-semibold text-[#1E1E24]">Search Data</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input className="rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="mm/dd/yyyy" />
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>Select Customer</option></select>
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>All Time</option></select>
          <button className="rounded-md border border-[#7C3AED] bg-white px-5 py-2 text-sm font-semibold text-[#7C3AED]">Reset</button>
          <button className="rounded-md bg-[#6D28D9] px-5 py-2 text-sm font-semibold text-white">Filter</button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <AmountCard title="Debit" value="IQD 14556.46" color="text-emerald-500" />
        <AmountCard title="Credit" value="IQD 14556.46" color="text-rose-500" />
        <AmountCard title="Balance" value="IQD 14556.46" color="text-[#7C3AED]" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Transactions</h3>
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
                {['Sl', 'Transaction ID', 'Customer', 'Credit', 'Debit', 'Balance', 'Transaction Type', 'Reference', 'Created At'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs">{row.id}</td>
                  <td className="px-3 py-3 text-xs">asf9f481a-239e-4f62-90b2-58ae90f9eec1</td>
                  <td className="px-3 py-3 text-xs">Hamza Khan</td>
                  <td className="px-3 py-3 text-xs">+ 276.27</td>
                  <td className="px-3 py-3 text-xs">- 0.00</td>
                  <td className="px-3 py-3 text-xs">+ 276.27</td>
                  <td className="px-3 py-3 text-xs text-emerald-500">Cash Back</td>
                  <td className="px-3 py-3 text-xs">100122</td>
                  <td className="px-3 py-3 text-xs">12 Jan, 2026 11:10 pm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
