'use client'
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Heart } from 'lucide-react';
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

const normalizeName = (entity) =>
  String(entity?.name || entity?.restaurant_name || entity?.full_name || '').trim() || 'N/A';

export default function MostPopularRestaurants() {
  const [filter, setFilter] = useState('overall');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const restaurantsToRender = useMemo(() => restaurants || [], [restaurants]);

  useEffect(() => {
    let cancelled = false;
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(
          `/api/admin/analytics/popular-restaurants?filter=${encodeURIComponent(filter)}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch popular restaurants');

        const list =
          payload?.data?.restaurants ||
          payload?.data?.data ||
          payload?.data ||
          payload?.restaurants ||
          payload ||
          [];

        const normalized = (Array.isArray(list) ? list : []).slice(0, 5).map((r, idx) => ({
          id: r?.restaurant_id ?? r?.id ?? r?.vendor_id ?? `${idx}`,
          rank: Number(r?.rank ?? r?.position ?? idx + 1) || idx + 1,
          name: normalizeName(r),
          image: toAbsoluteAssetUrl(r?.logo_url || r?.image_url || r?.image || r?.photo_url || ''),
        }));

        if (!cancelled) setRestaurants(normalized);
      } catch {
        if (!cancelled) setRestaurants([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRestaurants();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-[#8A8A9E80]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#8A8A9E80] mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Most Popular Restaurants
        </h2>
      </div>

      {/* Overall Dropdown */}
      <div className="flex justify-end mb-4">
        <div className="relative w-32">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="overall">Overall</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="today">Today</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Restaurant List (No Scroll) */}
      <div>
        <div className="space-y-3">
          {loading && (
            <div className="text-sm text-gray-500">Loading...</div>
          )}

          {!loading &&
            restaurantsToRender.map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex items-center justify-between bg-purple-50 border border-[#6001D2] rounded-lg p-3 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={restaurant.image || '/images/restaurant.webp'}
                  alt={restaurant.name}
                  className="w-10 h-10 rounded-full"
                />
                <span className="text-sm font-semibold text-gray-900">
                  {restaurant.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {restaurant.rank}
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
