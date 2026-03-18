'use client';

import { Download, Search, Wallet } from 'lucide-react';

function SummaryCard({ label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED]">
        <Wallet size={11} className="text-white" />
      </span>
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="ml-auto text-sm font-semibold text-[#1E1E24]">{value}</p>
    </div>
  );
}

export default function RestaurantVatReportPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">Admin Tax Report</h3>
        <p className="mb-3 mt-1 text-xs text-gray-500">
          To generate you tax report please select & input following field and submit for the result.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>Select date range</option></select>
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>Select tax rate</option></select>
          <select className="rounded-lg border border-gray-200 px-3 py-2 text-xs"><option>Select calculate tax</option></select>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED]">Reset</button>
          <button className="rounded-md bg-[#6D28D9] px-5 py-1.5 text-xs font-semibold text-white">Submit</button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard label="Total Orders" value="235" />
        <SummaryCard label="Total Order Amount" value="$ 12.45k" />
        <SummaryCard label="Total Tax Amount" value="$ 12.45k" />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-[28px] font-semibold leading-none text-[#1E1E24]">All Restaurant Taxes</h3>
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
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6">
          <div className="rounded-2xl border-2 border-[#7C3AED] p-4 text-[#7C3AED]">!</div>
          <p className="text-2xl font-semibold text-[#1E1E24]">No Data Found</p>
        </div>
      </section>
    </div>
  );
}
