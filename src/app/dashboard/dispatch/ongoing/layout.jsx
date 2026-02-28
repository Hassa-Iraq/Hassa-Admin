import Topbar from '@/app/components/Topbar';

export default function DispatchOngoingLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar title="Ongoing Orders" subtitle="Manage all active and scheduled orders" />
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}
