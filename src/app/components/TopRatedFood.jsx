'use client'
import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { API_BASE_URL } from '@/app/config';

const toAbsoluteAssetUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

export default function TopRatedFood() {
  const { t } = useLanguage();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const listToRender = useMemo(() => foods || [], [foods]);

  useEffect(() => {
    let cancelled = false;
    const fetchTopRatedFood = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/admin/analytics/top-rated-food?filter=overall', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch top rated food');

        const list =
          payload?.data?.foods ||
          payload?.data?.top_foods ||
          payload?.data?.items ||
          payload?.data ||
          payload?.foods ||
          payload?.top_foods ||
          payload?.items ||
          payload ||
          [];

        const normalized = (Array.isArray(list) ? list : []).slice(0, 8).map((f, idx) => ({
          id: f?.id ?? f?.food_id ?? f?.menu_item_id ?? `${idx}`,
          name: String(f?.name || f?.food_name || f?.title || f?.menu_item_name || '').trim() || 'N/A',
          rating:
            Number(
              f?.rating ??
              f?.avg_rating ??
              f?.avgRating ??
              f?.rating_score ??
              0
            ) || 0,
          reviews:
            Number(
              f?.reviews ??
              f?.review_count ??
              f?.rating_count ??
              f?.order_items_count ??
              0
            ) || 0,
          image: toAbsoluteAssetUrl(
            f?.menu_item_image_url ||
              f?.image_url ||
              f?.image ||
              f?.photo_url ||
              f?.photo ||
              ''
          ),
        }));

        if (!cancelled) setFoods(normalized);
      } catch {
        if (!cancelled) setFoods([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTopRatedFood();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          {t.topRatedFood}
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full text-sm text-gray-500">Loading...</div>
          ) : (
            listToRender.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-lg shadow-sm py-3 px-2 border border-gray-200/60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              <div className="mb-1.5">
                <img
                  src={food.image || '/icons/food.png'}
                  alt={food.name}
                  className="w-14 h-14 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/icons/food.png';
                  }}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
