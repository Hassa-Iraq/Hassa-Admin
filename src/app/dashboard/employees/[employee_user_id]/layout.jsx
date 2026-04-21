import Link from 'next/link';
import Topbar from '@/app/components/Topbar';

export default function EmployeeDetailLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title="Employee Details"
        subtitle="View employee information"
        rightContent={
          <Link href="/dashboard/employees/list">
            <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              Back to list
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

