'use client';

import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';

const rows = [1, 2, 3];

function Toggle({ checked }) {
  return (
    <span
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
        checked ? 'bg-[#7C3AED]' : 'bg-[#E9D5FF]'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </span>
  );
}

export default function WithdrawMethodPage() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-500" />
          <input className="rounded-lg border border-gray-200 py-1.5 pl-2 pr-6 text-[11px]" placeholder="Search method..." />
        </div>
        <button className="inline-flex items-center gap-1 rounded-md bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white">
          <Plus size={12} /> Add Method
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70">
              {['Sl', 'Payment Method Name', 'Method Fields', 'Active Status', 'Default Method', 'Action'].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr key={item} className="border-b border-gray-100 last:border-b-0">
                <td className="px-3 py-3 text-xs text-gray-500">1</td>
                <td className="px-3 py-3 text-xs text-[#1E1E24]">Card</td>
                <td className="px-3 py-3 text-[10px] leading-4 text-gray-600">
                  Name: Account name Type: String Placeholder: Enter your card holder name
                  <br />
                  Name: Account number Type: Number Placeholder: Enter your account number
                  <br />
                  Name: Account name Type: String Placeholder: Enter your card holder name
                </td>
                <td className="px-3 py-3">
                  <Toggle checked />
                </td>
                <td className="px-3 py-3">
                  <Toggle checked={idx === 1} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFFBEB] text-[#F59E0B]">
                      <Eye size={12} />
                    </button>
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
  );
}
