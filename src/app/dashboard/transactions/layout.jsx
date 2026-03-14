'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Topbar from '@/app/components/Topbar';

const TITLE_BY_PATH = {
  '/dashboard/transactions/collect-cash': 'Cash Collection',
  '/dashboard/transactions/restaurant-withdraw': 'Restaurant Withdraw Transaction',
  '/dashboard/transactions/deliveryman-payments': 'Deliveryman Payments',
  '/dashboard/transactions/withdraw-method': 'Withdraw Method List',
};

export default function TransactionsLayout({ children }) {
  const pathname = usePathname();

  const title = useMemo(() => {
    if (!pathname) return 'Transaction Management';
    return TITLE_BY_PATH[pathname] || 'Transaction Management';
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
