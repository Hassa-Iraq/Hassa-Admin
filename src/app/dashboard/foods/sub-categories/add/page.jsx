'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AddSubcategoryPage() {
  const [restaurantId, setRestaurantId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const id =
      localStorage.getItem('restaurant_id') ||
      localStorage.getItem('selectedRestaurantId') ||
      '';
    setRestaurantId(id);
  }, []);

  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-[#1E1E24]">Add Subcategory</h3>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Restaurant ID</label>
            <input
              value={restaurantId}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Category ID</label>
            <input
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="Enter Category ID"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-medium text-gray-700">Subcategory Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Subcategory Name"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Link href="/dashboard/foods/sub-categories">
            <button className="rounded-lg border border-[#D8B4FE] bg-white px-5 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]">
              Back
            </button>
          </Link>
          <button className="rounded-lg bg-[#7C3AED] px-5 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
            Save Subcategory
          </button>
        </div>
      </section>
    </div>
  );
}
