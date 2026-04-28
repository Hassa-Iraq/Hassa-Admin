'use client'

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
  const [filter, setFilter] = useState('overall');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const listToRender = useMemo(() => restaurants || [], [restaurants]);

  useEffect(() => {
    let cancelled = false;

    const fetchTopRestaurants = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({ filter });
        const res = await fetch(`/api/admin/analytics/top-restaurants?${params.toString()}`, {
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
          id: r?.restaurant_id ?? r?.id ?? `${idx}`,
          rank: Number(r?.rank ?? r?.position ?? idx + 1) || idx + 1,
          name: String(r?.restaurant_name || r?.name || '').trim() || 'N/A',
          orders:
            Number(
              r?.delivered_orders ??
              r?.deliveredOrders ??
              r?.total_orders ??
              r?.totalOrders ??
              r?.orders ??
              r?.order_count ??
              0
            ) || 0,
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
  }, [filter]);

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">{t.topRestaurants}</h2>
        <div className="relative w-32">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none w-full bg-white border border-[#8A8A9E80] rounded-lg px-4 py-2 pr-10 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="overall">{t.overall || 'Overall'}</option>
            <option value="this_month">{t.thisMonth || 'This Month'}</option>
            <option value="this_year">{t.thisYear || 'This Year'}</option>
            <option value="today">{t.today || 'Today'}</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#6001D2] rounded-lg px-3 py-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200/80 animate-pulse flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-28 rounded bg-gray-200/80 animate-pulse" />
                    <div className="h-4 w-24 rounded bg-gray-200/80 animate-pulse mt-1" />
                  </div>
                </div>
              ))
            : listToRender.map((restaurant) => (
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
                  {restaurant.orders} Orders <span className="text-gray-400 font-medium">•</span> #{restaurant.rank}
                </p>
              </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}
