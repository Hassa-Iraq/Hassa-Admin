'use client';

import { Download, Eye, Printer, Search, SlidersHorizontal } from 'lucide-react';

const ONGOING_ROWS = [
  {
    id: 1,
    orderId: 9912,
    orderDate: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+92**********',
    restaurant: 'Cafenio Restaurant',
    amount: '$ 2548.3',
    paymentStatus: 'Unpaid',
    orderStatus: 'Pending',
    orderType: 'Home Delivery',
  },
  {
    id: 2,
    orderId: 9912,
    orderDate: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+92**********',
    restaurant: 'Cafenio Restaurant',
    amount: '$ 2548.3',
    paymentStatus: 'Unpaid',
    orderStatus: 'Confirmed',
    orderType: 'Home Delivery',
  },
  {
    id: 3,
    orderId: 9912,
    orderDate: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+92**********',
    restaurant: 'Cafenio Restaurant',
    amount: '$ 2548.3',
    paymentStatus: 'Unpaid',
    orderStatus: 'Offline Payment',
    orderType: 'Home Delivery',
  },
  {
    id: 4,
    orderId: 9912,
    orderDate: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+92**********',
    restaurant: 'Cafenio Restaurant',
    amount: '$ 2548.3',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    orderType: 'Home Delivery',
  },
  {
    id: 5,
    orderId: 9912,
    orderDate: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+92**********',
    restaurant: 'Cafenio Restaurant',
    amount: '$ 2548.3',
    paymentStatus: 'Paid',
    orderStatus: 'Assigned',
    orderType: 'Home Delivery',
  },
  {
    id: 6,
    orderId: 9912,
    orderDate: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+92**********',
    restaurant: 'Cafenio Restaurant',
    amount: '$ 2548.3',
    paymentStatus: 'Paid',
    orderStatus: 'Accepted',
    orderType: 'Home Delivery',
  },
  {
    id: 7,
    orderId: 9912,
    orderDate: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+92**********',
    restaurant: 'Cafenio Restaurant',
    amount: '$ 2548.3',
    paymentStatus: 'Unpaid',
    orderStatus: 'Dine In',
    orderType: 'Home Delivery',
  },
  {
    id: 8,
    orderId: 9912,
    orderDate: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+92**********',
    restaurant: 'Cafenio Restaurant',
    amount: '$ 2548.3',
    paymentStatus: 'Paid',
    orderStatus: 'Out For Delivery',
    orderType: 'Home Delivery',
  },
];

const STATUS_STYLES = {
  Pending: 'bg-[#FFF7ED] text-[#F59E0B]',
  Confirmed: 'bg-[#F5F3FF] text-[#7C3AED]',
  'Offline Payment': 'bg-[#FFF7ED] text-[#FB923C]',
  Delivered: 'bg-[#ECFDF5] text-[#10B981]',
  Assigned: 'bg-[#FFF7ED] text-[#F97316]',
  Accepted: 'bg-[#FFF7ED] text-[#FB923C]',
  'Dine In': 'bg-[#FFF7ED] text-[#F59E0B]',
  'Out For Delivery': 'bg-[#ECFDF5] text-[#14B8A6]',
};

const PAYMENT_STYLES = {
  Paid: 'text-[#10B981]',
  Unpaid: 'text-[#EF4444]',
};

export default function OngoingOrdersPage() {
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
              {ONGOING_ROWS.map((row, index) => (
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
                    <p className={`text-[11px] ${PAYMENT_STYLES[row.paymentStatus] || 'text-gray-500'}`}>
                      {row.paymentStatus}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium ${
                        STATUS_STYLES[row.orderStatus] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
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
                        <Printer size={12} />
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
