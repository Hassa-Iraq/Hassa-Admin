import Topbar from '@/app/components/Topbar';

export default function DeliverymanReviewsLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar titleKey="deliverymanReviews" title="Deliveryman Reviews" />
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}
