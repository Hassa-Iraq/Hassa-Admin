'use client';

import { useMemo, useState } from 'react';
import { Download, Pencil, Search, SlidersHorizontal, Trash2 } from 'lucide-react';

const MOCK_FOODS = [
  { id: 1, name: 'Beef Stroganoff', category: 'varieties', price: '$ 95.00', rating: 4.9, reviews: 120, image: '/images/food.png', status: true },
  { id: 2, name: 'Beef Stroganoff', category: 'varieties', price: '$ 95.00', rating: 4.9, reviews: 120, image: '/images/food.png', status: true },
  { id: 3, name: 'Beef Stroganoff', category: 'varieties', price: '$ 95.00', rating: 4.9, reviews: 120, image: '/images/food.png', status: true },
  { id: 4, name: 'Beef Stroganoff', category: 'varieties', price: '$ 95.00', rating: 4.9, reviews: 120, image: '/images/food.png', status: true },
];

export default function FoodListPage() {
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(MOCK_FOODS.map((item) => [item.id, item.status]))
  );

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MOCK_FOODS;
    return MOCK_FOODS.filter((item) => item.name.toLowerCase().includes(query));
  }, [search]);

  const toggleStatus = (id) => {
    setStatuses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="pt-36 pb-8">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search any food..."
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
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Category</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Price</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Average Ratings</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFoods.map((food, index) => (
                <tr key={food.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 overflow-hidden rounded-lg bg-purple-100">
                        <img src={food.image} alt={food.name} className="h-full w-full object-cover" />
                      </div>
                      <p className="text-xs font-semibold text-[#1E1E24]">{food.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{food.category}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{food.price}</td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleStatus(food.id)}
                      className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors ${
                        statuses[food.id] ? 'bg-[#7C3AED]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          statuses[food.id] ? 'translate-x-[17px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">
                    <span className="text-[#F59E0B]">★</span>
                    {food.rating}({food.reviews})
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#7C3AED] bg-[#F8F4FF] text-[#7C3AED]">
                        <Pencil size={12} />
                      </button>
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredFoods.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                    No foods found.
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
