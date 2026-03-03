import Link from 'next/link';
import Topbar from '@/app/components/Topbar';

export default function FoodCategoriesLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title="Category List"
        subtitle="Welcome back Admin!"
        rightContent={
          <Link href="/dashboard/foods/categories/add">
            <button className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
              + Add Category
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
