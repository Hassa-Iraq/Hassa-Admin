'use client';

import MostPopularRestaurants from "../components/PopularRestaurants";
import RevenueChart from "../components/RevenueChart";
import UserDonut from "../components/UserDonut";
import { stats as statsTemplate } from "../data/DashboardData";
import StatCard from "../components/StatCard";
import OrderStats from "../components/OrderStats";
import TopDeliveryMan from "../components/TopDelivery";
import TopRestaurants from "../components/TopResturants";
import TopRatedFood from "../components/TopRatedFood";
import TopSellingFoods from "../components/TopSellingFood";
import Topbar from "../components/Topbar";
import { useLanguage } from "../i18n/LanguageContext";
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dashboard() {
    const { t } = useLanguage();
    const [orderStatsCards, setOrderStatsCards] = useState(statsTemplate);
    const [orderStatsFilter, setOrderStatsFilter] = useState('overall');

    useEffect(() => {
      let cancelled = false;

      const fetchOrderStats = async () => {
        try {
          const token = localStorage.getItem('token') || '';
          const params = new URLSearchParams({ filter: orderStatsFilter });
          const res = await fetch(`/api/admin/analytics/order-statistics?${params.toString()}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const payload = await res.json();
          if (!res.ok) {
            throw new Error(payload?.message || 'Failed to fetch order statistics');
          }

          const raw = payload?.data || payload?.result || payload || {};

          const counts = {
            delivered:
              raw?.delivered ??
              raw?.delivered_orders ??
              raw?.deliveredOrders ??
              raw?.deliveredOrderCount ??
              0,
            cancelled:
              raw?.cancelled ??
              raw?.canceled ??
              raw?.cancelled_orders ??
              raw?.cancelledOrders ??
              raw?.cancelledOrderCount ??
              0,
            refunded:
              raw?.refunded ??
              raw?.refunded_orders ??
              raw?.refunds ??
              0,
            paymentFailed:
              raw?.payment_failed ??
              raw?.paymentFailed ??
              raw?.payments_failed ??
              raw?.payment_failed_orders ??
              raw?.paymentFailedOrders ??
              0,
            unassigned:
              raw?.unassigned ??
              raw?.unassigned_orders ??
              raw?.unassignedOrders ??
              0,
            acceptedByRider:
              raw?.accepted_by_rider ??
              raw?.acceptedByRider ??
              raw?.rider_accepted ??
              raw?.acceptedOrdersByRider ??
              0,
            cookingInRestaurants:
              raw?.cooking_in_restaurants ??
              raw?.cookingInRestaurants ??
              raw?.cooking ??
              raw?.cooking_orders ??
              0,
            pickedUpByRider:
              raw?.picked_up_by_rider ??
              raw?.pickedUpByRider ??
              raw?.picked_up ??
              raw?.pickedUpOrders ??
              0,
          };

          const getValueByTitle = (title) => {
            const lower = String(title || '').toLowerCase();
            if (lower.includes('delivered')) return counts.delivered;
            if (lower.includes('cancel')) return counts.cancelled;
            if (lower.includes('refund')) return counts.refunded;
            if (lower.includes('payment') && lower.includes('fail')) return counts.paymentFailed;
            if (lower.includes('unassigned')) return counts.unassigned;
            if (lower.includes('accepted') && lower.includes('rider')) return counts.acceptedByRider;
            if (lower.includes('cooking')) return counts.cookingInRestaurants;
            if (lower.includes('picked') && lower.includes('rider')) return counts.pickedUpByRider;
            return 0;
          };

          const next = statsTemplate.map((s) => ({
            ...s,
            value: getValueByTitle(s.title),
          }));

          if (!cancelled) setOrderStatsCards(next);
        } catch {
          if (!cancelled) setOrderStatsCards(statsTemplate);
        }
      };

      fetchOrderStats();

      return () => {
        cancelled = true;
      };
    }, [orderStatsFilter]);

    return (
        <>
            <Topbar
                title={t.dashboardOverview}
                subtitle={t.welcomeBack}
            />
            <div className="pt-32 md:pt-36 px-4 md:px-6 space-y-6 pb-16">
                <OrderStats
                  rightContent={
                    <div className="relative w-32">
                      <select
                        value={orderStatsFilter}
                        onChange={(e) => setOrderStatsFilter(e.target.value)}
                        className="appearance-none w-full bg-white border border-[#8A8A9E80] rounded-lg px-4 py-2 pr-10 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="overall">{t.overall || 'Overall'}</option>
                        <option value="this_month">{t.thisMonth || 'This Month'}</option>
                        <option value="this_year">{t.thisYear || 'This Year'}</option>
                        <option value="today">{t.today || 'Today'}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  }
                >
                    {orderStatsCards.map((s, i) => (
                        <StatCard key={i} {...s} index={i} />
                    ))}
                </OrderStats>
                <RevenueChart />

                <div className="grid lg:grid-cols-2 gap-6">
                    <UserDonut />
                    <MostPopularRestaurants />
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <TopDeliveryMan />
                    <TopRestaurants />
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <TopRatedFood />
                    <TopSellingFoods />
                </div>
            </div >
        </>
    );
}
