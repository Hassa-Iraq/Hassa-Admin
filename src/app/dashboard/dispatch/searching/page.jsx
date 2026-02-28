'use client';

import { Download, Eye, Package, Search, SlidersHorizontal } from 'lucide-react';

const ORDERS = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  orderId: 9912,
  orderDate: '16 Dec 2025',
  customerName: 'Hamza Khan',
  customerPhone: '+91**********',
  restaurant: 'Cafenia Restaurant',
  amount: '$ 2548.3',
  paymentStatus: 'Unpaid',
  orderStatus: 'Pending',
  orderType: 'Home Delivery',
}));

export default function SearchingDeliverymenPage() {
  return (
    <div className="pt-36 pb-8">
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C3AED]" />
            <input
              placeholder="Search any order..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[#7C3AED] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <Download size={12} />
              <span>Export</span>
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
              <SlidersHorizontal size={12} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">SI</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Order ID</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Order Date</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Customer Information</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Restaurant</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Total Amount</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Order Status</th>
                <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#1E1E24]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((row, index) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.orderId}</td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.orderDate}</td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-[#1E1E24]">{row.customerName}</p>
                    <p className="text-[11px] text-gray-500">{row.customerPhone}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#1E1E24]">{row.restaurant}</td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-[#1E1E24]">{row.amount}</p>
                    <p className="text-[11px] text-[#EF4444]">{row.paymentStatus}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-block rounded-sm bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-medium text-[#F59E0B]">
                      {row.orderStatus}
                    </span>
                    <p className="mt-0.5 text-[11px] text-[#1E1E24]">{row.orderType}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#FDBA74] bg-[#FFF7ED] text-[#F97316]">
                        <Eye size={12} />
                      </button>
                      <button className="flex h-6 w-6 items-center justify-center rounded-md border border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]">
                        <Package size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
