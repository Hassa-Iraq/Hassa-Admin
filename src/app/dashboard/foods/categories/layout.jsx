import Topbar from '@/app/components/Topbar';

export default function FoodCategoriesLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar title="Category List" subtitle="Welcome back Admin!" />
      <div className="px-6 pb-16">
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}
