'use client';

import { Pencil } from 'lucide-react';

const rows = [
  { id: 1, name: 'Facebook', link: 'https://www.facebook.com/', active: true },
  { id: 2, name: 'Pinterest', link: 'https://www.pinterest.com/', active: true },
  { id: 3, name: 'LinkedIn', link: 'https://bd.linkedin.com/', active: true },
  { id: 4, name: 'Twitter', link: 'https://twitter.com/?lang=en', active: true },
  { id: 5, name: 'Instagram', link: 'https://www.instagram.com/?hl=en', active: true },
];

function Toggle({ checked = true }) {
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

export default function SocialMediaPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#1E1E24]">Name</label>
            <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
              <option>GMT(06:00) Central Time (U.S & Canada)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#1E1E24]">Social Media Link</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700" defaultValue="5" />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="rounded-md border border-[#7C3AED] bg-white px-5 py-1.5 text-xs font-semibold text-[#7C3AED]">Reset</button>
          <button className="rounded-md bg-[#7C3AED] px-5 py-1.5 text-xs font-semibold text-white">Save</button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Social Media Link</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs text-gray-500">{row.id}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.name}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.link}</td>
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
    </div>
  );
}
