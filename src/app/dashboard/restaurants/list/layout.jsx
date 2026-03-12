'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Topbar from '@/app/components/Topbar';

export default function RestaurantListLayout({ children }) {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    try {
      const role = localStorage.getItem('userRole') || '';
      setUserRole(String(role).trim().toLowerCase());
    } catch {
      setUserRole('');
    }
  }, []);

  const addButtonLabel = userRole === 'restaurant' ? '+ Add Branch' : '+ New Restaurant';

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title="Restaurant List"
        subtitle="Welcome back Admin!"
        rightContent={
          <Link href="/dashboard/restaurants/add">
            <button className="bg-[#7C3AED] text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-[#6D28D9]">
              {addButtonLabel}
            </button>
          </Link>
        }
      />
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}