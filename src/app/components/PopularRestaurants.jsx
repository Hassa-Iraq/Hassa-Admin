'use client'
import { ChevronDown, Heart } from 'lucide-react';

export default function MostPopularRestaurants() {
  const restaurants = [
    { id: 1, name: 'Rose Restaurant', image: '/restaurant-logo.png', favorites: 3 },
    { id: 2, name: 'Rose Restaurant', image: '/restaurant-logo.png', favorites: 3 },
    { id: 3, name: 'Rose Restaurant', image: '/restaurant-logo.png', favorites: 3 },
    { id: 4, name: 'Rose Restaurant', image: '/restaurant-logo.png', favorites: 3 },
    { id: 5, name: 'Rose Restaurant', image: '/restaurant-logo.png', favorites: 3 }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-[#8A8A9E80]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#8A8A9E80] mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Most Popular Restaurants
        </h2>
        
        <div className="relative w-32">
          <select className="appearance-none w-full bg-white border border-purple-300 rounded-lg px-2 py-2 pr-10 text-sm text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
            <option>Radius: 5km</option>
            <option>Radius: 10km</option>
            <option>Radius: 15km</option>
            <option>Radius: 20km</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-600 pointer-events-none" />
        </div>
      </div>

      {/* Overall Dropdown */}
      <div className="flex justify-end mb-4">
        <div className="relative w-32">
          <select className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
            <option>Overall</option>
            <option>This Month</option>
            <option>This Week</option>
            <option>Today</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Restaurant List (No Scroll) */}
      <div>
        <div className="space-y-3">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex items-center justify-between bg-purple-50 border border-[#6001D2] rounded-lg p-3 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`https://tse4.mm.bing.net/th/id/OIP.qOEjssW7vOnbuoTsXFmF5wHaEU?cb=defcache2&defcache=1&rs=1&pid=ImgDetMain&o=7&rm=3`}
                  alt={restaurant.name}
                  className="w-10 h-10 rounded-full"
                />
                <span className="text-sm font-semibold text-gray-900">
                  {restaurant.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {restaurant.favorites}
                </span>
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
