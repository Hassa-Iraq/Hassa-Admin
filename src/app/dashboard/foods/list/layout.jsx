import Link from 'next/link';
import Topbar from '@/app/components/Topbar';

export default function FoodListLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title="Food List"
        subtitle="Welcome back Admin!"
        rightContent={
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-[#7C3AED] bg-white px-3 py-2 text-xs font-semibold text-[#7C3AED] hover:bg-[#F8F4FF]">
              Out of Stock
            </button>
            <Link href="/dashboard/foods/add">
              <button className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
                + New Food
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
