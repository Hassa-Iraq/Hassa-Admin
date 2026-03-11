'use client';

import Topbar from '@/app/components/Topbar';
import { useSearchParams } from 'next/navigation';

export default function AddDeliverymanLayout({ children }) {
  const searchParams = useSearchParams();
  const isEditMode = Boolean(searchParams.get('driver_user_id') || searchParams.get('id'));

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar title={isEditMode ? 'Edit Deliveryman' : 'Add New Deliveryman'} />
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}
