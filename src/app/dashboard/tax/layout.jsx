'use client';

import Topbar from '@/app/components/Topbar';

export default function TaxLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title="All Taxes"
        subtitle="Welcome back Admin!"
        rightContent={
          <button className="rounded-md bg-[#7C3AED] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
            + Create Tax
          </button>
        }
      />
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}
