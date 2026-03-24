'use client'

import { useEffect, useMemo, useState } from 'react';
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

export default function TopRestaurants() {
  const { t } = useLanguage();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const listToRender = useMemo(() => restaurants || [], [restaurants]);

  useEffect(() => {
    let cancelled = false;

    const fetchTopRestaurants = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/admin/analytics/top-restaurants?filter=this_year', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch top restaurants');

        const list =
          payload?.data?.restaurants ||
          payload?.data ||
          payload?.restaurants ||
          payload?.top_restaurants ||
          payload?.topRestaurants ||
          payload ||
          [];

        const normalized = (Array.isArray(list) ? list : []).slice(0, 6).map((r, idx) => ({
          id: r?.id ?? r?.restaurant_id ?? `${idx}`,
          name: String(r?.name || r?.restaurant_name || '').trim() || 'N/A',
          orders: Number(r?.orders || r?.order_count || r?.total_orders || 0) || 0,
          image: toAbsoluteAssetUrl(r?.logo_url || r?.image_url || r?.image || r?.photo_url || ''),
        }));

        if (!cancelled) setRestaurants(normalized);
      } catch {
        if (!cancelled) setRestaurants([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTopRestaurants();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">{t.topRestaurants}</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            <div className="col-span-full text-sm text-gray-500">Loading...</div>
          ) : (
            listToRender.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white border border-[#6001D2] rounded-lg px-3 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <img
                src={restaurant.image || '/images/restaurant.webp'}
                alt={restaurant.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />

              <div className="min-w-0">
                <h3 className="text-[13px] font-medium text-gray-800 leading-tight">
                  {restaurant.name}
                </h3>
                <p className="text-[13px] text-teal-600 font-semibold leading-tight mt-0.5">
                  {restaurant.orders} Orders
                </p>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
