'use client'
import { ChevronDown, Star } from 'lucide-react';

export default function TopRatedFood() {
  const foods = [
    { id: 1, name: 'Beef Stroganoff', rating: 4, price: 200 },
    { id: 2, name: 'Beef Stroganoff', rating: 4, price: 200 },
    { id: 3, name: 'Beef Stroganoff', rating: 4, price: 200 },
    { id: 4, name: 'Beef Stroganoff', rating: 4, price: 200 },
    { id: 5, name: 'Beef Stroganoff', rating: 4, price: 200 },
    { id: 6, name: 'Beef Stroganoff', rating: 4, price: 200 },
    { id: 7, name: 'Beef Stroganoff', rating: 4, price: 200 },
    { id: 8, name: 'Beef Stroganoff', rating: 4, price: 200 },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          Top Rated Food
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

      {/* Grid Section (No Scroll) */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {foods.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-lg shadow-sm px-4 py-4 border border-gray-200 border-opacity-60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              <div className="mb-2">
                <img
                  src="https://images.unsplash.com/photo-1574484284002-952d92456975?w=200&h=200&fit=crop"
                  alt={food.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              </div>

              <h3 className="text-[13px] font-medium text-gray-800 text-center mb-1">
                {food.name}
              </h3>

              <div className="flex items-center gap-1 mb-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[12px] text-gray-700 font-semibold">
                  {food.rating} ({food.price})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
