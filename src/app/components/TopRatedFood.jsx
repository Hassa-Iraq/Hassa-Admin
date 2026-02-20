'use client'
import { Star } from 'lucide-react';

export default function TopRatedFood() {
  const foods = [
    { id: 1, name: 'Beef Stroganoff', rating: 4.6, reviews: 161 },
    { id: 2, name: 'Beef Stroganoff', rating: 4.6, reviews: 161 },
    { id: 3, name: 'Beef Stroganoff', rating: 4.6, reviews: 161 },
    { id: 4, name: 'Beef Stroganoff', rating: 4.6, reviews: 161 },
    { id: 5, name: 'Beef Stroganoff', rating: 4.6, reviews: 161 },
    { id: 6, name: 'Beef Stroganoff', rating: 4.6, reviews: 161 },
    { id: 7, name: 'Beef Stroganoff', rating: 4.6, reviews: 161 },
    { id: 8, name: 'Beef Stroganoff', rating: 4.6, reviews: 161 }
  ];

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          Top Rated Food
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-4 gap-3">
          {foods.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-lg shadow-sm py-3 px-2 border border-gray-200/60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              <div className="mb-1.5">
                <img
                  src="https://images.unsplash.com/photo-1574484284002-952d92456975?w=200&h=200&fit=crop"
                  alt={food.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
              </div>

              <span className="text-[13px] font-medium text-gray-800 leading-tight text-center">
                {food.name}
              </span>

              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[12px] text-gray-600 font-medium">
                  {food.rating} ({food.reviews})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
