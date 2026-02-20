'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search as SearchIcon,
  Download,
  SlidersHorizontal,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Mock orders data for demo – adjust to your API later
const ORDERS = [
  {
    id: 1,
    orderId: '#9792',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 59.23',
    status: 'Pending',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
  },
  {
    id: 2,
    orderId: '#9793',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 19.99',
    status: 'Accepted',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
  },
  {
    id: 3,
    orderId: '#9794',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 42.10',
    status: 'Scheduled',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
  },
  {
    id: 4,
    orderId: '#9795',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 12.50',
    status: 'Processing',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
  },
  {
    id: 5,
    orderId: '#9796',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 27.80',
    status: 'Food On The Way',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
  },
  {
    id: 6,
    orderId: '#9797',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 33.40',
    status: 'Delivered',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Paid',
  },
  {
    id: 7,
    orderId: '#9798',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 14.70',
    status: 'Cancelled',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Failed',
  },
  {
    id: 8,
    orderId: '#9799',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 9.99',
    status: 'Refunded',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Refunded',
  },
  {
    id: 9,
    orderId: '#9800',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 21.60',
    status: 'Dine In',
    orderType: 'Dine In',
    paymentMethod: 'Offline Payment',
    paymentStatus: 'Paid',
  },
  {
    id: 10,
    orderId: '#9801',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 18.30',
    status: 'Offline Payments',
    orderType: 'Home Delivery',
    paymentMethod: 'Offline Payment',
    paymentStatus: 'Paid',
  },
  {
    id: 11,
    orderId: '#9802',
    date: '16 Dec 2025',
    customerName: 'Hamza Khan',
    customerPhone: '+971 123 456 789',
    restaurant: 'Cafeteria Restaurant',
    totalAmount: '$ 48.90',
    status: 'Payments Failed',
    orderType: 'Home Delivery',
    paymentMethod: 'Online',
    paymentStatus: 'Failed',
  },
];

const statusStyles = {
  Scheduled: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  Processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Food On The Way': 'bg-purple-50 text-purple-700 border-purple-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  Refunded: 'bg-orange-50 text-orange-700 border-orange-200',
  'Offline Payments': 'bg-slate-50 text-slate-700 border-slate-200',
  'Payments Failed': 'bg-pink-50 text-pink-700 border-pink-200',
};

const paymentStatusStyles = {
  Paid: 'text-emerald-600',
  Unpaid: 'text-amber-500',
  Failed: 'text-rose-500',
  Refunded: 'text-indigo-500',
};

/**
 * Main orders table used on orders pages.
 * - filterLabel: "All" | "Pending" | "Accepted" | ...
 */
