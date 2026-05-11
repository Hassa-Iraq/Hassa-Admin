import { Suspense } from 'react';
import RestaurantWithdrawPage from './RestaurantWithdrawPage';
import TableLoadingSkeleton from '@/app/components/TableLoadingSkeleton';

export default function Page() {
  return (
    <Suspense
      fallback={
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#1E1E24]">Withdraw Request Table</h3>
          </div>
          <table className="w-full">
            <tbody>
              <TableLoadingSkeleton colSpan={6} rows={8} variant="cells" />
            </tbody>
          </table>
        </section>
      }
    >
      <RestaurantWithdrawPage />
    </Suspense>
  );
}