'use client';

import { Download, Search } from 'lucide-react';

const rows = Array.from({ length: 7 }).map((_, i) => ({
  id: 1002 + i,
  restaurant: 'Rose Restaurant',
  customer: 'Hamza Khan',
}));

function Card({ title, value, tone }) {
  const toneCls =
    tone === 'green'
      ? 'text-emerald-500'
      : tone === 'red'
      ? 'text-rose-500'
      : 'text-[#7C3AED]';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <p className={`text-xl font-semibold ${toneCls}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{title}</p>
    </div>
  );
}

export default function TransactionReportPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-[11px] font-semibold text-[#1E1E24]">Search Data</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>Radius</option></select>
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>All Restaurants</option></select>
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>All Time</option></select>
          <button className="rounded-md bg-[#6D28D9] px-5 py-2 text-sm font-semibold text-white">Filter</button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card title="Completed Transaction" value="IQD 14556.46" tone="green" />
        <Card title="Refunded Transaction" value="IQD 14556.46" tone="red" />
        <Card title="Admin Earning" value="IQD 12.45k" tone="violet" />
        <Card title="Restaurant Earning" value="IQD 12.45k" tone="violet" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Order Transactions</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
              <input placeholder="Search by reference..." className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]" />
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600">
              <Download size={12} /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                {['Sl', 'Order ID', 'Restaurant', 'Customer Name', 'Total Amount', 'Total Item Discount', 'Coupon Discount', 'Referral Discount', 'Discounted Amount', 'Vat/Tax', 'Delivery Charge', 'Order Amount', 'Admin Discount', 'Restaurant Discount', 'Admin Commission', 'Service Charge', 'Extra'].map((h) => (
                  <th key={h} className="px-2 py-3 text-left text-[10px] font-semibold text-[#1E1E24]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id + index} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-2 py-2 text-[11px] text-gray-500">{index + 1}</td>
                  <td className="px-2 py-2 text-[11px]">{row.id}</td>
                  <td className="px-2 py-2 text-[11px]">{row.restaurant}</td>
                  <td className="px-2 py-2 text-[11px]">{row.customer}</td>
                  <td className="px-2 py-2 text-[11px]">IQD 3,728.00</td>
                  <td className="px-2 py-2 text-[11px]">IQD 8.50</td>
                  <td className="px-2 py-2 text-[11px]">IQD 0.00</td>
                  <td className="px-2 py-2 text-[11px]">IQD 0.00</td>
                  <td className="px-2 py-2 text-[11px]">IQD 18.50</td>
                  <td className="px-2 py-2 text-[11px]">IQD 35.15</td>
                  <td className="px-2 py-2 text-[11px]">IQD 2.19K</td>
                  <td className="px-2 py-2 text-[11px]">IQD 10.00</td>
                  <td className="px-2 py-2 text-[11px]">IQD 2.58K</td>
                  <td className="px-2 py-2 text-[11px]">Admin</td>
                  <td className="px-2 py-2 text-[11px]">IQD 373.80</td>
                  <td className="px-2 py-2 text-[11px]">IQD 10.00</td>
                  <td className="px-2 py-2 text-[11px]">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
