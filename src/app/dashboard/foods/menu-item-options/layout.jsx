import { Suspense } from 'react';
import Topbar from '@/app/components/Topbar';

export default function MenuItemOptionsLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title="Items options & add-ons"
        subtitle="Option groups per menu item — sizes and extras in one place"
      />
      <div className="px-6 pb-16">
        <main className="p-0">
          <Suspense fallback={<p className="pt-36 text-sm text-gray-500">Loading…</p>}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
