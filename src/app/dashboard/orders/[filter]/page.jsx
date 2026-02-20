import OrdersListTable from "@/app/components/OrdersListTable";
import Topbar from "@/app/components/Topbar";

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
      />

      <div className="pt-36 px-6 pb-10">
              {/* <OrdersListTable filterLabel={label} /> */}
              <OrdersListTable filterLabel={label} filterSlug={filter} />

          </div>
    </>
  );
}

