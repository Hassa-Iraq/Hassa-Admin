'use client';

import Link from 'next/link';
import Topbar from '@/app/components/Topbar';
import { useLanguage } from '@/app/i18n/LanguageContext';

export default function FoodListLayout({ children }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        titleKey="foodList"
        subtitleKey="welcomeBack"
        title="Food List"
        subtitle="Welcome back Admin!"
        rightContent={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/foods/add">
              <button className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
                {t.newFood}
              </button>
            </Link>
          </div>
        }
      />
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}
