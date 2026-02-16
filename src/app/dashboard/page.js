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


export default function Dashboard() {
    return (
        <div className="space-y-6">
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
    );
}
