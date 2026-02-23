'use client'

import { useLanguage } from '@/app/i18n/LanguageContext';

export default function TopSellingFoods() {
  const { t } = useLanguage();
  const foods = [
    { id: 1, name: 'Beef Stroganoff' },
    { id: 2, name: 'Name' },
    { id: 3, name: 'Name' },
    { id: 4, name: 'Name' },
    { id: 5, name: 'Name' },
    { id: 6, name: 'Name' }
  ];

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          {t.topSellingFoods}
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {foods.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-lg shadow-sm p-2 border border-gray-200/60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              <div className="mb-1.5 w-full">
                <img
                  src="https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop"
                  alt={food.name}
                  className="w-full h-20 rounded-lg object-cover"
                />
              </div>

              <span className="text-[13px] font-medium text-gray-800 text-center leading-tight">
                {food.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
