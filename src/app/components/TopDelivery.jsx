'use client'

import { useLanguage } from '@/app/i18n/LanguageContext';

export default function TopDeliveryMan() {
  const { t } = useLanguage();
  const deliveryMen = [
    { id: 1, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 2, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 3, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 4, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 5, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 6, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 7, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 8, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true }
  ];

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          {t.topDeliveryMan}
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {deliveryMen.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-lg shadow-sm py-3 border border-gray-200/60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              <div className="relative mb-1.5">
                <img
                  src={`https://ui-avatars.com/api/?name=${person.avatar}&background=555&color=fff&size=56`}
                  alt={person.name}
                  className="w-11 h-11 rounded-full"
                />
                {person.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal-400 rounded-full border-2 border-white"></span>
                )}
              </div>

              <span className="text-[13px] font-medium text-gray-800 leading-tight">
                {person.name}
              </span>

              <span className="text-[13px] text-teal-500 font-semibold leading-tight mt-0.5">
                {person.orders} Orders
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
