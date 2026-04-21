'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Topbar from '@/app/components/Topbar';
import { useLanguage } from '@/app/i18n/LanguageContext';

export default function RestaurantListLayout({ children }) {
  const [userRole, setUserRole] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    try {
      const role = localStorage.getItem('userRole') || '';
      setUserRole(String(role).trim().toLowerCase());
    } catch {
      setUserRole('');
    }
  }, []);

  const addButtonLabel = userRole === 'restaurant' ? t.addBranch : t.newRestaurant;

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        titleKey="restaurantList"
        subtitleKey="welcomeBack"
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