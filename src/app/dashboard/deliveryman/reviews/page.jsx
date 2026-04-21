'use client';

import { Download, Eye, Search, Trash2 } from 'lucide-react';

const REVIEW_ROWS = [
  { id: 1, name: 'Hamza Khan', employeeId: 'ID #1002', completed: 23, reviews: 18, rating: 4.6, status: 'Excellent', avatar: 'https://i.pravatar.cc/40?img=51' },
  { id: 2, name: 'Hamza Khan', employeeId: 'ID #1002', completed: 23, reviews: 18, rating: 4.6, status: 'Excellent', avatar: 'https://i.pravatar.cc/40?img=52' },
  { id: 3, name: 'Hamza Khan', employeeId: 'ID #1002', completed: 23, reviews: 18, rating: 4.6, status: 'Excellent', avatar: 'https://i.pravatar.cc/40?img=53' },
  { id: 4, name: 'Hamza Khan', employeeId: 'ID #1002', completed: 23, reviews: 18, rating: 4.6, status: 'Excellent', avatar: 'https://i.pravatar.cc/40?img=54' },
  { id: 5, name: 'Hamza Khan', employeeId: 'ID #1002', completed: 23, reviews: 18, rating: 4.6, status: 'Excellent', avatar: 'https://i.pravatar.cc/40?img=55' },
];

export default function DeliverymanReviewsPage() {
  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <h3 className="text-xl font-semibold text-[#1E1E24]">Deliveryman</h3>

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
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Deliveryman</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Orders Completed</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Total Reviews</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Avg. Rating</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {REVIEW_ROWS.map((row, index) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={row.avatar || '/default-image.svg'}
                        alt={row.name}
                        className="h-7 w-7 rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/default-image.svg';
                        }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#1E1E24]">{row.name}</p>
                        <p className="text-[11px] text-gray-500">{row.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.completed}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.reviews}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.rating}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.status}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFF7ED] text-[#F97316]">
                        <Eye size={12} />
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