export default function OrdersListTable({ filterLabel = 'All', filterSlug='all' }) {
  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const router = useRouter();

  const filteredOrders = useMemo(() => {
    let base = ORDERS;

    // Apply sidebar filter label
    if (filterLabel && filterLabel !== 'All') {
      if (filterLabel === 'Offline Payments') {
        base = base.filter((order) => order.paymentMethod === 'Offline Payment');
      } else if (filterLabel === 'Payments Failed') {
        base = base.filter((order) => order.paymentStatus === 'Failed');
      } else {
        base = base.filter((order) => order.status === filterLabel);
      }
    }

    // Apply text search (by order id or customer)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      base = base.filter(
        (order) =>
          order.orderId.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerPhone.toLowerCase().includes(q)
      );
    }

    // Apply order type filter
    if (orderTypeFilter !== 'All') {
      base = base.filter((order) => order.orderType === orderTypeFilter);
    }

    // Apply payment status filter
    if (paymentStatusFilter !== 'All') {
      base = base.filter((order) => order.paymentStatus === paymentStatusFilter);
    }

    return base;
  }, [filterLabel, search, orderTypeFilter, paymentStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PER_PAGE));
  const paginatedOrders = filteredOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    if (!filteredOrders.length) return;

    const headers = [
      'Sl',
      'Order ID',
      'Order Date',
      'Customer Name',
      'Customer Phone',
      'Restaurant',
      'Total Amount',
      'Payment Status',
      'Order Status',
      'Order Type',
      'Payment Method',
    ];

    const rows = filteredOrders.map((order, index) => [
      index + 1,
      order.orderId,
      order.date,
      order.customerName,
      order.customerPhone,
      order.restaurant,
      order.totalAmount,
      order.paymentStatus,
      order.status,
      order.orderType,
      order.paymentMethod,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'orders-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E4E4ED]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 border-b border-[#E4E4ED]">
        <div>
          {/* <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          <p className="text-xs text-gray-500">
            Manage all active and scheduled orders
          </p> */}
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6001D2]" />
            <input
              type="text"
              placeholder="Search any order..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-56 pl-3 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-11 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 space-y-4 z-10">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Order Type
                </p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="orderType"
                      value="All"
                      checked={orderTypeFilter === 'All'}
                      onChange={() => setOrderTypeFilter('All')}
                    />
                    <span>All orders</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="orderType"
                      value="Home Delivery"
                      checked={orderTypeFilter === 'Home Delivery'}
                      onChange={() => setOrderTypeFilter('Home Delivery')}
                    />
                    <span>Home Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="orderType"
                      value="Dine In"
                      checked={orderTypeFilter === 'Dine In'}
                      onChange={() => setOrderTypeFilter('Dine In')}
                    />
                    <span>Dine In</span>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Payment Status
                </p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="All"
                      checked={paymentStatusFilter === 'All'}
                      onChange={() => setPaymentStatusFilter('All')}
                    />
                    <span>All</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="Paid"
                      checked={paymentStatusFilter === 'Paid'}
                      onChange={() => setPaymentStatusFilter('Paid')}
                    />
                    <span>Paid</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="Failed"
                      checked={paymentStatusFilter === 'Failed'}
                      onChange={() => setPaymentStatusFilter('Failed')}
                    />
                    <span>Failed</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="radio"
                      name="paymentStatus"
                      value="Refunded"
                      checked={paymentStatusFilter === 'Refunded'}
                      onChange={() => setPaymentStatusFilter('Refunded')}
                    />
                    <span>Refunded</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setOrderTypeFilter('All');
                    setPaymentStatusFilter('All');
                  }}
                  className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-[16px] md:text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-[#1E1E24]">
              <th className="py-3 px-6 font-bold whitespace-nowrap">Sl</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Order ID</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Order Date</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Customer Information</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Restaurant</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Total Amount</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Order Status</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order, index) => {
              const chipClass =
                statusStyles[order.status] ??
                'bg-gray-50 text-[#1E1E24] border-gray-200';

              return (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/dashboard/orders/all/${order.id}`)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="py-3 px-6 text-gray-500 whitespace-nowrap">{(page - 1) * PER_PAGE + index + 1}</td>
                  <td className="py-3 px-4 font-regular text-gray-900 whitespace-nowrap">
                    {order.orderId}
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{order.date}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-regular text-gray-900">
                        {order.customerName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.customerPhone}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{order.restaurant}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-regular text-gray-900">
                        {order.totalAmount}
                      </span>
                      <span
                        className={`text-xs font-regular ${
                          paymentStatusStyles[order.paymentStatus] ??
                          'text-gray-500'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-semibold ${chipClass}`}
                    >
                      {order.status}
                    </span>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {order.orderType}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
  <div className="flex justify-end gap-2">

    {/* View */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/dashboard/orders/all/${order.id}`);
      }}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-orange-500 hover:bg-orange-100 transition"
    >
      <Eye className="w-4 h-4" />
    </button>

    {/* Print */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        console.log('Print order', order.id);
      }}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
    >
      <Printer className="w-4 h-4" />
    </button>

  </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {paginatedOrders.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            No orders found for this filter.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Showing {Math.min((page - 1) * PER_PAGE + 1, filteredOrders.length)}–{Math.min(page * PER_PAGE, filteredOrders.length)} of {filteredOrders.length} results
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                n === page
                  ? 'bg-purple-600 text-white border border-purple-600'
                  : 'border border-gray-200 text-gray-500 hover:border-purple-400'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

