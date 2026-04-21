import Link from 'next/link';
import Topbar from '@/app/components/Topbar';

export default function EmployeeListLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        titleKey="employees"
        subtitleKey="manageEmployeesHere"
        title="Employees"
        subtitle="Manage all your employees here"
        rightContent={
          <Link href="/dashboard/employees/add">
            <button className="rounded-lg bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]">
              + Add New Employee
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
