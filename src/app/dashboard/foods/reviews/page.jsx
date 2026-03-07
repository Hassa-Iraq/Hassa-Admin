'use client';

import { Download, Search, SlidersHorizontal } from 'lucide-react';
import { formatPhoneWithFlag } from '@/app/lib/phone';

const REVIEWS = [
  {
    id: 1,
    foodName: 'Beef Stroganoff',
    image: '',
    customer: 'Hamza Khan',
    phone: '+8 ********',
    rating: 4.9,
    review: 'Pizza packaging and test was so good...',
    date: '09 Jan 2026',
    time: '08:25 am',
    canReply: true,
  },
  {
    id: 2,
    foodName: 'Beef Stroganoff',
    image: '',
    customer: 'Hamza Khan',
    phone: '+8 ********',
    rating: 4.9,
    review: 'Pizza packaging and test was so good...',
    date: '09 Jan 2026',
    time: '08:25 am',
    canReply: false,
  },
  {
    id: 3,
    foodName: 'Beef Stroganoff',
    image: '',
    customer: 'Hamza Khan',
    phone: '+8 ********',
    rating: 4.9,
    review: 'Pizza packaging and test was so good...',
    date: '09 Jan 2026',
    time: '08:25 am',
    canReply: true,
  },
  {
    id: 4,
    foodName: 'Beef Stroganoff',
    image: '',
    customer: 'Hamza Khan',
    phone: '+8 ********',
    rating: 4.9,
    review: 'Pizza packaging and test was so good...',
    date: '09 Jan 2026',
    time: '08:25 am',
    canReply: false,
  },
];

export default function CustomerReviewsPage() {
  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              placeholder="Search any food name..."
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
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Name</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Category</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Review</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Date</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Action</th>
              </tr>
            </thead>
            <tbody>
              {REVIEWS.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 overflow-hidden rounded-lg bg-purple-100">
                        <img src={item.image || null} alt={item.foodName} className="h-full w-full object-cover" />
                      </div>
                      <p className="text-xs font-semibold text-[#1E1E24]">{item.foodName}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-semibold text-[#1E1E24]">{item.customer}</p>
                    <p className="text-[11px] text-gray-500">{formatPhoneWithFlag(item.phone)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-[#1E1E24]">
                      <span className="text-[#F59E0B]">★</span> {item.rating}
                    </p>
                    <p className="max-w-[260px] truncate text-xs text-[#1E1E24]">{item.review}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-[#1E1E24]">{item.date}</p>
                    <p className="text-[11px] text-gray-500">{item.time}</p>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        item.canReply
                          ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                          : 'border border-[#7C3AED] bg-white text-[#7C3AED] hover:bg-[#F8F4FF]'
                      }`}
                    >
                      {item.canReply ? 'View Reply' : 'Give Reply'}
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
