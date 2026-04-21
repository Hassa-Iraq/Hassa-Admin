'use client';

import Link from 'next/link';
import Topbar from '@/app/components/Topbar';
import { useLanguage } from '@/app/i18n/LanguageContext';

export default function CuisineCategoriesLayout({ children }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        titleKey="cuisineCategories"
        subtitleKey="welcomeBack"
        title="Cuisine Categories"
        subtitle="Welcome back Admin!"
        rightContent={
          <Link href="/dashboard/foods/cuisine-categories/add">
            <button className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
              {t.addCuisineCta}
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

