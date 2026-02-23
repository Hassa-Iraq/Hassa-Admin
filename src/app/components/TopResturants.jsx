'use client'

import { useLanguage } from '@/app/i18n/LanguageContext';

export default function TopRestaurants() {
  const { t } = useLanguage();
  const restaurants = [
    { id: 1, name: 'Rose Restaurant', orders: 4 },
    { id: 2, name: 'Rose Restaurant', orders: 4 },
    { id: 3, name: 'Rose Restaurant', orders: 4 },
    { id: 4, name: 'Rose Restaurant', orders: 4 },
    { id: 5, name: 'Rose Restaurant', orders: 4 },
    { id: 6, name: 'Rose Restaurant', orders: 4 },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">{t.topRestaurants}</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white border border-[#6001D2] rounded-lg px-3 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <img
                src="/images/restaurant.webp"
                alt={restaurant.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />

              <div className="min-w-0">
                <h3 className="text-[13px] font-medium text-gray-800 leading-tight">
                  {restaurant.name}
                </h3>
                <p className="text-[13px] text-teal-600 font-semibold leading-tight mt-0.5">
                  {restaurant.orders} Orders
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
