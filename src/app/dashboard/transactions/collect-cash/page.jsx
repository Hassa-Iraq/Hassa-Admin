'use client';

import { Download, Eye, Search } from 'lucide-react';

const rows = [1, 2, 3];

export default function CollectCashPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <Field label="Type *">
            <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
              <option>Deliveryman</option>
            </select>
          </Field>
          <Field label="Restaurant">
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Order wise" />
          </Field>
          <Field label="Deliveryman *">
            <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
              <option>Select Deliveryman</option>
            </select>
          </Field>
          <Field label="Method *">
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Ex: Cash" />
          </Field>
          <Field label="Reference">
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Ex: Urgent" />
          </Field>
          <Field label="Amount *">
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" placeholder="Ex: IQD 100" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED]">Reset</button>
          <button className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white">Collect Cash</button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1E1E24]">Transaction Table</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500" />
              <input className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]" placeholder="Search by reference..." />
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600">
              <Download size={12} /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                {['Sl', 'Collected From', 'Type', 'Collected At', 'Payment Method', 'Collected Amount', 'Reference', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs text-gray-500">1</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">Hamza Khan</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">Deliveryman</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">09 Jan 2026 08:25 am</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">Bank Account</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">IQD 1500.00</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">N/A</td>
                  <td className="px-3 py-3">
                    <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFFBEB] text-[#F59E0B]">
                      <Eye size={12} />
                    </button>
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

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
