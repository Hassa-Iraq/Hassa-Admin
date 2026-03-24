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

export default function TopSellingFoods() {
  const { t } = useLanguage();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const listToRender = useMemo(() => foods || [], [foods]);

  useEffect(() => {
    let cancelled = false;

    const fetchTopSelling = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/admin/analytics/top-selling-food?filter=overall', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch top selling food');

        const list =
          payload?.data?.foods ||
          payload?.data?.top_foods ||
          payload?.data ||
          payload?.foods ||
          payload?.top_foods ||
          payload ||
          [];

        const normalized = (Array.isArray(list) ? list : []).slice(0, 6).map((f, idx) => ({
          id: f?.id ?? f?.food_id ?? f?.menu_item_id ?? `${idx}`,
          name: String(f?.name || f?.food_name || f?.title || '').trim() || 'N/A',
          image: toAbsoluteAssetUrl(f?.image_url || f?.image || f?.photo_url || f?.photo || ''),
        }));

        if (!cancelled) setFoods(normalized);
      } catch {
        if (!cancelled) setFoods([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTopSelling();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          {t.topSellingFoods}
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-full text-sm text-gray-500">Loading...</div>
          ) : (
            listToRender.map((food) => (
            <div
              key={food.id}
              className="bg-white rounded-lg shadow-sm p-2 border border-gray-200/60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              <div className="mb-1.5 w-full">
                <img
                  src={food.image || '/images/food.webp'}
                  alt={food.name}
                  className="w-full h-20 rounded-lg object-cover"
                />
              </div>

              <span className="text-[13px] font-medium text-gray-800 text-center leading-tight">
                {food.name}
              </span>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
