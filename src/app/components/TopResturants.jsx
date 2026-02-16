'use client'
import { ChevronDown } from 'lucide-react';

export default function TopRestaurants() {
  const restaurants = [
    { id: 1, name: 'Rose Restaurant', orders: 4 },
    { id: 2, name: 'Rose Restaurant', orders: 4 },
    { id: 3, name: 'Rose Restaurant', orders: 4 },
    { id: 4, name: 'Rose Restaurant', orders: 4 },
    { id: 5, name: 'Rose Restaurant', orders: 4 },
    { id: 6, name: 'Rose Restaurant', orders: 4 },
    { id: 7, name: 'Rose Restaurant', orders: 4 },
    { id: 8, name: 'Rose Restaurant', orders: 4 },
    { id: 9, name: 'Rose Restaurant', orders: 4 }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-[#8A8A9E80]">
      {/* Header with border bottom */}
      <div className="flex items-center justify-between pb-4 border-b border-[#8A8A9E80] mb-6">
        <h2 className="text-lg font-bold text-gray-900">Top Restaurants</h2>
        
        {/* Radius Dropdown */}
        <div className="relative w-36">
          <select className="appearance-none w-full bg-white border border-[#6001D2] rounded-lg px-4 py-2 pr-10 text-sm text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
            <option>Radius: 5km</option>
            <option>Radius: 10km</option>
            <option>Radius: 15km</option>
            <option>Radius: 20km</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-600 pointer-events-none" />
        </div>
      </div>

      {/* Scrollable Restaurants Grid - 2 columns */}
      <div className="max-h-[320px] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white border border-[#6001D2] rounded-lg p-4 flex items-center gap-3 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              {/* Restaurant Logo */}
              <img
                src={`/images/restaurant.webp`}
                alt={restaurant.name}
                className="w-12 h-12 rounded-full"
              />

              {/* Restaurant Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  {restaurant.name}
                </h3>
                <p className="text-sm text-teal-600 font-semibold">
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