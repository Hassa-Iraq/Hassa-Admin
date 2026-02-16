'use client'
import { ChevronDown } from 'lucide-react';

export default function TopDeliveryMan() {
  const deliveryMen = [
    { id: 1, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 2, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 3, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 4, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 5, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 6, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 7, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 8, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 9, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 10, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 11, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true },
    { id: 12, name: 'Hamza Khan', orders: 4, avatar: 'HK', online: true }
  ];

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          Top Delivery Man
        </h2>

        <div className="relative w-36">
          <select className="appearance-none w-full bg-white border border-[#7C3AED] rounded-md px-3 py-2 pr-8 text-sm text-[#7C3AED] focus:outline-none cursor-pointer">
            <option>Radius: 5km</option>
            <option>Radius: 10km</option>
            <option>Radius: 15km</option>
            <option>Radius: 20km</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C3AED] pointer-events-none" />
        </div>
      </div>

      {/* Scrollable Grid Section */}
      <div className="p-6 max-h-[320px] overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {deliveryMen.map((person) => (
            <div
              key={person.id}
             className="bg-white rounded-lg shadow-sm px-5 py-4 border border-gray-200 border-opacity-60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              {/* Avatar */}
              <div className="relative mb-2">
                <img
                  src={`https://ui-avatars.com/api/?name=${person.avatar}&background=555&color=fff&size=56`}
                  alt={person.name}
                  className="w-12 h-12 rounded-full"
                />
                {person.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal-400 rounded-full border-2 border-white"></span>
                )}
              </div>

              {/* Name */}
              <h3 className="text-[13px] font-medium text-gray-800 whitespace-nowrap">
                {person.name}
              </h3>

              {/* Orders */}
              <p className="text-[13px] text-teal-500 font-semibold mt-0.5">
                {person.orders} Orders
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}