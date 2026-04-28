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

export default function TopDeliveryMan() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('overall');
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [loading, setLoading] = useState(false);

  const menToRender = useMemo(() => deliveryMen || [], [deliveryMen]);

  useEffect(() => {
    let cancelled = false;

    const fetchDeliveryMen = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || '';
        const params = new URLSearchParams({ filter });
        const res = await fetch(`/api/admin/analytics/top-delivery-men?${params.toString()}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to fetch top delivery men');

        const list =
          payload?.data?.delivery_men ??
          payload?.data?.top_delivery_men ??
          payload?.delivery_men ??
          payload?.top_delivery_men ??
          payload?.data ??
          payload ??
          [];

        const normalized = (Array.isArray(list) ? list : []).slice(0, 8).map((p, idx) => {
          const name = String(p?.driver_name || p?.name || p?.full_name || p?.user?.full_name || '').trim() || 'N/A';
          const rank = Number(p?.rank ?? p?.position ?? idx + 1) || idx + 1;
          const orders =
            Number(
              p?.delivered_orders ??
              p?.deliveredOrders ??
              p?.total_deliveries ??
              p?.totalDeliveries ??
              p?.orders ??
              p?.order_count ??
              p?.total_orders ??
              0
            ) || 0;
          const avatarUrl = toAbsoluteAssetUrl(
            p?.profile_picture_url ||
              p?.avatar_url ||
              p?.image_url ||
              p?.avatar ||
              p?.driver_avatar ||
              ''
          );
          const online = p?.online ?? p?.is_online ?? true;

          return {
            id: p?.driver_id ?? p?.id ?? p?.driver_user_id ?? p?.user_id ?? `${idx}`,
            rank,
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
  }, [filter]);

  return (
    <div className="bg-white rounded-xl border border-[#8A8A9E80] shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#CFCFD6]">
        <h2 className="text-lg font-bold text-gray-900">
          {t.topDeliveryMan}
        </h2>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-sm py-3 border border-gray-200/60 flex flex-col items-center"
                >
                  <div className="relative mb-1.5">
                    <div className="w-11 h-11 rounded-full bg-gray-200/80 animate-pulse" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-200/80 rounded-full border-2 border-white" />
                  </div>
                  <span className="h-4 w-20 rounded bg-gray-200/80 animate-pulse" />
                  <span className="h-4 w-16 rounded bg-gray-200/80 animate-pulse mt-1" />
                </div>
              ))
            : menToRender.map((person) => (
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
                {person.orders} Orders <span className="text-gray-400 font-medium">•</span> #{person.rank}
              </span>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}
