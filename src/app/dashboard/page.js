import OrdersTable from "../components/OrdersTable";
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


export default function Dashboard() {
    return (
        <>
            <Topbar
                title="Dashboard Overview"
                subtitle="Welcome back Admin!"
                rightContent={
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option>Radius: 5km</option>
                        <option>Radius: 10km</option>
                    </select>
                }
            />
            <div className="pt-36 px-6 space-y-6">
                <OrderStats>
                    {stats.map((s, i) => (
                        <StatCard key={i} {...s} index={i} />
                    ))}
                </OrderStats>
                {/* </div> */}
                <RevenueChart />

                <div className="grid lg:grid-cols-2 gap-6">
                    <UserDonut />
                    <OrdersTable />
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
