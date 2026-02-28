'use client';

import { useMemo, useState } from 'react';
import { Download, Search, SlidersHorizontal } from 'lucide-react';

const MOCK_CATEGORIES = [
  { id: 1, image: '/images/food.png', categoryId: 12, name: 'Varieties' },
  { id: 2, image: '/images/food.png', categoryId: 12, name: 'Varieties' },
  { id: 3, image: '/images/food.png', categoryId: 12, name: 'Varieties' },
  { id: 4, image: '/images/food.png', categoryId: 12, name: 'Varieties' },
  { id: 5, image: '/images/food.png', categoryId: 12, name: 'Varieties' },
];

export default function CategoryListPage() {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MOCK_CATEGORIES;
    return MOCK_CATEGORIES.filter((item) => item.name.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="pt-36 pb-8">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search any category..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Download size={12} />
              <span>Export</span>
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <SlidersHorizontal size={12} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Image</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Category ID</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Category Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="h-7 w-7 overflow-hidden rounded-lg bg-purple-100">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.categoryId}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{item.name}</td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
