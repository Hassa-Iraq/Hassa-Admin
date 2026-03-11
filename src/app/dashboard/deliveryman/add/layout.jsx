'use client';

import Topbar from '@/app/components/Topbar';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AddDeliverymanLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<Topbar title="Add New Deliveryman" />}>
        <DeliverymanTopbar />
      </Suspense>
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}

function DeliverymanTopbar() {
  const searchParams = useSearchParams();
  const isEditMode = Boolean(searchParams.get('driver_user_id') || searchParams.get('id'));
  return <Topbar title={isEditMode ? 'Edit Deliveryman' : 'Add New Deliveryman'} />;
}
