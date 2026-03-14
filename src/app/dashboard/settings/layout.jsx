'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Topbar from '@/app/components/Topbar';

const TITLE_BY_PATH = {
  '/dashboard/settings/business-setup': 'Business Setup',
  '/dashboard/settings/payment-method': 'Payment Settings',
  '/dashboard/settings/social-media': 'Social Media',
  '/dashboard/settings/deliveryman': 'Deliveryman Settings',
};

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  const title = useMemo(() => {
    if (!pathname) return 'Settings';
    return TITLE_BY_PATH[pathname] || 'Settings';
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar title={title} subtitle="Welcome back Admin!" />
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}
