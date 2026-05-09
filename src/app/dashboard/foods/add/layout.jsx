import { Suspense } from 'react';
import Topbar from '@/app/components/Topbar';
import { CenteredSpinner } from '@/app/components/LoadingSpinner';

export default function AddFoodLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title="Menu item"
        subtitle="Create a new item, then add options & add-ons on the edit screen."
      />
      <div className="px-6 pb-16">
        <main className="p-0">
          <Suspense
            fallback={<CenteredSpinner className="pt-36" minHeight="40vh" label="Loading" />}
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
