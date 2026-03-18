'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Topbar from '@/app/components/Topbar';

const TITLE_BY_PATH = {
  '/dashboard/reports/transaction': 'Transaction Report',
  '/dashboard/reports/order/regular': 'Regular Order Report',
  '/dashboard/reports/order/coupon': 'Coupon Order Report',
  '/dashboard/reports/restaurant': 'Restaurant Report',
  '/dashboard/reports/food': 'Food Report',
  '/dashboard/reports/customer': 'Customer Wallet Report',
  '/dashboard/reports/tax': 'Generate Tax Report',
  '/dashboard/reports/restaurant-vat': 'Generate Tax Report',
};

export default function ReportsLayout({ children }) {
  const pathname = usePathname();

  const title = useMemo(() => {
    if (!pathname) return 'Reports';
    return TITLE_BY_PATH[pathname] || 'Reports';
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
