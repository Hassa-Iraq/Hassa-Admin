import OrdersListTable from "@/app/components/OrdersListTable";
import Topbar from "@/app/components/Topbar";
import OrderDetailPage from "./[id]/page";

const labelBySlug = {
  all: 'All',
  pending: 'Pending',
  accepted: 'Accepted',
  processing: 'Processing',
  scheduled: 'Scheduled',
  'food-on-the-way': 'Food On The Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  'dine-in': 'Dine In',
  'offline-payments': 'Offline Payments',
  'payments-failed': 'Payments Failed',
};

export default async function OrdersFilteredPage({ params }) {
  const { filter } = await params;
  const label = labelBySlug[filter] ?? 'All';

  const title = label === 'All' ? 'Orders' : `${label} Orders`;

  return (
    <>
      <Topbar
        title={title}
        subtitle="Manage all active and scheduled orders"
        rightContent={
          <button className="bg-[#7C3AED] text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-[#6D28D9]">
            + New Order
          </button>
        }
      />

      <div className="pt-36 px-6 pb-10">
              {/* <OrdersListTable filterLabel={label} /> */}
              <OrdersListTable filterLabel={label} filterSlug={filter} />

          </div>
    </>
  );
}

