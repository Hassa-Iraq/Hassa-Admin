'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Download,
  CreditCard, TrendingUp, ArrowDownLeft,
  Eye, Edit2, Trash2,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// ─── mock data ────────────────────────────────────────────────────────────────
const FIXED_RATINGS  = [4.2, 4.8, 4.1, 4.5, 4.9, 4.3, 4.7, 4.0, 4.6, 4.4, 4.2, 4.8];
const FIXED_REVIEWS  = [82, 156, 63, 120, 194, 75, 143, 51, 178, 99, 67, 211];

const RESTAURANTS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: 'Rose Restaurant',
  image: `https://api.dicebear.com/7.x/shapes/svg?seed=rose${i}`,
  rating: FIXED_RATINGS[i].toFixed(1),
  reviews: FIXED_REVIEWS[i],
  owner: 'Hamza Khan',
  ownerEmail: '@hamzakhan',
  radius: ['5 km', 'All over the world'][i % 2],
  cuisine: ['Cuisine not found', 'Italian', 'Arabian', 'Sea Food', 'Halal', 'Syrian', 'Saudi', 'Turkish', 'Indian'][i % 9],
  status: i % 5 !== 0,
}));

const STATS = [
  { label: 'Total Restaurants',        value: 24, icon: '/images/mdi.png',    bg: 'bg-[#F3EAFF]', border: 'border-[#6001D2]' },
  { label: 'Active Restaurants',       value: 8,  icon: '/images/location.png',   bg: 'bg-[#E6FFF5]', border: 'border-[#00C49A]' },
  { label: 'Inactive Restaurants',     value: 0,  icon: '/images/food-inactive.png', bg: 'bg-[#FFF0F0]', border: 'border-[#FF6B6B]' },
  { label: 'Newly joined Restaurants', value: 3,  icon: '/images/food.png',         bg: 'bg-[#FFF7E6]', border: 'border-[#FF9F43]' },
];

const TRANSACTIONS = [
  { label: 'Total Transactions',           value: '$5',         icon: CreditCard,    color: 'text-[#6001D2]', dot: 'bg-[#6001D2]' },
  { label: 'Commission Earned',            value: '$ 12,546',   icon: TrendingUp,    color: 'text-[#00C49A]', dot: 'bg-[#00C49A]' },
  { label: 'Total Restaurant Withdraws',   value: '$ 12546.34', icon: ArrowDownLeft, color: 'text-[#FF6B6B]', dot: 'bg-[#FF6B6B]' },
];

// ─── component ────────────────────────────────────────────────────────────────
export default function RestaurantListPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState(
    Object.fromEntries(RESTAURANTS.map(r => [r.id, r.status]))
  );
  const [page, setPage] = useState(1);
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [radiusFilter, setRadiusFilter]   = useState('');
  const [modelFilter, setModelFilter]     = useState('');

  const filtered = RESTAURANTS.filter(r => {
    const matchSearch  = r.name.toLowerCase().includes(search.toLowerCase()) || r.owner.toLowerCase().includes(search.toLowerCase());
    const matchCuisine = !cuisineFilter || r.cuisine === cuisineFilter;
    const matchRadius  = !radiusFilter  || r.radius  === radiusFilter;
    return matchSearch && matchCuisine && matchRadius;
  });

  const PER_PAGE = 10;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggle = (id) => setStatuses(p => ({ ...p, [id]: !p[id] }));

  return (
     <div className="min-h-screen bg-gray-50">
  <div className="pt-36">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
        </div>

      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: 'All', value: '', setter: setModelFilter,  state: modelFilter },
        ].map(f => (
          <button
            key={f.label}
            onClick={() => f.setter('')}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-purple-400 transition"
          >
            All ▾
          </button>
        ))}
        <select
          value={modelFilter}
          onChange={e => setModelFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Business Model</option>
          <option>Dine-in</option>
          <option>Delivery</option>
          <option>Takeaway</option>
        </select>
        <select
          value={cuisineFilter}
          onChange={e => setCuisineFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Select Cuisine</option>
          {['Italian','Arabian','Sea Food','Halal','Syrian','Saudi','Turkish','Indian'].map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={radiusFilter}
          onChange={e => setRadiusFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Select Radius</option>
          <option>5 km</option>
          <option>All over the world</option>
        </select>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {STATS.map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border ${s.border} p-5 flex items-start justify-between`}>
            <div>
              <p className="text-[24px] font-semibold text-[#1E1E24]">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
            <img src={s.icon} alt={s.label} className="w-6 h-6 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* ── Transaction Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap items-center justify-between">
        {TRANSACTIONS.map(t => (
          <div key={t.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${t.dot} flex-shrink-0`} />
            <span className={`text-[11px] uppercase tracking-wide font-medium ${t.color}`}>{t.label} :</span>
            <span className={`text-sm font-bold ${t.color}`}>{t.value}</span>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Table Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1E1E24]">Restaurant List</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by restaurant name..."
                className="pl-4 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 w-72"
              />
            </div>
            <button className="flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
              <Download size={14} strokeWidth={1.5} /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-3 text-[12px] font-semibold text-[#1E1E24]">SI</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1E1E24]">Restaurant Info</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1E1E24]">Owner Information</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1E1E24]">Radius</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1E1E24]">Cuisine</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1E1E24]">Status</th>
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, idx) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors"
                >
                  {/* SI */}
                  <td className="px-6 py-3 text-gray-400 text-xs">{(page - 1) * PER_PAGE + idx + 1}</td>

                  {/* Restaurant Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 overflow-hidden flex-shrink-0">
                        <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1E1E24] text-xs">{r.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {'★★★★★'.split('').map((s, i) => (
                            <span key={i} className={`text-[10px] ${i < Math.round(r.rating) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
                          ))}
                          <span className="text-[10px] text-gray-400">({r.reviews})</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-[#1E1E24]">{r.owner}</p>
                    <p className="text-[10px] text-gray-400">{r.ownerEmail}</p>
                  </td>

                  {/* Radius */}
                  <td className="px-4 py-3 text-xs text-gray-600">{r.radius}</td>

                  {/* Cuisine */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      r.cuisine === 'Cuisine not found'
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-purple-50 text-purple-700'
                    }`}>
                      {r.cuisine}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(r.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        statuses[r.id] ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                          statuses[r.id] ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition">
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => router.push('/add-restaurant')}
                        className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-amber-100 transition"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                    No restaurants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
