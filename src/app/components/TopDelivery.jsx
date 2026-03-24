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

export default function TopDeliveryMan() {
  const { t } = useLanguage();
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [loading, setLoading] = useState(false);

  const menToRender = useMemo(() => deliveryMen || [], [deliveryMen]);

  useEffect(() => {
    let cancelled = false;

    const fetchDeliveryMen = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/admin/analytics/top-delivery-men?filter=this_month', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch top delivery men');

        const list =
          payload?.data?.delivery_men ||
          payload?.data?.top_delivery_men ||
          payload?.data ||
          payload?.delivery_men ||
          payload?.top_delivery_men ||
          payload ||
          [];

        const normalized = (Array.isArray(list) ? list : []).slice(0, 8).map((p, idx) => {
          const name =
            String(p?.name || p?.full_name || p?.user?.full_name || p?.first_name || '').trim() ||
            'N/A';
          const orders = Number(p?.orders || p?.order_count || p?.total_orders || p?.completed_orders || 0) || 0;
          const avatarUrl = toAbsoluteAssetUrl(
            p?.profile_picture_url || p?.avatar_url || p?.image_url || p?.avatar || ''
          );
          const online = p?.online ?? p?.is_online ?? true;

          return {
            id: p?.id ?? p?.driver_user_id ?? p?.user_id ?? `${idx}`,
            name,
            orders,
            avatar: avatarUrl,
            online,
          };
        });

        if (!cancelled) setDeliveryMen(normalized);
      } catch {
        if (!cancelled) setDeliveryMen([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDeliveryMen();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          {t.topDeliveryMan}
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full text-sm text-gray-500">Loading...</div>
          ) : (
            menToRender.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-lg shadow-sm py-3 border border-gray-200/60 flex flex-col items-center cursor-pointer transition hover:shadow-md"
            >
              <div className="relative mb-1.5">
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-11 h-11 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=555&color=fff&size=56`;
                    }}
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=555&color=fff&size=56`}
                    alt={person.name}
                    className="w-11 h-11 rounded-full"
                  />
                )}
                {person.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal-400 rounded-full border-2 border-white"></span>
                )}
              </div>

              <span className="text-[13px] font-medium text-gray-800 leading-tight">
                {person.name}
              </span>

              <span className="text-[13px] text-teal-500 font-semibold leading-tight mt-0.5">
                {person.orders} Orders
              </span>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
