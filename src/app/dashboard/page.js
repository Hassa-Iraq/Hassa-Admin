'use client';

import MostPopularRestaurants from "../components/PopularRestaurants";
import RevenueChart from "../components/RevenueChart";
import UserDonut from "../components/UserDonut";
import { stats } from "../data/DashboardData";
import StatCard from "../components/StatCard";
import OrderStats from "../components/OrderStats";
import TopDeliveryMan from "../components/TopDelivery";
import TopRestaurants from "../components/TopResturants";
import TopRatedFood from "../components/TopRatedFood";
import TopSellingFoods from "../components/TopSellingFood";
import Topbar from "../components/Topbar";
import { useLanguage } from "../i18n/LanguageContext";

export default function Dashboard() {
    const { t } = useLanguage();

    return (
        <>
            <Topbar
                title={t.dashboardOverview}
                subtitle={t.welcomeBack}
            />
            <div className="pt-32 md:pt-36 px-4 md:px-6 space-y-6 pb-16">
                <OrderStats>
                    {stats.map((s, i) => (
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
