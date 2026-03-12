'use client';

import { useState, useMemo } from 'react';
import {
  Search, Download, SlidersHorizontal,
  Eye, Check, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';
import { toast } from 'sonner';

const REQUESTS = [
  {
    id: 1,
    name: 'Rose Restaurant',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=rose1',
    rating: 4.3,
    reviews: 100,
    owner: 'Hamza Khan',
    phone: '+92**********',
    radius: '5 km',
    businessMode: 'Car',
    status: 'Pending',
    address: 'House #4, Road #4, Riyadh',
  },
  {
    id: 2,
    name: 'Rose Restaurant',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=rose2',
    rating: 4.5,
    reviews: 92,
    owner: 'Hamza Khan',
    phone: '+92**********',
    radius: '10 km',
    businessMode: 'Car',
    status: 'Pending',
    address: 'House #12, Road #8, Jeddah',
  },
  {
    id: 3,
    name: 'Al Baik',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=albaik',
    rating: 4.8,
    reviews: 230,
    owner: 'Ahmed Ali',
    phone: '+92**********',
    radius: '15 km',
    businessMode: 'Bike',
    status: 'Pending',
    address: 'King Fahd Road, Riyadh',
  },
  {
    id: 4,
    name: 'Mama Noura',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=mama',
    rating: 4.1,
    reviews: 64,
    owner: 'Sara Hassan',
    phone: '+92**********',
    radius: '8 km',
    businessMode: 'Car',
    status: 'Pending',
    address: 'Olaya Street, Riyadh',
  },
];

export default function NewJoiningRequestsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [businessModeFilter, setBusinessModeFilter] = useState('All');
  const PER_PAGE = 10;

  const filtered = useMemo(
    () =>
      REQUESTS.filter((r) => {
        const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.owner.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || r.status === statusFilter;
        const matchMode = businessModeFilter === 'All' || r.businessMode === businessModeFilter;
        return matchSearch && matchStatus && matchMode;
      }),
    [search, statusFilter, businessModeFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    if (!filtered.length) return;
    const headers = ['SI', 'Restaurant Name', 'Owner', 'Phone', 'Radius', 'Business Mode', 'Status', 'Address'];
    const rows = filtered.map((r, i) => [
      i + 1, r.name, r.owner, r.phone, r.radius, r.businessMode, r.status, `"${r.address}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'joining-requests-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApprove = (id) => {
    toast.success(`Approved request #${id}`);
  };

  const handleReject = (id) => {
    toast.success(`Rejected request #${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-36">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Table toolbar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6001D2]" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search any order..."
                className="w-56 pl-3 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="relative flex items-center gap-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-11 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-4 z-10">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Status</p>
                    <div className="space-y-1">
                      {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
                        <label key={s} className="flex items-center gap-2 text-xs text-gray-700">
                          <input type="radio" name="statusFilter" value={s} checked={statusFilter === s} onChange={() => setStatusFilter(s)} />
                          <span>{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Business Mode</p>
                    <div className="space-y-1">
                      {['All', 'Car', 'Bike'].map((m) => (
                        <label key={m} className="flex items-center gap-2 text-xs text-gray-700">
                          <input type="radio" name="businessMode" value={m} checked={businessModeFilter === m} onChange={() => setBusinessModeFilter(m)} />
                          <span>{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => { setStatusFilter('All'); setBusinessModeFilter('All'); }}
                      className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                    >
                      Clear filters
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-black w-10">
                    SI
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Restaurant Info
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Owner Info
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Radius
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Business Mode
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-black">
                    Address
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors"
                  >
                    {/* SI */}
                    <td className="px-6 py-3 text-gray-400 text-xs">
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>

                    {/* Restaurant Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 overflow-hidden flex-shrink-0">
                          <img
                            src={r.image}
                            alt={r.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E1E24] text-xs">
                            {r.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {'★★★★★'.split('').map((s, i) => (
                              <span
                                key={i}
                                className={`text-[10px] ${
                                  i < Math.round(r.rating)
                                    ? 'text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="text-[10px] text-gray-400">
                              ({r.reviews})
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-[#1E1E24]">
                        {r.owner}
                      </p>
                      <p className="text-[10px] text-gray-400">{formatPhoneWithFlag(r.phone)}</p>
                    </td>

                    {/* Radius */}
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.radius}
                    </td>

                    {/* Business Mode */}
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.businessMode}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-50 text-orange-500">
                        {r.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition">
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-10 text-gray-400 text-sm"
                    >
                      No joining requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing{' '}
              {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
              {Math.min(page * PER_PAGE, filtered.length)} of{' '}
              {filtered.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    n === page
                      ? 'bg-purple-600 text-white border border-purple-600'
                      : 'border border-gray-200 text-gray-500 hover:border-purple-400'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
