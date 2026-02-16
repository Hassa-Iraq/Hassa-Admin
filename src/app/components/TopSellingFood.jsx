'use client'
import { ChevronDown } from 'lucide-react';

export default function TopSellingFoods() {
  const foods = [
    { id: 1, name: 'Beef Stroganoff' },
    { id: 2, name: 'Name' },
    { id: 3, name: 'Name' },
    { id: 4, name: 'Name' },
    { id: 5, name: 'Name' },
    { id: 6, name: 'Name' },
    { id: 7, name: 'Name' },
    { id: 8, name: 'Name' },
    { id: 9, name: 'Name' }
  ];

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          Top Selling Foods
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {foods.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 border-opacity-60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              {/* Food Image */}
              <div className="mb-2 w-full">
                <img
                  src="https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop"
                  alt={food.name}
                  className="w-full h-24 rounded-lg object-cover"
                />
              </div>

              {/* Food Name */}
              <h3 className="text-[14px] font-medium text-gray-800 text-center">
                {food.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}